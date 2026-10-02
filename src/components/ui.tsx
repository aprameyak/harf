"use client";
import { cn } from "@/lib/utils";
export function ArabicText({ children, size = "hero", className, }: {
    children: React.ReactNode;
    size?: "hero" | "lg" | "md" | "sm";
    className?: string;
}) {
    return (<div lang="ar" dir="rtl" className={cn("arabic text-ink select-none", size === "hero" && "arabic-hero", size === "lg" && "arabic-lg", size === "md" && "text-3xl", size === "sm" && "text-xl", className)} aria-label={typeof children === "string" ? children : undefined}>
      {children}
    </div>);
}
export function ChoiceButton({ children, onClick, state = "idle", disabled, arabic, className, }: {
    children: React.ReactNode;
    onClick?: () => void;
    state?: "idle" | "selected" | "correct" | "incorrect";
    disabled?: boolean;
    arabic?: boolean;
    className?: string;
}) {
    return (<button type="button" onClick={onClick} disabled={disabled} className={cn("focus-ring w-full min-h-14 rounded-2xl border px-4 py-3 text-lg font-semibold transition-all", arabic && "arabic arabic-lg py-4", state === "idle" &&
            "border-black/8 bg-white hover:border-teal/40 hover:bg-teal-soft/40", state === "selected" && "border-teal bg-teal-soft text-teal-deep", state === "correct" &&
            "border-success bg-[var(--success-soft)] text-success ring-2 ring-success/30", state === "incorrect" &&
            "border-error bg-[var(--error-soft)] text-error ring-2 ring-error/20", disabled && state === "idle" && "opacity-60", className)}>
      {children}
    </button>);
}
export function ProgressBar({ value, label, }: {
    value: number;
    label?: string;
}) {
    return (<div className="w-full" role="progressbar" aria-valuenow={Math.round(value * 100)} aria-valuemin={0} aria-valuemax={100} aria-label={label ?? "Progress"}>
      <div className="h-2 w-full overflow-hidden rounded-full bg-black/8">
        <div className="h-full rounded-full bg-teal transition-[width] duration-300 ease-out" style={{ width: `${Math.min(100, Math.max(0, value * 100))}%` }}/>
      </div>
    </div>);
}
export function FeedbackBanner({ correct, explanation, }: {
    correct: boolean;
    explanation?: string | null;
}) {
    return (<div role="status" className={cn("rounded-2xl px-4 py-3 text-sm font-medium", correct
            ? "bg-[var(--success-soft)] text-success"
            : "bg-[var(--error-soft)] text-error")}>
      <p className="text-base font-semibold">
        {correct ? "Correct" : "Not quite"}
      </p>
      {explanation && (<p className="mt-1 text-[0.95rem] leading-relaxed opacity-90 whitespace-pre-line">
          {explanation}
        </p>)}
    </div>);
}
