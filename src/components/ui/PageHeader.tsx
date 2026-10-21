import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export interface PageHeaderProps {
  title: string;
  subtitle?: ReactNode;
  /** Migas de pan o enlaces de retorno, sobre el titulo. */
  breadcrumbs?: ReactNode;
  actions?: ReactNode;
  className?: string;
}

/** Cabecera de pagina: titulo, subtitulo, migas y acciones. */
export function PageHeader({
  title,
  subtitle,
  breadcrumbs,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        "mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between",
        className
      )}
    >
      <div className="min-w-0">
        {breadcrumbs && (
          <div className="mb-2 text-sm text-plum/60">{breadcrumbs}</div>
        )}
        <h1 className="text-3xl font-bold tracking-tight text-plum">{title}</h1>
        {subtitle && (
          <p className="mt-1 text-plum/70">{subtitle}</p>
        )}
      </div>
      {actions && (
        <div className="flex flex-wrap items-center gap-3">{actions}</div>
      )}
    </div>
  );
}
