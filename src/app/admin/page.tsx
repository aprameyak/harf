import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Brand } from "@/components/brand";
import { AdminClient } from "@/components/admin/AdminClient";
export default async function AdminPage() {
    const session = await auth();
    if (!session?.user?.id)
        redirect("/login");
    const user = await prisma.user.findUniqueOrThrow({
        where: { id: session.user.id },
    });
    const adminEmails = (process.env.ADMIN_EMAILS ?? "")
        .split(",")
        .map((e) => e.trim().toLowerCase())
        .filter(Boolean);
    if (user.role !== "admin" && !adminEmails.includes(user.email ?? "")) {
        redirect("/learn");
    }
    const course = await prisma.course.findFirst({
        include: {
            units: {
                orderBy: { order: "asc" },
                include: {
                    lessons: {
                        orderBy: { order: "asc" },
                        include: {
                            exercises: { orderBy: { order: "asc" } },
                        },
                    },
                },
            },
        },
    });
    const concepts = await prisma.concept.findMany({
        orderBy: { key: "asc" },
        take: 200,
    });
    return (<div className="min-h-[100dvh] bg-[#f3f7f5]">
      <header className="border-b border-black/5 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <Brand href="/learn"/>
          <Link href="/learn" className="text-sm text-teal hover:underline">
            Back to app
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-8">
        <h1 className="text-2xl font-bold">Content admin</h1>
        <p className="mt-1 text-ink-muted">
          Create and edit units, lessons, and exercises without touching code.
        </p>
        {course ? (<AdminClient course={JSON.parse(JSON.stringify(course))} concepts={concepts.map((c) => ({ id: c.id, key: c.key, title: c.title }))}/>) : (<p className="mt-6">No course found. Run the seed script.</p>)}
      </main>
    </div>);
}
