import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/*
 * Field inspirado en wayground.com:
 - Espaciado vertical aumentado (space-y-2 en lugar de space-y-1.5)
 - Etiquetas text-base font-medium para mejor legibilidad
 - Textos de ayuda text-sm con color muted
 - Errores en text-orange-800 (consistente con palette)
 */

export interface FieldProps {
  label: string;
  hint?: string;
  error?: string;
  children: ReactNode;
  className?: string;
}

/** Envoltorio de un control: etiqueta, ayuda opcional y error. */
export function Field({ label, hint, error, children, className }: FieldProps) {
  return (
    <div className={cn("space-y-2", className)}>
      <label className="block text-base font-medium text-plum">{label}</label>
      {children}
      {hint && !error && <p className="text-sm text-muted">{hint}</p>}
      {error && <p className="text-sm font-medium text-orange-800">{error}</p>}
    </div>
  );
}
