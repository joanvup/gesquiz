import type { InputHTMLAttributes, TextareaHTMLAttributes, SelectHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

/*
 * Estilo de control inspirado en wayground.com:
 * - rounded-lg con border-2 para campos sustanciales
 * - text-base para legibilidad
 * - border-plum con focus en magenta (paleta wayground)
 * - px-4 py-3 para buen padding horizontal/vertical
 */

const CONTROL =
  "w-full rounded-lg border-2 border-border bg-background px-4 py-3 text-base " +
  "placeholder:text-muted transition-colors " +
  "focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary " +
  "disabled:opacity-60 disabled:cursor-not-allowed";

export function Input({
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(CONTROL, className)} {...props} />;
}

export function Textarea({
  className,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "w-full rounded-lg border-2 border-border bg-background px-4 py-3 text-base " +
          "resize-y transition-colors",
        "focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary",
        className
      )}
      {...props}
    />
  );
}

export function Select({
  className,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        "w-full rounded-lg border-2 border-border bg-background px-4 py-3 text-base " +
          "focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary",
        className
      )}
      {...props}
    />
  );
}
