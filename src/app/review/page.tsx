"use client";
import { useEffect, useState } from "react";
import { AppNav } from "@/components/app-nav";
import { LessonPlayer } from "@/components/lesson/LessonPlayer";
import type { ExerciseDTO } from "@/components/exercises/ExerciseRenderer";
import { generateReviewSession } from "@/lib/actions/admin";
import Link from "next/link";
export default function ReviewPage() {
    const [loading, setLoading] = useState(true);
    const [exercises, setExercises] = useState<ExerciseDTO[]>([]);
    const [started, setStarted] = useState(false);
    const [conceptCount, setConceptCount] = useState(0);
    useEffect(() => {
        void (async () => {
            try {
                const res = await generateReviewSession();
                setExercises(res.exercises.map((e) => ({
                    ...e,
                    distractors: e.distractors ?? null,
                    conceptIds: e.conceptIds,
                })));
                setConceptCount(res.conceptCount);
            }
            finally {
                setLoading(false);
            }
        })();
    }, []);
    if (started && exercises.length > 0) {
        return (<LessonPlayer lessonId="review-session" title="Review Weak Skills" exercises={exercises}/>);
    }
    return (<div className="min-h-[100dvh] pb-24 sm:pb-10">
      <AppNav active="review"/>
      <main className="mx-auto flex max-w-lg flex-col px-4 pt-8">
        <h1 className="text-2xl font-bold">Review</h1>
        <p className="mt-2 text-ink-muted">
          Personalized practice from mistakes, weak letters, and spaced recall.
          You don&apos;t manage decks — Harf picks what to reinforce.
        </p>

        <div className="surface mt-8 rounded-3xl p-6">
          {loading ? (<p className="text-ink-muted">Checking your skills…</p>) : exercises.length === 0 ? (<div className="text-center">
              <p className="font-semibold">You&apos;re caught up</p>
              <p className="mt-2 text-sm text-ink-muted">
                Complete a few lessons first — review unlocks as you learn.
              </p>
              <Link href="/learn" className="btn btn-primary focus-ring mt-6 inline-flex">
                Back to path
              </Link>
            </div>) : (<>
              <p className="text-sm font-medium text-teal">Review Weak Skills</p>
              <p className="mt-2 text-lg font-semibold">
                {conceptCount} concepts ready
              </p>
              <p className="mt-1 text-sm text-ink-muted">
                About {Math.max(3, Math.ceil(exercises.length * 0.5))} minutes
              </p>
              <button type="button" className="btn btn-primary focus-ring mt-6 w-full" onClick={async () => {
                setStarted(true);
            }}>
                Start review
              </button>
            </>)}
        </div>
      </main>
    </div>);
}
