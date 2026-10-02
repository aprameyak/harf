import Link from "next/link";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Brand } from "@/components/brand";
import { ArabicText } from "@/components/ui";
export default async function HomePage() {
    const session = await auth();
    if (session?.user) {
        redirect("/learn");
    }
    return (<div className="relative min-h-[100dvh] overflow-hidden">
      <div className="pointer-events-none absolute inset-0 opacity-[0.35]" style={{
            backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 5 L55 30 L30 55 L5 30 Z' fill='none' stroke='%231a6b5a' stroke-width='0.6' opacity='0.25'/%3E%3C/svg%3E\")",
        }}/>

      <header className="relative z-10 mx-auto flex max-w-5xl items-center justify-between px-4 py-5">
        <Brand size="md"/>
        <div className="flex items-center gap-2">
          <Link href="/login" className="btn btn-ghost focus-ring text-sm">
            Log in
          </Link>
          <Link href="/signup" className="btn btn-primary focus-ring text-sm">
            Get started
          </Link>
        </div>
      </header>

      <main className="relative z-10 mx-auto flex max-w-5xl flex-col px-4 pb-16 pt-6 sm:pt-12">
        <section className="flex min-h-[70dvh] flex-col justify-center gap-8 lg:grid lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:gap-12">
          <div>
            <Brand size="lg" href="/" className="mb-6 block"/>
            <h1 className="max-w-xl text-3xl font-semibold leading-tight tracking-tight text-ink sm:text-4xl">
              See Arabic. Decode the sounds.
            </h1>
            <p className="mt-4 max-w-md text-lg leading-relaxed text-ink-muted">
              Short lessons that teach you to read Arabic script — letter by
              letter, mark by mark — into clear Latin sounds. No audio. No
              conversation drills. Just reading.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/signup" className="btn btn-primary focus-ring">
                Start reading
              </Link>
              <Link href="/login?guest=1" className="btn btn-secondary focus-ring">
                Try as guest
              </Link>
            </div>
          </div>

          <div className="surface relative overflow-hidden rounded-[2rem] p-8 sm:p-10">
            <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-teal-soft/80 blur-2xl"/>
            <div className="absolute -bottom-10 -left-6 h-28 w-28 rounded-full bg-gold/20 blur-2xl"/>
            <p className="mb-6 text-sm font-medium uppercase tracking-wider text-ink-muted">
              The skill you&apos;ll build
            </p>
            <div className="flex flex-col items-center gap-4 text-center">
              <ArabicText size="hero" className="text-teal-deep">
                كَتَبَ
              </ArabicText>
              <div className="h-px w-16 bg-black/10"/>
              <p className="text-3xl font-bold tracking-wide text-ink">kataba</p>
              <p className="max-w-xs text-sm text-ink-muted">
                You won&apos;t need to know what it means — you&apos;ll know how
                to sound it out.
              </p>
            </div>
          </div>
        </section>

        <section className="mt-16 grid gap-6 sm:grid-cols-3">
          {[
            {
                title: "Letters → sounds",
                body: "Recognize shapes and map them to Latin letters like b, t, sh.",
            },
            {
                title: "Then add vowels",
                body: "Learn the small marks that turn ب into ba, bi, or bu.",
            },
            {
                title: "Decode real words",
                body: "Build up to vowelled words and passages — reading first, always.",
            },
        ].map((item) => (<div key={item.title} className="rounded-3xl border border-black/5 bg-white/60 p-5">
              <h2 className="font-semibold text-ink">{item.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-ink-muted">{item.body}</p>
            </div>))}
        </section>
      </main>
    </div>);
}
