"use client";
import { useMemo, useState, useEffect, useCallback } from "react";
import { ArabicText, ChoiceButton, FeedbackBanner } from "@/components/ui";
import { cn } from "@/lib/utils";
import { normalizeAnswer } from "@/lib/transliteration/engine";
export type ExerciseDTO = {
    id: string;
    type: string;
    promptArabic?: string | null;
    promptLatin?: string | null;
    promptText?: string | null;
    correctAnswers: string[];
    distractors?: string[] | null;
    tokens?: string[] | null;
    options?: string[] | null;
    explanation?: string | null;
    hint?: string | null;
    conceptIds: string[];
    metadata?: Record<string, unknown> | null;
};
type ResultPayload = {
    correct: boolean;
    answer: string;
};
function shuffle<T>(arr: T[]): T[] {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}
function isAccepted(answer: string, accepted: string[]) {
    const n = normalizeAnswer(answer);
    return accepted.some((a) => normalizeAnswer(a) === n);
}
export function ExerciseRenderer({ exercise, onResult, }: {
    exercise: ExerciseDTO;
    onResult: (result: ResultPayload) => void;
}) {
    switch (exercise.type) {
        case "intro":
            return <IntroExercise exercise={exercise} onResult={onResult}/>;
        case "arabic_to_latin_mc":
        case "speed_recognition":
            return <ArabicToLatinMC exercise={exercise} onResult={onResult}/>;
        case "latin_to_arabic_mc":
            return <LatinToArabicMC exercise={exercise} onResult={onResult}/>;
        case "matching":
            return <MatchingExercise exercise={exercise} onResult={onResult}/>;
        case "similar_letter":
            return <SimilarLetterExercise exercise={exercise} onResult={onResult}/>;
        case "connected_form":
            return <ArabicToLatinMC exercise={exercise} onResult={onResult}/>;
        case "build_transliteration":
            return <BuildTransliteration exercise={exercise} onResult={onResult}/>;
        case "type_transliteration":
            return <TypeTransliteration exercise={exercise} onResult={onResult}/>;
        case "find_mistake":
            return <FindMistakeExercise exercise={exercise} onResult={onResult}/>;
        default:
            return (<p className="text-ink-muted">Unknown exercise type: {exercise.type}</p>);
    }
}
function IntroExercise({ exercise, onResult, }: {
    exercise: ExerciseDTO;
    onResult: (r: ResultPayload) => void;
}) {
    return (<div className="flex flex-col items-center gap-8 text-center">
      {exercise.promptArabic && (<ArabicText size="hero">{exercise.promptArabic}</ArabicText>)}
      {exercise.promptText && (<p className="max-w-md text-lg leading-relaxed text-ink-muted whitespace-pre-line">
          {exercise.promptText}
        </p>)}
      <button type="button" className="btn btn-primary focus-ring w-full max-w-xs" onClick={() => onResult({ correct: true, answer: "continue" })}>
        Got it
      </button>
    </div>);
}
function ArabicToLatinMC({ exercise, onResult, }: {
    exercise: ExerciseDTO;
    onResult: (r: ResultPayload) => void;
}) {
    const choices = useMemo(() => shuffle([
        ...exercise.correctAnswers.slice(0, 1),
        ...(exercise.distractors ?? []).slice(0, 3),
    ]), [exercise]);
    const [picked, setPicked] = useState<string | null>(null);
    const [revealed, setRevealed] = useState(false);
    const timed = exercise.type === "speed_recognition";
    const limit = (exercise.metadata?.timeLimitMs as number | undefined) ?? (timed ? 8000 : 0);
    const [remaining, setRemaining] = useState(limit);
    useEffect(() => {
        if (!timed || revealed)
            return;
        const start = Date.now();
        const id = setInterval(() => {
            const left = Math.max(0, limit - (Date.now() - start));
            setRemaining(left);
            if (left <= 0) {
                clearInterval(id);
                setRevealed(true);
                onResult({ correct: false, answer: "" });
            }
        }, 100);
        return () => clearInterval(id);
    }, [timed, limit, revealed, onResult]);
    const choose = (c: string) => {
        if (revealed)
            return;
        setPicked(c);
        setRevealed(true);
        onResult({ correct: isAccepted(c, exercise.correctAnswers), answer: c });
    };
    return (<div className="flex flex-col gap-6">
      {timed && (<div className="h-1.5 overflow-hidden rounded-full bg-black/10">
          <div className="h-full bg-gold transition-all" style={{ width: `${(remaining / limit) * 100}%` }}/>
        </div>)}
      {exercise.promptText && (<p className="text-center text-ink-muted">{exercise.promptText}</p>)}
      <div className="flex justify-center py-4">
        <ArabicText size="hero">{exercise.promptArabic}</ArabicText>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {choices.map((c) => {
            let state: "idle" | "selected" | "correct" | "incorrect" = "idle";
            if (revealed) {
                if (isAccepted(c, exercise.correctAnswers))
                    state = "correct";
                else if (c === picked)
                    state = "incorrect";
            }
            else if (c === picked)
                state = "selected";
            return (<ChoiceButton key={c} onClick={() => choose(c)} state={state} disabled={revealed}>
              {c}
            </ChoiceButton>);
        })}
      </div>
      {revealed && (<FeedbackBanner correct={!!picked && isAccepted(picked, exercise.correctAnswers)} explanation={exercise.explanation}/>)}
    </div>);
}
function LatinToArabicMC({ exercise, onResult, }: {
    exercise: ExerciseDTO;
    onResult: (r: ResultPayload) => void;
}) {
    const choices = useMemo(() => shuffle(exercise.options ?? []), [exercise]);
    const [picked, setPicked] = useState<string | null>(null);
    const [revealed, setRevealed] = useState(false);
    const choose = (c: string) => {
        if (revealed)
            return;
        setPicked(c);
        setRevealed(true);
        onResult({ correct: exercise.correctAnswers.includes(c), answer: c });
    };
    return (<div className="flex flex-col gap-6">
      {exercise.promptText && (<p className="text-center text-ink-muted">{exercise.promptText}</p>)}
      <p className="text-center text-5xl font-bold tracking-tight">
        {exercise.promptLatin}
      </p>
      <div className="grid grid-cols-2 gap-3">
        {choices.map((c) => {
            let state: "idle" | "selected" | "correct" | "incorrect" = "idle";
            if (revealed) {
                if (exercise.correctAnswers.includes(c))
                    state = "correct";
                else if (c === picked)
                    state = "incorrect";
            }
            return (<ChoiceButton key={c} arabic onClick={() => choose(c)} state={state} disabled={revealed}>
              {c}
            </ChoiceButton>);
        })}
      </div>
      {revealed && (<FeedbackBanner correct={!!picked && exercise.correctAnswers.includes(picked)} explanation={exercise.explanation}/>)}
    </div>);
}
function SimilarLetterExercise({ exercise, onResult, }: {
    exercise: ExerciseDTO;
    onResult: (r: ResultPayload) => void;
}) {
    const choices = useMemo(() => shuffle(exercise.options ?? []), [exercise]);
    const [picked, setPicked] = useState<string | null>(null);
    const [revealed, setRevealed] = useState(false);
    const choose = (c: string) => {
        if (revealed)
            return;
        setPicked(c);
        setRevealed(true);
        onResult({ correct: exercise.correctAnswers.includes(c), answer: c });
    };
    return (<div className="flex flex-col gap-6">
      <p className="text-center text-lg text-ink-muted">
        {exercise.promptText ||
            (exercise.promptLatin
                ? `Which letter makes the “${exercise.promptLatin}” sound?`
                : "Pick the matching letter")}
      </p>
      {exercise.promptLatin && (<p className="text-center text-4xl font-bold">{exercise.promptLatin}</p>)}
      <div className="grid grid-cols-3 gap-3">
        {choices.map((c) => {
            let state: "idle" | "correct" | "incorrect" = "idle";
            if (revealed) {
                if (exercise.correctAnswers.includes(c))
                    state = "correct";
                else if (c === picked)
                    state = "incorrect";
            }
            return (<ChoiceButton key={c} arabic onClick={() => choose(c)} state={state} disabled={revealed}>
              {c}
            </ChoiceButton>);
        })}
      </div>
      {revealed && (<FeedbackBanner correct={!!picked && exercise.correctAnswers.includes(picked)} explanation={exercise.explanation}/>)}
    </div>);
}
function MatchingExercise({ exercise, onResult, }: {
    exercise: ExerciseDTO;
    onResult: (r: ResultPayload) => void;
}) {
    const arabic = exercise.options ?? [];
    const latin = useMemo(() => shuffle(exercise.tokens ?? []), [exercise]);
    const pairs = useMemo(() => {
        const map = new Map<string, string>();
        for (const ans of exercise.correctAnswers) {
            const [a, b] = ans.split("=");
            if (a && b)
                map.set(a, b);
        }
        return map;
    }, [exercise]);
    const [selectedAr, setSelectedAr] = useState<string | null>(null);
    const [matched, setMatched] = useState<Record<string, string>>({});
    const [wrongPair, setWrongPair] = useState<[
        string,
        string
    ] | null>(null);
    const [done, setDone] = useState(false);
    const tryMatch = (la: string) => {
        if (!selectedAr || done)
            return;
        const expected = pairs.get(selectedAr);
        if (expected === la) {
            const next = { ...matched, [selectedAr]: la };
            setMatched(next);
            setSelectedAr(null);
            setWrongPair(null);
            if (Object.keys(next).length === arabic.length) {
                setDone(true);
                onResult({ correct: true, answer: JSON.stringify(next) });
            }
        }
        else {
            setWrongPair([selectedAr, la]);
            setTimeout(() => {
                setWrongPair(null);
                setSelectedAr(null);
            }, 500);
        }
    };
    return (<div className="flex flex-col gap-6">
      <p className="text-center text-ink-muted">
        {exercise.promptText ?? "Match each Arabic letter to its sound"}
      </p>
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          {arabic.map((a) => {
            const isMatched = !!matched[a];
            const isWrong = wrongPair?.[0] === a;
            return (<button key={a} type="button" disabled={isMatched || done} onClick={() => setSelectedAr(a)} className={cn("arabic focus-ring rounded-2xl border py-3 text-3xl transition", isMatched && "border-success bg-[var(--success-soft)] opacity-70", isWrong && "border-error bg-[var(--error-soft)]", !isMatched &&
                    selectedAr === a &&
                    "border-teal bg-teal-soft", !isMatched &&
                    selectedAr !== a &&
                    "border-black/8 bg-white hover:border-teal/40")}>
                {a}
              </button>);
        })}
        </div>
        <div className="flex flex-col gap-2">
          {latin.map((la) => {
            const used = Object.values(matched).includes(la);
            const isWrong = wrongPair?.[1] === la;
            return (<button key={la} type="button" disabled={used || done || !selectedAr} onClick={() => tryMatch(la)} className={cn("focus-ring rounded-2xl border py-3 text-xl font-semibold transition", used && "border-success bg-[var(--success-soft)] opacity-70", isWrong && "border-error bg-[var(--error-soft)]", !used && "border-black/8 bg-white hover:border-teal/40")}>
                {la}
              </button>);
        })}
        </div>
      </div>
      {done && (<FeedbackBanner correct explanation={exercise.explanation ?? "Nice matching."}/>)}
    </div>);
}
function BuildTransliteration({ exercise, onResult, }: {
    exercise: ExerciseDTO;
    onResult: (r: ResultPayload) => void;
}) {
    const bank = useMemo(() => shuffle(exercise.tokens ?? []), [exercise]);
    const [built, setBuilt] = useState<string[]>([]);
    const [revealed, setRevealed] = useState(false);
    const [available, setAvailable] = useState(bank);
    const submit = () => {
        if (revealed || built.length === 0)
            return;
        const answer = built.join("");
        setRevealed(true);
        onResult({
            correct: isAccepted(answer, exercise.correctAnswers),
            answer,
        });
    };
    return (<div className="flex flex-col gap-6">
      {exercise.promptText && (<p className="text-center text-ink-muted">{exercise.promptText}</p>)}
      <div className="flex justify-center py-2">
        <ArabicText size="hero">{exercise.promptArabic}</ArabicText>
      </div>
      <div className="flex min-h-16 flex-wrap items-center justify-center gap-2 rounded-2xl border border-dashed border-black/15 bg-white/70 px-3 py-3" aria-label="Your answer">
        {built.length === 0 && (<span className="text-ink-muted">Tap pieces to build the sound</span>)}
        {built.map((t, i) => (<button key={`${t}-${i}`} type="button" disabled={revealed} onClick={() => {
                setBuilt((b) => b.filter((_, idx) => idx !== i));
                setAvailable((a) => [...a, t]);
            }} className="focus-ring rounded-xl bg-teal-soft px-3 py-2 font-semibold text-teal-deep">
            {t}
          </button>))}
      </div>
      <div className="flex flex-wrap justify-center gap-2">
        {available.map((t, i) => (<button key={`${t}-${i}`} type="button" disabled={revealed} onClick={() => {
                setAvailable((a) => a.filter((_, idx) => idx !== i));
                setBuilt((b) => [...b, t]);
            }} className="focus-ring rounded-xl border border-black/10 bg-white px-3 py-2 font-semibold hover:border-teal/40">
            {t}
          </button>))}
      </div>
      {!revealed && (<button type="button" className="btn btn-primary focus-ring" disabled={built.length === 0} onClick={submit}>
          Check
        </button>)}
      {revealed && (<FeedbackBanner correct={isAccepted(built.join(""), exercise.correctAnswers)} explanation={exercise.explanation ??
                `Answer: ${exercise.correctAnswers[0]}`}/>)}
    </div>);
}
function TypeTransliteration({ exercise, onResult, }: {
    exercise: ExerciseDTO;
    onResult: (r: ResultPayload) => void;
}) {
    const [value, setValue] = useState("");
    const [revealed, setRevealed] = useState(false);
    const submit = useCallback(() => {
        if (revealed || !value.trim())
            return;
        setRevealed(true);
        onResult({
            correct: isAccepted(value, exercise.correctAnswers),
            answer: value,
        });
    }, [revealed, value, exercise, onResult]);
    return (<div className="flex flex-col gap-6">
      {exercise.promptText && (<p className="text-center text-ink-muted">{exercise.promptText}</p>)}
      <div className="flex justify-center py-2">
        <ArabicText size="hero">{exercise.promptArabic}</ArabicText>
      </div>
      <label className="sr-only" htmlFor={`type-${exercise.id}`}>
        Type the transliteration
      </label>
      <input id={`type-${exercise.id}`} value={value} onChange={(e) => setValue(e.target.value)} onKeyDown={(e) => e.key === "Enter" && submit()} disabled={revealed} autoCapitalize="off" autoCorrect="off" spellCheck={false} placeholder="Type the sounds…" className="focus-ring w-full rounded-2xl border border-black/10 bg-white px-4 py-4 text-center text-xl font-medium outline-none focus:border-teal"/>
      {!revealed && (<button type="button" className="btn btn-primary focus-ring" disabled={!value.trim()} onClick={submit}>
          Check
        </button>)}
      {revealed && (<FeedbackBanner correct={isAccepted(value, exercise.correctAnswers)} explanation={exercise.explanation ?? `Expected: ${exercise.correctAnswers[0]}`}/>)}
    </div>);
}
function FindMistakeExercise({ exercise, onResult, }: {
    exercise: ExerciseDTO;
    onResult: (r: ResultPayload) => void;
}) {
    const [revealed, setRevealed] = useState(false);
    const correction = (exercise.metadata?.correction as string) ?? exercise.correctAnswers[0];
    const answer = (verdict: "right" | "wrong") => {
        if (revealed)
            return;
        setRevealed(true);
        const expectedWrong = exercise.correctAnswers.includes("wrong");
        const correct = (verdict === "wrong" && expectedWrong) ||
            (verdict === "right" && !expectedWrong);
        onResult({ correct, answer: verdict });
    };
    return (<div className="flex flex-col gap-6 text-center">
      <p className="text-ink-muted">
        {exercise.promptText ?? "Is this transliteration correct?"}
      </p>
      <ArabicText size="hero">{exercise.promptArabic}</ArabicText>
      <p className="text-3xl font-bold tracking-wide text-ink">
        {exercise.promptLatin}
      </p>
      <div className="grid grid-cols-2 gap-3">
        <ChoiceButton onClick={() => answer("right")} disabled={revealed} state={revealed
            ? !exercise.correctAnswers.includes("wrong")
                ? "correct"
                : "incorrect"
            : "idle"}>
          Looks right
        </ChoiceButton>
        <ChoiceButton onClick={() => answer("wrong")} disabled={revealed} state={revealed
            ? exercise.correctAnswers.includes("wrong")
                ? "correct"
                : "incorrect"
            : "idle"}>
          Something&apos;s off
        </ChoiceButton>
      </div>
      {revealed && (<FeedbackBanner correct={exercise.correctAnswers.includes("wrong")} explanation={exercise.explanation ??
                (correction ? `It should be: ${correction}` : undefined)}/>)}
    </div>);
}
