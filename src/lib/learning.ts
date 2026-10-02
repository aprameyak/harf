import { prisma } from "@/lib/db";
import { levelFromXp, todayKey } from "@/lib/utils";
export async function trackEvent(event: string, userId: string | null | undefined, payload?: Record<string, unknown>) {
    await prisma.analyticsEvent.create({
        data: {
            event,
            userId: userId ?? null,
            payload: payload ? JSON.stringify(payload) : null,
        },
    });
}
export function nextMasteryUpdate(opts: {
    mastery: number;
    correct: boolean;
    easeFactor: number;
    intervalDays: number;
    streak: number;
}) {
    let { mastery, easeFactor, intervalDays, streak } = opts;
    const now = new Date();
    if (opts.correct) {
        streak += 1;
        mastery = Math.min(1, mastery + (mastery < 0.3 ? 0.2 : 0.12));
        easeFactor = Math.min(3.0, easeFactor + 0.05);
        if (intervalDays < 1)
            intervalDays = 1;
        else
            intervalDays = Math.round(intervalDays * easeFactor * 10) / 10;
    }
    else {
        streak = 0;
        mastery = Math.max(0, mastery - 0.18);
        easeFactor = Math.max(1.3, easeFactor - 0.2);
        intervalDays = 0.25;
    }
    const nextReviewAt = new Date(now.getTime() + intervalDays * 24 * 60 * 60 * 1000);
    return { mastery, easeFactor, intervalDays, streak, nextReviewAt, lastSeenAt: now };
}
export async function applyExerciseResult(opts: {
    userId: string;
    exerciseId: string;
    conceptIds: string[];
    correct: boolean;
    userAnswer: string;
    expectedAnswer?: string;
    timeMs?: number;
    confusedConceptKey?: string;
}) {
    const { userId, exerciseId, conceptIds, correct, userAnswer, expectedAnswer, timeMs, } = opts;
    await prisma.exerciseAttempt.create({
        data: {
            userId,
            exerciseId,
            correct,
            userAnswer,
            expectedAnswer,
            timeMs,
        },
    });
    await trackEvent(correct ? "exercise_answered" : "exercise_incorrect", userId, {
        exerciseId,
        correct,
        conceptIds,
    });
    for (const conceptId of conceptIds) {
        const existing = await prisma.userConceptMastery.findUnique({
            where: { userId_conceptId: { userId, conceptId } },
        });
        const base = existing ?? {
            mastery: 0,
            easeFactor: 2.5,
            intervalDays: 0,
            streak: 0,
            exposures: 0,
            correctCount: 0,
            incorrectCount: 0,
            confusedWith: null as string | null,
        };
        const updated = nextMasteryUpdate({
            mastery: base.mastery,
            correct,
            easeFactor: base.easeFactor,
            intervalDays: base.intervalDays,
            streak: base.streak,
        });
        let confusedWith = base.confusedWith
            ? (JSON.parse(base.confusedWith) as string[])
            : [];
        if (!correct && opts.confusedConceptKey) {
            confusedWith = [...new Set([...confusedWith, opts.confusedConceptKey])].slice(-8);
        }
        const wasMastered = base.mastery >= 0.8;
        const nowMastered = updated.mastery >= 0.8;
        await prisma.userConceptMastery.upsert({
            where: { userId_conceptId: { userId, conceptId } },
            create: {
                userId,
                conceptId,
                mastery: updated.mastery,
                easeFactor: updated.easeFactor,
                intervalDays: updated.intervalDays,
                streak: updated.streak,
                nextReviewAt: updated.nextReviewAt,
                lastSeenAt: updated.lastSeenAt,
                exposures: 1,
                correctCount: correct ? 1 : 0,
                incorrectCount: correct ? 0 : 1,
                confusedWith: confusedWith.length ? JSON.stringify(confusedWith) : null,
            },
            update: {
                mastery: updated.mastery,
                easeFactor: updated.easeFactor,
                intervalDays: updated.intervalDays,
                streak: updated.streak,
                nextReviewAt: updated.nextReviewAt,
                lastSeenAt: updated.lastSeenAt,
                exposures: { increment: 1 },
                correctCount: correct ? { increment: 1 } : undefined,
                incorrectCount: correct ? undefined : { increment: 1 },
                confusedWith: confusedWith.length ? JSON.stringify(confusedWith) : null,
            },
        });
        if (!correct || updated.mastery < 0.8) {
            await prisma.reviewQueueItem.upsert({
                where: { userId_conceptId: { userId, conceptId } },
                create: {
                    userId,
                    conceptId,
                    priority: correct ? 1 : 3,
                    reason: correct ? "spaced" : "mistake",
                    dueAt: updated.nextReviewAt,
                },
                update: {
                    priority: correct ? 1 : 3,
                    reason: correct ? "spaced" : "mistake",
                    dueAt: updated.nextReviewAt,
                },
            });
        }
        else {
            await prisma.reviewQueueItem.deleteMany({
                where: { userId, conceptId },
            });
        }
        if (!wasMastered && nowMastered) {
            await trackEvent("concept_mastered", userId, { conceptId });
        }
    }
}
export async function awardXp(userId: string, amount: number) {
    const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
    const today = todayKey();
    let dailyXpEarned = user.dailyXpEarned;
    let currentStreak = user.currentStreak;
    let longestStreak = user.longestStreak;
    if (user.lastActiveDate !== today) {
        const yesterday = todayKey(new Date(Date.now() - 86400000));
        if (user.lastActiveDate === yesterday) {
            currentStreak += 1;
            await trackEvent("streak_extended", userId, { streak: currentStreak });
        }
        else {
            currentStreak = 1;
        }
        dailyXpEarned = 0;
        longestStreak = Math.max(longestStreak, currentStreak);
    }
    dailyXpEarned += amount;
    const xp = user.xp + amount;
    const level = levelFromXp(xp);
    if (currentStreak >= 7) {
        await unlockAchievement(userId, "streak_7");
    }
    return prisma.user.update({
        where: { id: userId },
        data: {
            xp,
            level,
            dailyXpEarned,
            currentStreak,
            longestStreak,
            lastActiveDate: today,
        },
    });
}
export async function unlockAchievement(userId: string, key: string) {
    const achievement = await prisma.achievement.findUnique({ where: { key } });
    if (!achievement)
        return null;
    const existing = await prisma.userAchievement.findUnique({
        where: {
            userId_achievementId: { userId, achievementId: achievement.id },
        },
    });
    if (existing)
        return null;
    await prisma.userAchievement.create({
        data: { userId, achievementId: achievement.id },
    });
    await awardXp(userId, achievement.xpReward);
    return achievement;
}
export async function completeLesson(opts: {
    userId: string;
    lessonId: string;
    accuracy: number;
    perfect: boolean;
}) {
    const lesson = await prisma.lesson.findUniqueOrThrow({
        where: { id: opts.lessonId },
        include: { unit: { include: { lessons: { orderBy: { order: "asc" } } } } },
    });
    const xp = Math.round(lesson.xpReward * (0.6 + 0.4 * opts.accuracy) + (opts.perfect ? 10 : 0));
    await prisma.userLessonProgress.upsert({
        where: {
            userId_lessonId: { userId: opts.userId, lessonId: opts.lessonId },
        },
        create: {
            userId: opts.userId,
            lessonId: opts.lessonId,
            status: "completed",
            accuracy: opts.accuracy,
            score: opts.accuracy,
            xpEarned: xp,
            perfect: opts.perfect,
            startedAt: new Date(),
            completedAt: new Date(),
            attempts: 1,
        },
        update: {
            status: "completed",
            accuracy: opts.accuracy,
            score: opts.accuracy,
            xpEarned: xp,
            perfect: opts.perfect || undefined,
            completedAt: new Date(),
            attempts: { increment: 1 },
        },
    });
    const lessons = lesson.unit.lessons.filter((l) => l.published);
    const idx = lessons.findIndex((l) => l.id === lesson.id);
    const next = lessons[idx + 1];
    if (next) {
        await prisma.userLessonProgress.upsert({
            where: {
                userId_lessonId: { userId: opts.userId, lessonId: next.id },
            },
            create: {
                userId: opts.userId,
                lessonId: next.id,
                status: "available",
            },
            update: {
                status: "available",
            },
        });
    }
    else {
        const nextUnit = await prisma.unit.findFirst({
            where: {
                courseId: lesson.unit.courseId,
                order: { gt: lesson.unit.order },
                published: true,
            },
            orderBy: { order: "asc" },
            include: { lessons: { where: { published: true }, orderBy: { order: "asc" }, take: 1 } },
        });
        if (nextUnit?.lessons[0]) {
            await prisma.userLessonProgress.upsert({
                where: {
                    userId_lessonId: {
                        userId: opts.userId,
                        lessonId: nextUnit.lessons[0].id,
                    },
                },
                create: {
                    userId: opts.userId,
                    lessonId: nextUnit.lessons[0].id,
                    status: "available",
                },
                update: { status: "available" },
            });
        }
    }
    await awardXp(opts.userId, xp);
    await trackEvent("lesson_completed", opts.userId, {
        lessonId: opts.lessonId,
        accuracy: opts.accuracy,
        perfect: opts.perfect,
        xp,
    });
    if (opts.perfect)
        await unlockAchievement(opts.userId, "perfect_lesson");
    const masteredLetters = await prisma.userConceptMastery.count({
        where: {
            userId: opts.userId,
            mastery: { gte: 0.8 },
            concept: { kind: "letter" },
        },
    });
    if (masteredLetters >= 1)
        await unlockAchievement(opts.userId, "first_letter");
    if (masteredLetters >= 10)
        await unlockAchievement(opts.userId, "ten_letters");
    if (masteredLetters >= 28)
        await unlockAchievement(opts.userId, "alphabet_master");
    return { xp };
}
export async function ensurePathUnlocked(userId: string) {
    const firstLesson = await prisma.lesson.findFirst({
        where: { published: true, unit: { published: true, order: 0 } },
        orderBy: [{ unit: { order: "asc" } }, { order: "asc" }],
    });
    if (!firstLesson)
        return;
    await prisma.userLessonProgress.upsert({
        where: { userId_lessonId: { userId, lessonId: firstLesson.id } },
        create: { userId, lessonId: firstLesson.id, status: "available" },
        update: {},
    });
}
export async function assertLessonPlayable(userId: string, lessonId: string) {
    const lesson = await prisma.lesson.findUnique({
        where: { id: lessonId },
        include: { unit: true },
    });
    if (!lesson || !lesson.published || !lesson.unit.published) {
        throw new Error("Lesson not available");
    }
    const progress = await prisma.userLessonProgress.findUnique({
        where: { userId_lessonId: { userId, lessonId } },
    });
    if (progress &&
        (progress.status === "available" ||
            progress.status === "in_progress" ||
            progress.status === "completed")) {
        return;
    }
    const firstLesson = await prisma.lesson.findFirst({
        where: { published: true, unit: { published: true } },
        orderBy: [{ unit: { order: "asc" } }, { order: "asc" }],
    });
    if (firstLesson?.id === lessonId) {
        await ensurePathUnlocked(userId);
        return;
    }
    throw new Error("Lesson locked");
}
export async function getReviewDueCount(userId: string) {
    return prisma.reviewQueueItem.count({
        where: { userId, dueAt: { lte: new Date() } },
    });
}
