import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "ghost" | "plum" | "danger";
type Size = "sm" | "md" | "lg";

/*
 * Variantes inspiradas en wayground.com:
 * - primary: CTA magenta plano (el principal)
 * - secondary: Transparente con borde plum
 * - ghost: Texto plum con hover
 * - plum: Degradado plum para acciones de peso
 * - danger: Naranja para acciones destructivas
 */

/* Los colores se definen via CSS variables en globals.css:
   --color-plum, --color-magenta, --color-cream, etc.
 * Por aquí usamos las clases de Tailwind que referencean esas variables.
 */

/* Sizes más generosos inspirados en wayground */
const SIZES: Record<Size, string> = {
  sm: "px-4 py-2 text-sm",        // un poco más ancho/alto que antes
  md: "px-6 py-3 text-base",      // tamaño medio/grande
  lg: "px-8 py-4 text-base",      // tamaño grande para CTA
};

/* Variantes usando las variables CSS de wayground */
const VARIANTS: Record<Variant, string> = {
  primary:     /* CTA principal tipo wayground */
    "bg-magenta text-white hover:bg-magenta/90 focus-visible:ring-magenta/30",
  secondary:   /* Secundario con borde plum */
    "bg-transparent text-plum border border-line-strong hover:bg-plum/5 focus-visible:ring-plum/30",
  ghost:       /* Fantasma - texto plum */
    "bg-transparent text-plum/70 hover:bg-plum/5 hover:text-plum",
  plum:        /* Degradado plum para heroes */
    "bg-linear-to-r from-plum-deep to-plum text-cream hover:from-plum hover:to-plum focus-visible:ring-plum/40",
  danger:      /* Rojo para acciones destructivas */
    "bg-orange-800 text-white hover:bg-orange-700 focus-visible:ring-orange/50",
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
