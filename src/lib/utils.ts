import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}
export function xpForLevel(level: number): number {
    return Math.floor(100 * Math.pow(level, 1.4));
}
export function levelFromXp(xp: number): number {
    let level = 1;
    while (xp >= xpForLevel(level)) {
        xp -= xpForLevel(level);
        level += 1;
        if (level > 100)
            break;
    }
    return level;
}
export function todayKey(date = new Date()): string {
    return date.toISOString().slice(0, 10);
}
export function masteryLabel(score: number): "not_learned" | "learning" | "strong" | "mastered" {
    if (score <= 0)
        return "not_learned";
    if (score < 0.4)
        return "learning";
    if (score < 0.8)
        return "strong";
    return "mastered";
}
