"use server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { applyExerciseResult, completeLesson, trackEvent, ensurePathUnlocked, assertLessonPlayable, } from "@/lib/learning";
import { normalizeAnswer, validateAnswer } from "@/lib/transliteration/engine";
import { revalidatePath } from "next/cache";
import { z } from "zod";
function parseJsonArray(value: string | null | undefined): string[] {
    if (!value)
        return [];
    try {
        return JSON.parse(value) as string[];
    }
    catch {
        return [];
    }
}
function gradeMatchingAnswer(answer: string, accepted: string[]): boolean {
    try {
        const pairs = JSON.parse(answer) as Record<string, string>;
        if (!pairs || typeof pairs !== "object" || Array.isArray(pairs))
            return false;
        const expected = new Map<string, string>();
        for (const item of accepted) {
            const eq = item.indexOf("=");
            if (eq <= 0)
                return false;
            expected.set(item.slice(0, eq), item.slice(eq + 1));
        }
        if (expected.size === 0 || Object.keys(pairs).length !== expected.size)
            return false;
        for (const [ar, la] of expected) {
            if (pairs[ar] !== la)
                return false;
        }
        return true;
    }
    catch {
        return false;
    }
}
function gradeExercise(exercise: {
    type: string;
    promptArabic: string | null;
}, answer: string, accepted: string[]): boolean {
    if (exercise.type === "intro")
        return true;
    if (exercise.type === "matching")
        return gradeMatchingAnswer(answer, accepted);
    if (exercise.type === "type_transliteration" ||
        exercise.type === "build_transliteration") {
        return validateAnswer(exercise.promptArabic, answer, accepted).correct;
    }
    if (exercise.type === "find_mistake") {
        const expectedWrong = accepted.includes("wrong");
        return ((answer === "wrong" && expectedWrong) ||
            (answer === "right" && !expectedWrong));
    }
    return accepted.some((a) => normalizeAnswer(a) === normalizeAnswer(answer));
}
async function gradeReviewAnswer(userId: string, exerciseId: string, answer: string) {
    const match = /^review-(.+)-(\d+)$/.exec(exerciseId);
    if (!match)
        throw new Error("Invalid review exercise");
    const conceptId = match[1];
    const concept = await prisma.concept.findUnique({ where: { id: conceptId } });
    if (!concept?.latin)
        throw new Error("Invalid review exercise");
    const [due, mastery] = await Promise.all([
        prisma.reviewQueueItem.findUnique({
            where: { userId_conceptId: { userId, conceptId } },
        }),
        prisma.userConceptMastery.findUnique({
            where: { userId_conceptId: { userId, conceptId } },
        }),
    ]);
    if (!due && !(mastery && mastery.mastery < 0.8)) {
        throw new Error("Concept not due for review");
    }
    const accepted = [concept.latin];
    const correct = validateAnswer(concept.arabic, answer, accepted).correct;
    const existing = mastery;
    const nextMastery = Math.min(1, Math.max(0, (existing?.mastery ?? 0) + (correct ? 0.12 : -0.15)));
    await prisma.userConceptMastery.upsert({
        where: { userId_conceptId: { userId, conceptId } },
        create: {
            userId,
            conceptId,
            mastery: nextMastery,
            exposures: 1,
            correctCount: correct ? 1 : 0,
            incorrectCount: correct ? 0 : 1,
            lastSeenAt: new Date(),
            nextReviewAt: new Date(Date.now() + (correct ? 2 : 0.25) * 86400000),
        },
        update: {
            mastery: nextMastery,
            exposures: { increment: 1 },
            correctCount: correct ? { increment: 1 } : undefined,
            incorrectCount: correct ? undefined : { increment: 1 },
            lastSeenAt: new Date(),
            nextReviewAt: new Date(Date.now() + (correct ? 2 : 0.25) * 86400000),
        },
    });
    if (correct && nextMastery >= 0.8) {
        await prisma.reviewQueueItem.deleteMany({ where: { userId, conceptId } });
    }
    else {
        await prisma.reviewQueueItem.upsert({
            where: { userId_conceptId: { userId, conceptId } },
            create: {
                userId,
                conceptId,
                priority: correct ? 1 : 3,
                reason: correct ? "spaced" : "mistake",
                dueAt: new Date(Date.now() + (correct ? 2 : 0.25) * 86400000),
            },
            update: {
                priority: correct ? 1 : 3,
                reason: correct ? "spaced" : "mistake",
                dueAt: new Date(Date.now() + (correct ? 2 : 0.25) * 86400000),
            },
        });
    }
    await trackEvent(correct ? "exercise_answered" : "exercise_incorrect", userId, {
        exerciseId,
        review: true,
        conceptId,
    });
    return { correct };
}
async function accuracyFromAttempts(userId: string, lessonId: string) {
    const [progress, exercises] = await Promise.all([
        prisma.userLessonProgress.findUnique({
            where: { userId_lessonId: { userId, lessonId } },
        }),
        prisma.exercise.findMany({
            where: { lessonId },
            select: { id: true },
        }),
    ]);
    if (exercises.length === 0)
        return { accuracy: 0, perfect: false };
    const since = progress?.startedAt ?? new Date(0);
    const attempts = await prisma.exerciseAttempt.findMany({
        where: {
            userId,
            exerciseId: { in: exercises.map((e) => e.id) },
            createdAt: { gte: since },
        },
        orderBy: { createdAt: "desc" },
        select: { exerciseId: true, correct: true },
    });
    const latest = new Map<string, boolean>();
    for (const attempt of attempts) {
        if (!latest.has(attempt.exerciseId))
            latest.set(attempt.exerciseId, attempt.correct);
    }
    if (latest.size === 0)
        return { accuracy: 0, perfect: false };
    let correctCount = 0;
    for (const ok of latest.values()) {
        if (ok)
            correctCount += 1;
    }
    const accuracy = correctCount / latest.size;
    const perfect = latest.size >= exercises.length && correctCount === exercises.length;
    return { accuracy, perfect };
}
export async function submitExerciseAnswer(opts: {
    exerciseId: string;
    answer: string;
}) {
    const session = await auth();
    if (!session?.user?.id)
        throw new Error("Unauthorized");
    if (typeof opts.answer !== "string")
        throw new Error("Invalid answer");
    if (opts.exerciseId.startsWith("review-")) {
        return gradeReviewAnswer(session.user.id, opts.exerciseId, opts.answer);
    }
    const exercise = await prisma.exercise.findUniqueOrThrow({
        where: { id: opts.exerciseId },
        include: { lesson: { select: { id: true, published: true } } },
    });
    if (!exercise.lesson.published)
        throw new Error("Lesson not available");
    await assertLessonPlayable(session.user.id, exercise.lesson.id);
    const accepted = parseJsonArray(exercise.correctAnswers);
    const conceptIds = parseJsonArray(exercise.conceptIds);
    const correct = gradeExercise(exercise, opts.answer, accepted);
    await applyExerciseResult({
        userId: session.user.id,
        exerciseId: exercise.id,
        conceptIds,
        correct,
        userAnswer: opts.answer,
        expectedAnswer: accepted[0],
    });
    return { correct };
}
export async function finishLesson(opts: {
    lessonId: string;
}) {
    const session = await auth();
    if (!session?.user?.id)
        throw new Error("Unauthorized");
    await assertLessonPlayable(session.user.id, opts.lessonId);
    const { accuracy, perfect } = await accuracyFromAttempts(session.user.id, opts.lessonId);
    const result = await completeLesson({
        userId: session.user.id,
        lessonId: opts.lessonId,
        accuracy,
        perfect,
    });
    revalidatePath("/learn");
    revalidatePath("/progress");
    return { ...result, accuracy, perfect };
}
export async function startLesson(lessonId: string) {
    const session = await auth();
    if (!session?.user?.id)
        throw new Error("Unauthorized");
    await assertLessonPlayable(session.user.id, lessonId);
    await prisma.userLessonProgress.upsert({
        where: {
            userId_lessonId: { userId: session.user.id, lessonId },
        },
        create: {
            userId: session.user.id,
            lessonId,
            status: "in_progress",
            startedAt: new Date(),
        },
        update: {
            status: "in_progress",
            startedAt: new Date(),
        },
    });
    await trackEvent("lesson_started", session.user.id, { lessonId });
}
export async function completeOnboarding(readingLevel: string) {
    const session = await auth();
    if (!session?.user?.id)
        throw new Error("Unauthorized");
    const level = z.enum(["none", "some", "slow"]).parse(readingLevel);
    await prisma.user.update({
        where: { id: session.user.id },
        data: {
            onboardingDone: true,
            readingLevel: level,
        },
    });
    await ensurePathUnlocked(session.user.id);
    if (level === "some" || level === "slow") {
        const lessons = await prisma.lesson.findMany({
            where: { published: true, unit: { stage: { lte: level === "slow" ? 3 : 2 } } },
            orderBy: [{ unit: { order: "asc" } }, { order: "asc" }],
        });
        for (const lesson of lessons) {
            await prisma.userLessonProgress.upsert({
                where: {
                    userId_lessonId: {
                        userId: session.user.id,
                        lessonId: lesson.id,
                    },
                },
                create: {
                    userId: session.user.id,
                    lessonId: lesson.id,
                    status: "available",
                },
                update: {},
            });
        }
        if (level === "slow") {
            const early = await prisma.lesson.findMany({
                where: { published: true, unit: { stage: 1 } },
            });
            for (const lesson of early) {
                await prisma.userLessonProgress.upsert({
                    where: {
                        userId_lessonId: {
                            userId: session.user.id,
                            lessonId: lesson.id,
                        },
                    },
                    create: {
                        userId: session.user.id,
                        lessonId: lesson.id,
                        status: "completed",
                        accuracy: 1,
                        completedAt: new Date(),
                    },
                    update: { status: "completed", completedAt: new Date() },
                });
            }
        }
    }
    revalidatePath("/learn");
    revalidatePath("/onboarding");
}
const credentialsSchema = z.object({
    email: z.string().email().max(254),
    password: z.string().min(6).max(128),
    name: z.string().max(80).optional(),
});
export async function registerUser(opts: {
    email: string;
    password: string;
    name?: string;
}) {
    const parsed = credentialsSchema.parse(opts);
    const { hash } = await import("bcryptjs");
    const email = parsed.email.toLowerCase().trim();
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing)
        throw new Error("Email already registered");
    const passwordHash = await hash(parsed.password, 10);
    const user = await prisma.user.create({
        data: {
            email,
            passwordHash,
            name: parsed.name?.trim() || email.split("@")[0],
            onboardingDone: false,
        },
    });
    await ensurePathUnlocked(user.id);
    return { id: user.id, email: user.email };
}
export async function requestPasswordReset(email: string) {
    const parsed = z.string().email().max(254).safeParse(email);
    if (!parsed.success)
        return { ok: true };
    const normalized = parsed.data.toLowerCase().trim();
    const user = await prisma.user.findUnique({
        where: { email: normalized },
    });
    if (!user)
        return { ok: true };
    const token = crypto.randomUUID() + crypto.randomUUID();
    const expires = new Date(Date.now() + 1000 * 60 * 60);
    await prisma.passwordResetToken.create({
        data: { userId: user.id, token, expires },
    });
    if (process.env.NODE_ENV === "development") {
        console.log(`[password-reset] ${normalized}: /reset-password?token=${token}`);
    }
    return { ok: true, devToken: process.env.NODE_ENV === "development" ? token : undefined };
}
export async function resetPassword(token: string, password: string) {
    const { hash } = await import("bcryptjs");
    const safePassword = z.string().min(6).max(128).parse(password);
    const row = await prisma.passwordResetToken.findUnique({ where: { token } });
    if (!row || row.used || row.expires < new Date()) {
        throw new Error("Invalid or expired token");
    }
    const passwordHash = await hash(safePassword, 10);
    await prisma.user.update({
        where: { id: row.userId },
        data: { passwordHash },
    });
    await prisma.passwordResetToken.update({
        where: { id: row.id },
        data: { used: true },
    });
    return { ok: true };
}
