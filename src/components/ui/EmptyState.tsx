import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";

export interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
}

/** Estado vacio: icono, mensaje y (opcionalmente) una accion. */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div className={cn("py-12 text-center", className)}>
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-peach-100 text-plum">
        <Icon size={22} strokeWidth={2} aria-hidden />
      </div>
      <h3 className="mb-1 text-lg font-semibold text-plum">{title}</h3>
      {description && (
        <p className="mx-auto max-w-md text-sm text-muted">{description}</p>
      )}
      {action && <div className="mt-6 flex justify-center">{action}</div>}
    </div>
  );
}
