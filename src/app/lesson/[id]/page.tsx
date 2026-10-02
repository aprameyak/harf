import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect, notFound } from "next/navigation";
import { LessonPlayer } from "@/components/lesson/LessonPlayer";
import type { ExerciseDTO } from "@/components/exercises/ExerciseRenderer";
import { startLesson } from "@/lib/actions/lesson";
import { assertLessonPlayable } from "@/lib/learning";
function parseJson<T>(value: string | null | undefined, fallback: T): T {
    if (!value)
        return fallback;
    try {
        return JSON.parse(value) as T;
    }
    catch {
        return fallback;
    }
}
export default async function LessonPage({ params, }: {
    params: Promise<{
        id: string;
    }>;
}) {
    const session = await auth();
    if (!session?.user?.id)
        redirect("/login");
    const { id } = await params;
    const lesson = await prisma.lesson.findUnique({
        where: { id },
        include: {
            exercises: { orderBy: { order: "asc" } },
            unit: true,
        },
    });
    if (!lesson || !lesson.published || !lesson.unit.published)
        notFound();
    try {
        await assertLessonPlayable(session.user.id, lesson.id);
    }
    catch {
        redirect("/learn");
    }
    await startLesson(lesson.id);
    const exercises: ExerciseDTO[] = lesson.exercises.map((ex) => ({
        id: ex.id,
        type: ex.type,
        promptArabic: ex.promptArabic,
        promptLatin: ex.promptLatin,
        promptText: ex.promptText,
        correctAnswers: parseJson(ex.correctAnswers, []),
        distractors: parseJson(ex.distractors, null),
        tokens: parseJson(ex.tokens, null),
        options: parseJson(ex.options, null),
        explanation: ex.explanation,
        hint: ex.hint,
        conceptIds: parseJson(ex.conceptIds, []),
        metadata: parseJson(ex.metadata, null),
    }));
    return (<LessonPlayer lessonId={lesson.id} title={`${lesson.unit.title} · ${lesson.title}`} exercises={exercises}/>);
}
