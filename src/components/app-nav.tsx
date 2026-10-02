"use client";
import Link from "next/link";
import { Brand } from "@/components/brand";
import { BookOpen, ChartColumn, RotateCcw, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { signOut } from "next-auth/react";
export function AppNav({ active }: {
    active?: "learn" | "progress" | "review";
}) {
    return (<nav className="fixed bottom-0 inset-x-0 z-40 border-t border-black/5 bg-white/90 backdrop-blur-md sm:sticky sm:top-0 sm:bottom-auto sm:border-b sm:border-t-0">
      <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-2 sm:py-3">
        <Brand size="sm" href="/learn" className="hidden sm:inline-flex"/>
        <div className="flex w-full items-center justify-around sm:w-auto sm:gap-1">
          <NavLink href="/learn" active={active === "learn"} icon={<BookOpen className="h-5 w-5"/>} label="Learn"/>
          <NavLink href="/review" active={active === "review"} icon={<RotateCcw className="h-5 w-5"/>} label="Review"/>
          <NavLink href="/progress" active={active === "progress"} icon={<ChartColumn className="h-5 w-5"/>} label="Progress"/>
        </div>
        <button type="button" className="btn btn-ghost focus-ring hidden text-sm sm:inline-flex" aria-label="Log out" onClick={() => signOut({ callbackUrl: "/" })}>
          <LogOut className="h-4 w-4"/>
        </button>
      </div>
    </nav>);
}
function NavLink({ href, active, icon, label, }: {
    href: string;
    active?: boolean;
    icon: React.ReactNode;
    label: string;
}) {
    return (<Link href={href} className={cn("focus-ring flex flex-col items-center gap-0.5 rounded-xl px-3 py-2 text-xs font-medium sm:flex-row sm:gap-2 sm:text-sm", active ? "text-teal" : "text-ink-muted hover:text-ink")} aria-current={active ? "page" : undefined}>
      {icon}
      {label}
    </Link>);
}
