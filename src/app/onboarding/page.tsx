"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Brand } from "@/components/brand";
import { completeOnboarding } from "@/lib/actions/lesson";
import { cn } from "@/lib/utils";
const OPTIONS = [
    {
        id: "none",
        title: "Not at all",
        body: "Arabic letters look unfamiliar — start from the very beginning.",
    },
    {
        id: "some",
        title: "I know some letters",
        body: "You've seen a few shapes before. We'll still build carefully.",
    },
    {
        id: "slow",
        title: "I can slowly sound out words",
        body: "Skip the earliest letter intros and jump further into the path.",
    },
] as const;
export default function OnboardingPage() {
    const [selected, setSelected] = useState<string>("none");
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    async function start() {
        setLoading(true);
        await completeOnboarding(selected);
        router.push("/learn");
        router.refresh();
    }
    return (<div className="mx-auto flex min-h-[100dvh] max-w-lg flex-col px-4 py-10">
      <Brand className="mb-10"/>
      <p className="text-sm font-medium text-teal">Quick start</p>
      <h1 className="mt-2 text-2xl font-bold leading-snug">
        Can you currently read Arabic?
      </h1>
      <p className="mt-2 text-ink-muted">
        One question — then your first lesson.
      </p>

      <div className="mt-8 flex flex-col gap-3" role="radiogroup" aria-label="Reading level">
        {OPTIONS.map((opt) => (<button key={opt.id} type="button" role="radio" aria-checked={selected === opt.id} onClick={() => setSelected(opt.id)} className={cn("focus-ring rounded-2xl border px-4 py-4 text-left transition", selected === opt.id
                ? "border-teal bg-teal-soft/70 ring-2 ring-teal/20"
                : "border-black/8 bg-white hover:border-teal/30")}>
            <p className="font-semibold">{opt.title}</p>
            <p className="mt-1 text-sm text-ink-muted">{opt.body}</p>
          </button>))}
      </div>

      <button type="button" className="btn btn-primary focus-ring mt-8" disabled={loading} onClick={start}>
        {loading ? "Setting up…" : "Start first lesson"}
      </button>
    </div>);
}
