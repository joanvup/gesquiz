import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "ghost" | "plum" | "danger";
type Size = "sm" | "md" | "lg";

const VARIANTS: Record<Variant, string> = {
  // Magenta plano, el CTA de Wayground.
  primary:
    "bg-magenta text-white hover:bg-magenta-hover focus-visible:ring-magenta/50",
  // Transparente con borde plum: el boton secundario de Wayground.
  secondary:
    "bg-transparent text-plum border border-line-strong hover:bg-plum/5 focus-visible:ring-plum/30",
  // Sin borde, para acciones terciarias.
  ghost: "bg-transparent text-plum/70 hover:bg-plum/5 hover:text-plum",
  // Degradado plum: para heroes y acciones de peso.
  plum:
    "bg-linear-to-r from-plum-deep to-plum text-cream hover:from-plum hover:to-plum focus-visible:ring-plum/40",
  danger: "bg-orange-800 text-white hover:bg-orange focus-visible:ring-orange/50",
};

const SIZES: Record<Size, string> = {
  sm: "px-3 py-1.5 text-xs gap-1.5",
  md: "px-4 py-2.5 text-sm gap-2",
  lg: "px-6 py-3 text-base gap-2",
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
}

/**
 * Classes de un boton, reutilizables en enlaces (`<Link>`) que deben verse
 * igual que un boton pero navegan en vez de disparar una accion.
 */
export function buttonClass({
  variant = "primary",
  size = "md",
  fullWidth = false,
  className,
}: {
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
  className?: string;
} = {}) {
  return cn(
    "inline-flex items-center justify-center rounded-btn font-semibold transition-colors",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-cream",
    "disabled:opacity-50 disabled:pointer-events-none cursor-pointer",
    VARIANTS[variant],
    SIZES[size],
    fullWidth && "w-full",
    className
  );
}

/**
 * Boton base de la aplicacion. El texto visible lo decide quien lo usa:
 * los botones con significado funcional (Iniciar Quiz, Siguiente, Cerrar
 * Sesion) deben conservar su etiqueta actual.
 */
export function Button({
  variant = "primary",
  size = "md",
  fullWidth = false,
  className,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={buttonClass({ variant, size, fullWidth, className })}
      {...props}
    />
  );
}
