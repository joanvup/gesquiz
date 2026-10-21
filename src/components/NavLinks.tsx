'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";

export type Role = "ADMIN" | "TEACHER" | "STUDENT";

interface NavItem {
  label: string;
  href: string;
}

const ITEMS: Record<Role, NavItem[]> = {
  ADMIN: [
    { label: "Panel", href: "/admin" },
    { label: "Importar estudiantes", href: "/admin/importar-estudiantes" },
    { label: "Importar grupos", href: "/admin/importar-grupos" },
  ],
  TEACHER: [
    { label: "Panel", href: "/docente" },
    { label: "Nuevo quiz", href: "/docente/quizzes/nuevo" },
  ],
  STUDENT: [{ label: "Panel", href: "/estudiante" }],
};

/**
 * Navegacion principal por rol. Es un Client Component porque necesita
 * `usePathname()` para marcar el enlace activo: los layouts no se vuelven a
 * renderizar al navegar y no pueden leer la ruta.
 */
export function NavLinks({ role }: { role: Role }) {
  const pathname = usePathname();
  const items = ITEMS[role];

  return (
    <nav className="hidden items-center gap-1 md:flex" aria-label="Navegacion principal">
      {items.map((item) => {
        const active =
          item.href === pathname || pathname.startsWith(`${item.href}/`);

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "rounded-chip px-3 py-1.5 text-sm font-semibold transition-colors",
              active
                ? "bg-plum text-cream"
                : "text-plum/65 hover:bg-plum/5 hover:text-plum"
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
