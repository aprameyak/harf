import Link from "next/link";
import { cn } from "@/lib/utils";
export function Brand({ className, href = "/", size = "md", }: {
    className?: string;
    href?: string;
    size?: "sm" | "md" | "lg";
}) {
    const sizes = {
        sm: "text-xl",
        md: "text-2xl",
        lg: "text-4xl sm:text-5xl",
    };
    return (<Link href={href} className={cn("font-semibold tracking-tight text-teal-deep focus-ring rounded-lg", sizes[size], className)}>
      <span className="arabic inline-block me-1.5 text-[1.15em] leading-none align-[-0.08em]">
        حرف
      </span>
      <span>Harf</span>
    </Link>);
}
