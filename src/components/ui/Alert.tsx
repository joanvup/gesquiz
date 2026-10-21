import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export type AlertTone = "error" | "success" | "warning" | "info";

const TONES: Record<AlertTone, string> = {
  error: "border-orange-800 bg-peach-100 text-orange-800",
  success: "border-aqua-500 bg-aqua-100 text-aqua-500",
  warning: "border-yellow-600 bg-yellow-100 text-yellow-600",
  info: "border-lavender-500 bg-lavender-100 text-lavender-900",
};

export interface AlertProps {
  tone?: AlertTone;
  title?: string;
  children: ReactNode;
  className?: string;
}

/** Mensaje destacado para errores, avisos y confirmaciones. */
export function Alert({ tone = "info", title, children, className }: AlertProps) {
  return (
    <div
      role="status"
      className={cn(
        "rounded-card border-l-4 p-4 text-sm",
        TONES[tone],
        className
      )}
    >
      {title && <p className="mb-1 font-semibold">{title}</p>}
      {children}
    </div>
  );
}
