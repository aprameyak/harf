"use server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { trackEvent } from "@/lib/learning";
import { revalidatePath } from "next/cache";
import { z } from "zod";
async function requireAdmin() {
    const session = await auth();
    if (!session?.user?.id)
        throw new Error("Unauthorized");
    const user = await prisma.user.findUniqueOrThrow({
        where: { id: session.user.id },
    });
    const adminEmails = (process.env.ADMIN_EMAILS ?? "")
        .split(",")
        .map((e) => e.trim().toLowerCase())
        .filter(Boolean);
    if (user.role !== "admin" && !adminEmails.includes(user.email ?? "")) {
        throw new Error("Forbidden");
    }
    return user;
}
export async function adminUpsertUnit(data: {
    id?: string;
    courseId: string;
    slug: string;
    title: string;
    description: string;
    stage: number;
    order: number;
    published: boolean;
}) {
    await requireAdmin();
    if (data.id) {
        await prisma.unit.update({
            where: { id: data.id },
            data: {
                slug: data.slug,
                title: data.title,
                description: data.description,
                stage: data.stage,
                order: data.order,
                published: data.published,
            },
        });
    }
    else {
        await prisma.unit.create({
            data: {
                courseId: data.courseId,
                slug: data.slug,
                title: data.title,
                description: data.description,
                stage: data.stage,
                order: data.order,
                published: data.published,
            },
        });
    }
    revalidatePath("/admin");
    revalidatePath("/learn");
}
export async function adminUpsertLesson(data: {
    id?: string;
    unitId: string;
    slug: string;
    title: string;
    description: string;
    order: number;
    xpReward: number;
    estimatedMin: number;
    published: boolean;
}) {
    await requireAdmin();
    if (data.id) {
        await prisma.lesson.update({
            where: { id: data.id },
            data: {
                slug: data.slug,
                title: data.title,
                description: data.description,
                order: data.order,
                xpReward: data.xpReward,
                estimatedMin: data.estimatedMin,
                published: data.published,
            },
        });
    }
    else {
        await prisma.lesson.create({ data });
    }
    revalidatePath("/admin");
    revalidatePath("/learn");
}
export async function adminUpsertExercise(data: {
    id?: string;
    lessonId: string;
    type: string;
    promptArabic?: string;
    promptLatin?: string;
    promptText?: string;
    correctAnswers: string;
    distractors?: string;
    tokens?: string;
    options?: string;
    explanation?: string;
    difficulty: number;
    order: number;
    conceptIds: string;
    publishedPreview?: boolean;
}) {
    await requireAdmin();
    for (const field of ["correctAnswers", "distractors", "tokens", "options", "conceptIds"] as const) {
        const val = data[field];
        if (val === undefined || val === "")
            continue;
        z.string().parse(val);
        JSON.parse(val);
    }
    const payload = {
        lessonId: data.lessonId,
        type: data.type,
        promptArabic: data.promptArabic || null,
        promptLatin: data.promptLatin || null,
        promptText: data.promptText || null,
        correctAnswers: data.correctAnswers,
        distractors: data.distractors || null,
        tokens: data.tokens || null,
        options: data.options || null,
        explanation: data.explanation || null,
        difficulty: data.difficulty,
        order: data.order,
        conceptIds: data.conceptIds || "[]",
    };
    if (data.id) {
        await prisma.exercise.update({ where: { id: data.id }, data: payload });
    }
    else {
        await prisma.exercise.create({ data: payload });
    }
    revalidatePath("/admin");
}
export async function adminReorderLessons(unitId: string, lessonIds: string[]) {
    await requireAdmin();
    await Promise.all(lessonIds.map((id, order) => prisma.lesson.update({ where: { id }, data: { order } })));
    revalidatePath("/admin");
    revalidatePath("/learn");
}
export async function adminToggleLessonPublish(lessonId: string, published: boolean) {
    await requireAdmin();
    await prisma.lesson.update({ where: { id: lessonId }, data: { published } });
    revalidatePath("/admin");
    revalidatePath("/learn");
}
export async function generateReviewSession() {
    const session = await auth();
    if (!session?.user?.id)
        throw new Error("Unauthorized");
    await trackEvent("review_started", session.user.id);
    const due = await prisma.reviewQueueItem.findMany({
        where: { userId: session.user.id, dueAt: { lte: new Date() } },
        include: { concept: true },
        orderBy: [{ priority: "desc" }, { dueAt: "asc" }],
        take: 12,
    });
    const concepts = due.map((d) => d.concept);
    if (concepts.length < 6) {
        const weak = await prisma.userConceptMastery.findMany({
            where: { userId: session.user.id, mastery: { lt: 0.8 } },
            include: { concept: true },
            orderBy: { mastery: "asc" },
            take: 8,
        });
        const seen = new Set(concepts.map((c) => c.id));
        for (const w of weak) {
            if (!seen.has(w.conceptId)) {
                concepts.push(w.concept);
                seen.add(w.conceptId);
            }
        }
    }
    const exercises = concepts.slice(0, 8).flatMap((c, i) => {
        if (!c.arabic || !c.latin)
            return [];
        const distractors = ["b", "t", "m", "n", "k", "l", "s", "sh", "th"]
            .filter((x) => x !== c.latin)
            .slice(0, 3);
        return [
            {
                id: `review-${c.id}-${i}`,
                type: "arabic_to_latin_mc",
                promptArabic: c.arabic,
                promptText: "What sound?",
                correctAnswers: [c.latin],
                distractors,
                explanation: `${c.arabic} = ${c.latin}`,
                conceptIds: [c.id],
                ephemeral: true,
            },
        ];
    });
    return { exercises, conceptCount: concepts.length };
}
export async function completeReview() {
    const session = await auth();
    if (!session?.user?.id)
        throw new Error("Unauthorized");
    await trackEvent("review_completed", session.user.id);
    revalidatePath("/learn");
    revalidatePath("/progress");
}
