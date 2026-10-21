import type { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /** Añade sombra y elevacion al pasar el cursor por encima. */
  interactive?: boolean;
  /** Variante de relleno: blanco (por defecto) o crema. */
  tone?: "white" | "cream";
}

export function Card({
  interactive = false,
  tone = "white",
  className,
  ...props
}: CardProps) {
  return (
    <div
      className={cn(
        "rounded-card border border-line shadow-card",
        tone === "white" ? "bg-white" : "bg-cream",
        interactive && "transition-shadow hover:shadow-card-hover",
        className
      )}
      {...props}
    />
  );
}
