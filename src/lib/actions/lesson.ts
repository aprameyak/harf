"use server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { applyExerciseResult, completeLesson, trackEvent, ensurePathUnlocked, } from "@/lib/learning";
import { validateAnswer } from "@/lib/transliteration/engine";
import { revalidatePath } from "next/cache";
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
export async function submitExerciseAnswer(opts: {
    exerciseId: string;
    answer: string;
    correct?: boolean;
    conceptIds?: string[];
}) {
    const session = await auth();
    if (!session?.user?.id)
        throw new Error("Unauthorized");
    if (opts.exerciseId.startsWith("review-")) {
        const conceptIds = opts.conceptIds ?? [];
        const correct = !!opts.correct;
        for (const conceptId of conceptIds) {
            const existing = await prisma.userConceptMastery.findUnique({
                where: {
                    userId_conceptId: { userId: session.user.id, conceptId },
                },
            });
            const mastery = Math.min(1, Math.max(0, (existing?.mastery ?? 0) + (correct ? 0.12 : -0.15)));
            await prisma.userConceptMastery.upsert({
                where: {
                    userId_conceptId: { userId: session.user.id, conceptId },
                },
                create: {
                    userId: session.user.id,
                    conceptId,
                    mastery,
                    exposures: 1,
                    correctCount: correct ? 1 : 0,
                    incorrectCount: correct ? 0 : 1,
                    lastSeenAt: new Date(),
                    nextReviewAt: new Date(Date.now() + (correct ? 2 : 0.25) * 86400000),
                },
                update: {
                    mastery,
                    exposures: { increment: 1 },
                    correctCount: correct ? { increment: 1 } : undefined,
                    incorrectCount: correct ? undefined : { increment: 1 },
                    lastSeenAt: new Date(),
                    nextReviewAt: new Date(Date.now() + (correct ? 2 : 0.25) * 86400000),
                },
            });
        }
        await trackEvent(correct ? "exercise_answered" : "exercise_incorrect", session.user.id, {
            exerciseId: opts.exerciseId,
            review: true,
        });
        return { correct };
    }
    const exercise = await prisma.exercise.findUniqueOrThrow({
        where: { id: opts.exerciseId },
    });
    const accepted = parseJsonArray(exercise.correctAnswers);
    const conceptIds = parseJsonArray(exercise.conceptIds);
    let correct = opts.correct;
    if (correct === undefined) {
        if (exercise.type === "type_transliteration" ||
            exercise.type === "build_transliteration") {
            correct = validateAnswer(exercise.promptArabic, opts.answer, accepted).correct;
        }
        else if (exercise.type === "intro") {
            correct = true;
        }
        else {
            correct = accepted.some((a) => a.toLowerCase() === opts.answer.toLowerCase());
        }
    }
    await applyExerciseResult({
        userId: session.user.id,
        exerciseId: exercise.id,
        conceptIds,
        correct: !!correct,
        userAnswer: opts.answer,
        expectedAnswer: accepted[0],
    });
    return { correct: !!correct };
}
export async function finishLesson(opts: {
    lessonId: string;
    accuracy: number;
    perfect: boolean;
}) {
    const session = await auth();
    if (!session?.user?.id)
        throw new Error("Unauthorized");
    const result = await completeLesson({
        userId: session.user.id,
        lessonId: opts.lessonId,
        accuracy: opts.accuracy,
        perfect: opts.perfect,
    });
    revalidatePath("/learn");
    revalidatePath("/progress");
    revalidatePath("/dashboard");
    return result;
}
export async function startLesson(lessonId: string) {
    const session = await auth();
    if (!session?.user?.id)
        throw new Error("Unauthorized");
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
    await prisma.user.update({
        where: { id: session.user.id },
        data: {
            onboardingDone: true,
            readingLevel,
        },
    });
    await ensurePathUnlocked(session.user.id);
    if (readingLevel === "some" || readingLevel === "slow") {
        const lessons = await prisma.lesson.findMany({
            where: { published: true, unit: { stage: { lte: readingLevel === "slow" ? 3 : 2 } } },
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
                    status: lesson.unitId ? "available" : "available",
                },
                update: {},
            });
        }
        if (readingLevel === "slow") {
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
export async function registerUser(opts: {
    email: string;
    password: string;
    name?: string;
}) {
    const { hash } = await import("bcryptjs");
    const email = opts.email.toLowerCase().trim();
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing)
        throw new Error("Email already registered");
    const passwordHash = await hash(opts.password, 10);
    const user = await prisma.user.create({
        data: {
            email,
            passwordHash,
            name: opts.name?.trim() || email.split("@")[0],
            onboardingDone: false,
        },
    });
    await ensurePathUnlocked(user.id);
    return { id: user.id, email: user.email };
}
export async function requestPasswordReset(email: string) {
    const user = await prisma.user.findUnique({
        where: { email: email.toLowerCase().trim() },
    });
    if (!user)
        return { ok: true };
    const token = crypto.randomUUID() + crypto.randomUUID();
    const expires = new Date(Date.now() + 1000 * 60 * 60);
    await prisma.passwordResetToken.create({
        data: { userId: user.id, token, expires },
    });
    console.log(`[password-reset] ${email}: /reset-password?token=${token}`);
    return { ok: true, devToken: process.env.NODE_ENV === "development" ? token : undefined };
}
export async function resetPassword(token: string, password: string) {
    const { hash } = await import("bcryptjs");
    const row = await prisma.passwordResetToken.findUnique({ where: { token } });
    if (!row || row.used || row.expires < new Date()) {
        throw new Error("Invalid or expired token");
    }
    const passwordHash = await hash(password, 10);
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
