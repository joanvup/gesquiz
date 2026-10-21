import crypto from "crypto";
import { cookies } from "next/headers";
import { db } from "@/lib/db";

export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

// Duracion maxima de una sesion: 7 dias
export const SESSION_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;
// Inactividad maxima antes de que la sesion se considere expirada: 24 horas
export const SESSION_IDLE_TIMEOUT_MS = 24 * 60 * 60 * 1000;

/**
 * Una sesion es valida mientras no este revocada, no haya pasado su vida
 * maxima, y no haya pasado el periodo de inactividad.
 */
export function isSessionExpired(
  session: { createdAt: Date; expiresAt: Date; revokedAt: Date | null },
  now: Date = new Date()
): boolean {
  if (session.revokedAt) return true;
  if (session.expiresAt <= now) return true;
  if (now.getTime() - session.createdAt.getTime() > SESSION_IDLE_TIMEOUT_MS) return true;
  return false;
}

export async function createSession(userId: string): Promise<string> {
  const tokenBytes = crypto.randomBytes(32);
  const token = tokenBytes.toString("hex");
  const tokenHash = hashToken(token);

  const expiresAt = new Date(Date.now() + SESSION_MAX_AGE_MS);

  // Revocar las sesiones anteriores del mismo usuario: si se inicia sesion
  // en otro navegador, la sesion vieja deja de ser valida de inmediato.
  // Sin esto, cerrar sesion en una pestana dejaba viva la de otra.
  await db.session.updateMany({
    where: { userId, revokedAt: null },
    data: { revokedAt: new Date() },
  });

  await db.session.create({
    data: {
      userId,
      tokenHash,
      expiresAt,
    },
  });

  const cookieStore = await cookies();
  cookieStore.set({
    name: "session",
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });

  return token;
}

export async function getSessionUser() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("session")?.value;
    if (!token) return null;

    const tokenHash = hashToken(token);
    const session = await db.session.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!session) {
      return null;
    }

    const now = new Date();

    // La sesion expira pasado el tiempo maximo o tras un periodo de inactividad.
    if (isSessionExpired(session, now)) {
      if (!session.revokedAt) {
        await db.session.update({
          where: { id: session.id },
          data: { revokedAt: now },
        });
      }
      return null;
    }

    return session.user;
  } catch {
    return null;
  }
}

export async function destroySession() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("session")?.value;

    if (token) {
      const tokenHash = hashToken(token);
      const session = await db.session.findUnique({
        where: { tokenHash },
      });

      if (session) {
        // Revocar TODAS las sesiones del usuario, no solo la de esta
        // pestana: asi el logout es efectivo en cualquier navegador.
        await db.session.updateMany({
          where: { userId: session.userId, revokedAt: null },
          data: { revokedAt: new Date() },
        });
      }
    }

    cookieStore.set({
      name: "session",
      value: "",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });
  } catch {}
}

export async function requireUser(allowedRoles?: string[]) {
  const user = await getSessionUser();
  if (!user) {
    throw new Error("No autenticado");
  }
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    throw new Error("No autorizado");
  }
  return user;
}


