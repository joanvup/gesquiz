'use client';

/**
 * Lectura del token CSRF desde document.cookie para componentes cliente.
 *
 * La cookie 'csrf' se crea con httpOnly: false precisamente para que el
 * cliente pueda leerla y enviarla en el header X-CSRF-TOKEN. El servidor
 * compara ese header contra el valor de la cookie (src/lib/csrf.ts).
 *
 * No usar getCsrfToken() de src/lib/csrf.ts en componentes cliente: ese
 * modulo depende de next/headers y solo funciona en Server Components.
 */
export function getCsrfTokenFromCookie(): string {
  if (typeof document === "undefined") return "";
  const match = document.cookie.match(/(?:^|; )csrf=([^;]*)/);
  return match ? decodeURIComponent(match[1]) : "";
}
