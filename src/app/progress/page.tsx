import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { AppNav } from "@/components/app-nav";
import { masteryLabel, cn } from "@/lib/utils";
import Link from "next/link";
import { Flame, Trophy, Target, Zap } from "lucide-react";
export default async function ProgressPage({ searchParams, }: {
    searchParams: Promise<{
        letter?: string;
    }>;
}) {
    const session = await auth();
    if (!session?.user?.id)
        redirect("/login");
    const { letter: selectedLetter } = await searchParams;
    const user = await prisma.user.findUniqueOrThrow({
        where: { id: session.user.id },
        include: {
            achievements: { include: { achievement: true } },
        },
    });
    const letters = await prisma.arabicLetter.findMany({
        orderBy: { order: "asc" },
        take: 28,
    });
    const mastery = await prisma.userConceptMastery.findMany({
        where: { userId: user.id },
        include: { concept: true },
    });
    const masteryByKey = new Map(mastery.map((m) => [m.concept.key, m]));
    const letterMastery = letters.map((L) => {
        const base = masteryByKey.get(`letter:${L.name}`);
        const forms = (["isolated", "initial", "medial", "final"] as const).map((form) => {
            const m = masteryByKey.get(`letter:${L.name}:${form}`);
            return {
                form,
                glyph: L[form],
                score: m?.mastery ?? 0,
                incorrect: m?.incorrectCount ?? 0,
            };
        });
        const scores = [
            base?.mastery ?? 0,
            ...forms.map((f) => f.score),
        ];
        const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
        return {
            letter: L,
            score: base?.mastery ?? avg,
            forms,
            exposures: base?.exposures ?? 0,
            confusedWith: base?.confusedWith
                ? (JSON.parse(base.confusedWith) as string[])
                : [],
        };
    });
    const selected = letterMastery.find((l) => l.letter.name === selectedLetter || l.letter.isolated === selectedLetter);
    const lettersMastered = letterMastery.filter((l) => l.score >= 0.8).length;
    const conceptsMastered = mastery.filter((m) => m.mastery >= 0.8).length;
    const attempts = await prisma.exerciseAttempt.count({
        where: { userId: user.id },
    });
    const correctAttempts = await prisma.exerciseAttempt.count({
        where: { userId: user.id, correct: true },
    });
    const accuracy = attempts ? correctAttempts / attempts : 0;
    const lessonsCompleted = await prisma.userLessonProgress.count({
        where: { userId: user.id, status: "completed" },
    });
    const reviewDue = await prisma.reviewQueueItem.count({
        where: { userId: user.id, dueAt: { lte: new Date() } },
    });
    return (<div className="min-h-[100dvh] pb-24 sm:pb-10">
      <AppNav active="progress"/>
      <main className="mx-auto max-w-lg px-4 pt-6">
        <h1 className="text-2xl font-bold">Your progress</h1>
        <p className="mt-1 text-ink-muted">
          Alphabet mastery and reading stats
        </p>

        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat icon={<Flame className="h-4 w-4"/>} label="Streak" value={`${user.currentStreak}d`}/>
          <Stat icon={<Zap className="h-4 w-4"/>} label="XP" value={`${user.xp}`}/>
          <Stat icon={<Trophy className="h-4 w-4"/>} label="Level" value={`${user.level}`}/>
          <Stat icon={<Target className="h-4 w-4"/>} label="Accuracy" value={`${Math.round(accuracy * 100)}%`}/>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs text-ink-muted">
          <div className="rounded-xl bg-white/70 p-2">
            <p className="text-lg font-bold text-ink">{lessonsCompleted}</p>
            Lessons
          </div>
          <div className="rounded-xl bg-white/70 p-2">
            <p className="text-lg font-bold text-ink">{lettersMastered}</p>
            Letters
          </div>
          <div className="rounded-xl bg-white/70 p-2">
            <p className="text-lg font-bold text-ink">{reviewDue}</p>
            Due review
          </div>
        </div>

        <section className="mt-8">
          <h2 className="font-semibold">Arabic alphabet</h2>
          <p className="mt-1 text-sm text-ink-muted">
            Tap a letter to see forms you struggle with.
          </p>
          <div className="mt-3 flex flex-wrap gap-2 text-xs">
            <Legend className="bg-stone-200 text-stone-600" label="Not learned"/>
            <Legend className="bg-amber-100 text-amber-800" label="Learning"/>
            <Legend className="bg-teal-100 text-teal-800" label="Strong"/>
            <Legend className="bg-teal-600 text-white" label="Mastered"/>
          </div>
          <div className="mt-4 grid grid-cols-4 gap-2 sm:grid-cols-7">
            {letterMastery.map(({ letter, score }) => {
            const label = masteryLabel(score);
            return (<Link key={letter.id} href={`/progress?letter=${letter.name}`} className={cn("focus-ring flex aspect-square flex-col items-center justify-center rounded-2xl transition", label === "not_learned" && "bg-stone-200 text-stone-500", label === "learning" && "bg-amber-100 text-amber-900 ring-1 ring-amber-300", label === "strong" && "bg-teal-100 text-teal-900 ring-1 ring-teal-300", label === "mastered" && "bg-teal-600 text-white", selected?.letter.id === letter.id && "ring-2 ring-offset-2 ring-teal")} aria-label={`${letter.name}, ${label.replace("_", " ")}`}>
                  <span className="arabic text-2xl leading-none">{letter.isolated}</span>
                  <span className="mt-1 text-[10px] font-medium opacity-80">
                    {letter.latin}
                  </span>
                </Link>);
        })}
          </div>
        </section>

        {selected && (<section className="surface mt-6 rounded-3xl p-5">
            <div className="flex items-center gap-4">
              <span className="arabic text-5xl text-teal-deep">
                {selected.letter.isolated}
              </span>
              <div>
                <h3 className="text-lg font-semibold capitalize">
                  {selected.letter.name.replace("_", " ")}
                </h3>
                <p className="text-ink-muted">
                  Sound: <strong>{selected.letter.latin}</strong>
                </p>
                {selected.letter.note && (<p className="mt-1 text-sm text-ink-muted">{selected.letter.note}</p>)}
              </div>
            </div>
            <ul className="mt-4 space-y-2">
              {selected.forms.map((f) => (<li key={f.form} className="flex items-center justify-between rounded-xl bg-black/[0.03] px-3 py-2">
                  <span className="arabic text-2xl">{f.glyph}</span>
                  <span className="text-sm capitalize text-ink-muted">{f.form}</span>
                  <span className="text-sm font-semibold">
                    {Math.round(f.score * 100)}%
                    {f.incorrect > 2 && (<span className="ms-2 text-xs font-normal text-error">
                        needs review
                      </span>)}
                  </span>
                </li>))}
            </ul>
          </section>)}

        {user.achievements.length > 0 && (<section className="mt-8">
            <h2 className="font-semibold">Achievements</h2>
            <ul className="mt-3 space-y-2">
              {user.achievements.map((ua) => (<li key={ua.id} className="flex items-center gap-3 rounded-2xl border border-black/5 bg-white px-4 py-3">
                  <Trophy className="h-5 w-5 text-gold" aria-hidden/>
                  <div>
                    <p className="font-medium">{ua.achievement.title}</p>
                    <p className="text-xs text-ink-muted">
                      {ua.achievement.description}
                    </p>
                  </div>
                </li>))}
            </ul>
          </section>)}

        <p className="mt-8 text-center text-xs text-ink-muted">
          {conceptsMastered} concepts mastered · Longest streak{" "}
          {user.longestStreak} days
        </p>
      </main>
    </div>);
}
function Stat({ icon, label, value, }: {
    icon: React.ReactNode;
    label: string;
    value: string;
}) {
    return (<div className="rounded-2xl border border-black/5 bg-white p-3">
      <div className="flex items-center gap-1 text-ink-muted">
        {icon}
        <span className="text-xs">{label}</span>
      </div>
      <p className="mt-1 text-xl font-bold">{value}</p>
    </div>);
}
function Legend({ className, label }: {
    className: string;
    label: string;
}) {
    return (<span className="inline-flex items-center gap-1.5">
      <span className={cn("h-3 w-3 rounded-sm", className)} aria-hidden/>
      {label}
    </span>);
}
