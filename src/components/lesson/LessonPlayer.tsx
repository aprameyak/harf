"use client";
import { useMemo, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ExerciseRenderer, type ExerciseDTO } from "@/components/exercises/ExerciseRenderer";
import { ProgressBar } from "@/components/ui";
import { submitExerciseAnswer, finishLesson } from "@/lib/actions/lesson";
import { completeReview } from "@/lib/actions/admin";
import { X, Sparkles } from "lucide-react";
import Link from "next/link";
export function LessonPlayer({ lessonId, title, exercises, }: {
    lessonId: string;
    title: string;
    exercises: ExerciseDTO[];
}) {
    const [index, setIndex] = useState(0);
    const [correctCount, setCorrectCount] = useState(0);
    const [answered, setAnswered] = useState(0);
    const [waiting, setWaiting] = useState(false);
    const [lastCorrect, setLastCorrect] = useState<boolean | null>(null);
    const [finished, setFinished] = useState<{
        xp: number;
        accuracy: number;
        perfect: boolean;
    } | null>(null);
    const [busy, setBusy] = useState(false);
    const exercise = exercises[index];
    const progress = exercises.length ? (index + (waiting ? 1 : 0)) / exercises.length : 0;
    const onResult = useCallback(async (result: {
        correct: boolean;
        answer: string;
    }) => {
        if (!exercise || waiting)
            return;
        setWaiting(true);
        setAnswered((a) => a + 1);
        try {
            const graded = await submitExerciseAnswer({
                exerciseId: exercise.id,
                answer: result.answer,
                correct: result.correct,
                conceptIds: exercise.conceptIds,
            });
            setLastCorrect(graded.correct);
            if (graded.correct)
                setCorrectCount((c) => c + 1);
        }
        catch {
            setLastCorrect(result.correct);
            if (result.correct)
                setCorrectCount((c) => c + 1);
        }
    }, [exercise, waiting]);
    const continueLesson = async () => {
        if (busy)
            return;
        if (index < exercises.length - 1) {
            setIndex((i) => i + 1);
            setWaiting(false);
            setLastCorrect(null);
            return;
        }
        setBusy(true);
        const accuracy = answered === 0 ? 1 : correctCount / answered;
        const isReview = lessonId === "review-session";
        try {
            if (isReview) {
                await completeReview();
                setFinished({
                    xp: Math.round(10 + accuracy * 15),
                    accuracy,
                    perfect: accuracy === 1,
                });
            }
            else {
                const res = await finishLesson({
                    lessonId,
                    accuracy,
                    perfect: accuracy === 1,
                });
                setFinished({
                    xp: res.xp,
                    accuracy,
                    perfect: accuracy === 1,
                });
            }
        }
        catch {
            setFinished({ xp: 15, accuracy, perfect: accuracy === 1 });
        }
        finally {
            setBusy(false);
        }
    };
    const reduceMotion = useMemo(() => {
        if (typeof window === "undefined")
            return false;
        return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    }, []);
    if (finished) {
        return (<div className="mx-auto flex min-h-[80dvh] max-w-lg flex-col items-center justify-center gap-6 px-4 text-center">
        <motion.div initial={reduceMotion ? false : { scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="surface rounded-3xl p-8">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-teal-soft text-teal">
            <Sparkles className="h-8 w-8" aria-hidden/>
          </div>
          <h1 className="text-2xl font-bold">Lesson complete</h1>
          <p className="mt-2 text-ink-muted">{title}</p>
          <div className="mt-6 grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-2xl bg-teal-soft/60 p-4">
              <p className="text-ink-muted">XP earned</p>
              <p className="text-2xl font-bold text-teal-deep">+{finished.xp}</p>
            </div>
            <div className="rounded-2xl bg-teal-soft/60 p-4">
              <p className="text-ink-muted">Accuracy</p>
              <p className="text-2xl font-bold text-teal-deep">
                {Math.round(finished.accuracy * 100)}%
              </p>
            </div>
          </div>
          {finished.perfect && (<p className="mt-4 text-sm font-medium text-gold">Perfect lesson!</p>)}
          <div className="mt-8 flex flex-col gap-3">
            <Link href="/learn" className="btn btn-primary focus-ring">
              Continue path
            </Link>
            <Link href="/progress" className="btn btn-secondary focus-ring">
              See progress
            </Link>
          </div>
        </motion.div>
      </div>);
    }
    if (!exercise) {
        return <p className="p-8 text-center">No exercises in this lesson.</p>;
    }
    return (<div className="mx-auto flex min-h-[100dvh] max-w-lg flex-col px-4 pb-8 pt-4">
      <header className="mb-4 flex items-center gap-3">
        <Link href="/learn" className="focus-ring rounded-full p-2 text-ink-muted hover:bg-black/5" aria-label="Exit lesson">
          <X className="h-5 w-5"/>
        </Link>
        <div className="flex-1">
          <ProgressBar value={progress} label="Lesson progress"/>
        </div>
        <span className="text-xs font-medium text-ink-muted tabular-nums">
          {index + 1}/{exercises.length}
        </span>
      </header>

      <p className="mb-6 text-center text-sm font-medium text-ink-muted">{title}</p>

      <div className="flex-1">
        <AnimatePresence mode="wait">
          <motion.div key={exercise.id} initial={reduceMotion ? false : { opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={reduceMotion ? undefined : { opacity: 0, x: -16 }} transition={{ duration: 0.2 }} className="surface rounded-3xl p-5 sm:p-7">
            <ExerciseRenderer exercise={exercise} onResult={onResult}/>
          </motion.div>
        </AnimatePresence>
      </div>

      {waiting && (<div className="mt-6">
          <button type="button" className="btn btn-primary focus-ring w-full" onClick={continueLesson} disabled={busy}>
            {index < exercises.length - 1
                ? lastCorrect
                    ? "Continue"
                    : "Got it — continue"
                : busy
                    ? "Saving…"
                    : "Finish lesson"}
          </button>
        </div>)}
    </div>);
}
