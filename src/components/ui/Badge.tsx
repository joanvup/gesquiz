import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export type BadgeTone =
  | "magenta"
  | "peach"
  | "aqua"
  | "lavender"
  | "yellow"
  | "neutral"
  | "success"
  | "warning"
  | "danger";

const TONES: Record<BadgeTone, string> = {
  magenta: "bg-magenta-soft text-magenta-dark",
  peach: "bg-peach-100 text-orange-800",
  aqua: "bg-aqua-100 text-aqua-500",
  lavender: "bg-lavender-100 text-lavender-900",
  yellow: "bg-yellow-100 text-yellow-600",
  neutral: "bg-cream text-plum/70",
  success: "bg-aqua-100 text-aqua-500",
  warning: "bg-yellow-100 text-yellow-600",
  danger: "bg-peach-100 text-orange-800",
};

export interface BadgeProps {
  tone?: BadgeTone;
  children: ReactNode;
  className?: string;
}

export function Badge({ tone = "neutral", children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-chip px-2.5 py-0.5 text-xs font-semibold",
        TONES[tone],
        className
      )}
    >
      {children}
    </span>
  );
}
