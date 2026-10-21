import { cookies } from "next/headers";
import crypto from "crypto";

export async function getCsrfToken(): Promise<string> {
  const cookieStore = await cookies();
  let csrf = cookieStore.get("csrf")?.value;
  if (!csrf) {
    csrf = crypto.randomBytes(24).toString("hex");
  }
  return csrf;
}

/**
 * Guarda el token CSRF en una cookie legible por el cliente.
 *
 * La cookie debe vivir al menos lo mismo que la cookie de sesion: si el
 * navegador conserva la sesion pero descarta la cookie csrf, todos los POST
 * devolvienen 403 y el estudiante no puede guardar sus respuestas.
 */
export async function setCsrfToken(csrf: string, expires?: Date) {
  const cookieStore = await cookies();
  cookieStore.set({
    name: "csrf",
    value: csrf,
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    ...(expires ? { expires } : {}),
  });
}

/** Elimina la cookie CSRF (al cerrar sesion). */
export async function clearCsrfToken() {
  const cookieStore = await cookies();
  cookieStore.set({
    name: "csrf",
    value: "",
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

export async function verifyCsrf(request: Request): Promise<boolean> {
  const cookieStore = await cookies();
  const csrfCookie = cookieStore.get("csrf")?.value;
  const csrfHeader = request.headers.get("x-csrf-token");
  if (!csrfCookie || !csrfHeader || csrfCookie !== csrfHeader) {
    return false;
  }
  return true;
}
