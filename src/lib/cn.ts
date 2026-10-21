import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Une clases de Tailwind resolviendo los conflictos: la ultima clase
 * winner sobre las anteriores de la misma propiedad (por ejemplo, dos
 * `p-4` o un `bg-white` y un `bg-cream`).
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
