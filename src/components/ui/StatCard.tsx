import { cn } from "@/lib/cn";

export type StatTone = "plum" | "magenta" | "aqua" | "peach" | "lavender" | "yellow";

const TONES: Record<StatTone, string> = {
  plum: "text-plum",
  magenta: "text-magenta",
  aqua: "text-aqua-500",
  peach: "text-orange-800",
  lavender: "text-lavender-500",
  yellow: "text-yellow-600",
};

export interface StatCardProps {
  label: string;
  value: React.ReactNode;
  tone?: StatTone;
  className?: string;
}

/** Cifra destacada con su etiqueta (contadores de resultados, etc.). */
export function StatCard({ label, value, tone = "plum", className }: StatCardProps) {
  return (
    <div
      className={cn(
        "rounded-card border border-line bg-cream px-4 py-3 text-center",
        className
      )}
    >
      <div className={cn("text-2xl font-bold", TONES[tone])}>{value}</div>
      <div className="mt-0.5 text-xs font-semibold text-plum/60">{label}</div>
    </div>
  );
}
