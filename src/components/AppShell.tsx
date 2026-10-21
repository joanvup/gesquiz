import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { getCsrfToken } from "@/lib/csrf";
import { LogoutButton } from "./LogoutButton";
import { NavLinks, type Role } from "./NavLinks";

/**
 * Encabezado persistente de los tres paneles (admin, docente y estudiante).
 *
 * El shell es un Server Component porque necesita la sesion para saber a que
 * panel pertenece el usuario y para pasarle el token CSRF al boton de logout
 * (sin el, el POST a /api/auth/logout se rechaza con 403).
 */
export async function AppShell({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();

  if (!user) {
    redirect("/login");
  }

  const csrfToken = await getCsrfToken();
  const role = user.role as Role;

  const home =
    role === "ADMIN" ? "/admin" : role === "TEACHER" ? "/docente" : "/estudiante";

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 border-b border-line bg-cream/90 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-6 px-6">
          <Link href={home} className="flex items-center gap-2.5 text-lg font-bold text-plum">
            <span
              aria-hidden
              className="h-7 w-7 rounded-btn bg-linear-to-r from-plum-deep to-plum"
            />
            QuizColegio
          </Link>

          <NavLinks role={role} />

          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-plum/60 sm:inline">{user.name}</span>
            <LogoutButton csrfToken={csrfToken} />
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-8">{children}</main>
    </div>
  );
}
