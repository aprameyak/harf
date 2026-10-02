import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";
import { AppNav } from "@/components/app-nav";
import { ensurePathUnlocked, getReviewDueCount } from "@/lib/learning";
import { Check, Lock, Play, Flame, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
export default async function LearnPage() {
    const session = await auth();
    if (!session?.user?.id)
        redirect("/login");
    const user = await prisma.user.findUniqueOrThrow({
        where: { id: session.user.id },
    });
    if (!user.onboardingDone)
        redirect("/onboarding");
    await ensurePathUnlocked(user.id);
    const course = await prisma.course.findFirst({
        where: { published: true },
        include: {
            units: {
                where: { published: true },
                orderBy: { order: "asc" },
                include: {
                    lessons: {
                        where: { published: true },
                        orderBy: { order: "asc" },
                    },
                },
            },
        },
    });
    const progress = await prisma.userLessonProgress.findMany({
        where: { userId: user.id },
    });
    const progressMap = new Map(progress.map((p) => [p.lessonId, p]));
    const reviewDue = await getReviewDueCount(user.id);
    let continueLesson: {
        id: string;
        title: string;
        unitTitle: string;
    } | null = null;
    if (course) {
        for (const unit of course.units) {
            for (const lesson of unit.lessons) {
                const p = progressMap.get(lesson.id);
                if (!p || p.status === "available" || p.status === "in_progress") {
                    continueLesson = {
                        id: lesson.id,
                        title: lesson.title,
                        unitTitle: unit.title,
                    };
                    break;
                }
                if (p.status === "locked" || !p) {
                }
            }
            if (continueLesson)
                break;
        }
        if (!continueLesson) {
            const all = course.units.flatMap((u) => u.lessons.map((l) => ({ ...l, unitTitle: u.title })));
            const last = all[all.length - 1];
            if (last) {
                continueLesson = {
                    id: last.id,
                    title: last.title,
                    unitTitle: last.unitTitle,
                };
            }
        }
    }
    const completedCount = progress.filter((p) => p.status === "completed").length;
    return (<div className="min-h-[100dvh] pb-24 sm:pb-10">
      <AppNav active="learn"/>

      <main className="mx-auto max-w-lg px-4 pt-6 sm:pt-8">
        <div className="mb-6 flex items-center justify-between gap-3">
          <div>
            <p className="text-sm text-ink-muted">
              {user.name ? `Hi, ${user.name}` : "Keep going"}
            </p>
            <h1 className="text-2xl font-bold">Arabic Reading</h1>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="inline-flex items-center gap-1 rounded-full bg-orange-50 px-2.5 py-1 font-semibold text-orange-700">
              <Flame className="h-3.5 w-3.5" aria-hidden/>
              {user.currentStreak}
              <span className="sr-only">day streak</span>
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-teal-soft px-2.5 py-1 font-semibold text-teal-deep">
              <Zap className="h-3.5 w-3.5" aria-hidden/>
              {user.xp}
            </span>
          </div>
        </div>

        {continueLesson && (<section className="surface mb-4 rounded-3xl p-5">
            <p className="text-sm font-medium text-teal">Continue Learning</p>
            <h2 className="mt-1 text-lg font-semibold">
              {continueLesson.unitTitle}
            </h2>
            <p className="text-ink-muted">{continueLesson.title}</p>
            <Link href={`/lesson/${continueLesson.id}`} className="btn btn-primary focus-ring mt-4 w-full">
              <Play className="h-4 w-4" aria-hidden/>
              Continue
            </Link>
          </section>)}

        {reviewDue > 0 && (<section className="mb-8 rounded-3xl border border-amber-200/80 bg-amber-50/80 p-5">
            <p className="font-semibold text-amber-900">
              {reviewDue} skill{reviewDue === 1 ? "" : "s"} need review
            </p>
            <p className="mt-1 text-sm text-amber-800/80">
              Quick practice keeps weak letters from fading.
            </p>
            <Link href="/review" className="btn btn-secondary focus-ring mt-3 w-full border-amber-200 bg-white">
              Quick Review
            </Link>
          </section>)}

        <div className="mb-4 flex items-center justify-between text-sm text-ink-muted">
          <span>Learning path</span>
          <span>{completedCount} lessons done</span>
        </div>

        <ol className="relative space-y-8">
          {course?.units.map((unit, ui) => (<li key={unit.id} className="relative">
              {ui < (course?.units.length ?? 0) - 1 && (<div className="absolute left-[1.15rem] top-12 bottom-[-2rem] w-0.5 bg-teal/20" aria-hidden/>)}
              <div className="mb-3 flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-teal text-sm font-bold text-white">
                  {unit.order + 1}
                </div>
                <div>
                  <h3 className="font-semibold">{unit.title}</h3>
                  <p className="text-sm text-ink-muted">{unit.description}</p>
                </div>
              </div>

              <ul className="ms-5 space-y-2 border-s border-transparent ps-8">
                {unit.lessons.map((lesson, lessonIndex) => {
                const p = progressMap.get(lesson.id);
                const isFirst = unit.order === 0 && lessonIndex === 0;
                const status = p?.status ?? (isFirst ? "available" : "locked");
                const completed = status === "completed";
                const unlocked = completed ||
                    status === "available" ||
                    status === "in_progress" ||
                    isFirst;
                return (<li key={lesson.id}>
                      {!unlocked ? (<div className="flex items-center gap-3 rounded-2xl border border-black/5 bg-white/50 px-4 py-3 opacity-60">
                          <Lock className="h-4 w-4 text-ink-muted" aria-hidden/>
                          <div>
                            <p className="font-medium">{lesson.title}</p>
                            <p className="text-xs text-ink-muted">
                              ~{lesson.estimatedMin} min
                            </p>
                          </div>
                        </div>) : (<Link href={`/lesson/${lesson.id}`} className={cn("focus-ring flex items-center gap-3 rounded-2xl border px-4 py-3 transition", completed
                            ? "border-teal/20 bg-teal-soft/40"
                            : "border-black/8 bg-white hover:border-teal/40")}>
                          <span className={cn("flex h-8 w-8 items-center justify-center rounded-full", completed
                            ? "bg-teal text-white"
                            : "bg-teal-soft text-teal")}>
                            {completed ? (<Check className="h-4 w-4" aria-hidden/>) : (<Play className="h-4 w-4" aria-hidden/>)}
                          </span>
                          <div className="flex-1">
                            <p className="font-medium">{lesson.title}</p>
                            <p className="text-xs text-ink-muted">
                              ~{lesson.estimatedMin} min · {lesson.xpReward} XP
                            </p>
                          </div>
                        </Link>)}
                    </li>);
            })}
              </ul>
            </li>))}
        </ol>

        <div className="mt-8 rounded-2xl bg-white/50 p-4 text-center text-xs text-ink-muted">
          Daily goal: {user.dailyXpEarned}/{user.dailyGoalXp} XP · Level{" "}
          {user.level}
        </div>
      </main>
    </div>);
}
