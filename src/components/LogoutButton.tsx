'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';
import { getCsrfTokenFromCookie } from '@/lib/csrf-client';
import { cn } from '@/lib/cn';

/**
 * Boton de cierre de sesion compartido por los paneles de estudiante y
 * docente. Usa el endpoint /api/auth/logout, que valida el token CSRF y
 * revoca todas las sesiones del usuario en la base de datos.
 *
 * El token CSRF se puede pasar como prop (desde un Server Component) o se
 * lee de la cookie en el cliente.
 */
export function LogoutButton({ csrfToken }: { csrfToken?: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleLogout() {
    setLoading(true);
    try {
      // La cookie 'csrf' es la fuente de verdad: verifyCsrf la compara con
      // el header. Si el prop viene de un Server Component y no coincide
      // (p. ej. porque la cookie no existe todavia), el logout daria 403.
      const token = getCsrfTokenFromCookie() || csrfToken || '';
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: { 'X-CSRF-TOKEN': token },
      });
    } catch {
      // Si la red falla, se redirige igual: el servidor ya habra revocado
      // la sesion en la respuesta anterior o el usuario seguira en la app.
    } finally {
      router.push('/login');
      router.refresh();
    }
  }

  return (
    <button
      onClick={handleLogout}
      disabled={loading}
      aria-label="Cerrar Sesión"
      className={cn(
        'inline-flex items-center gap-2 rounded-btn border border-line-strong px-3 py-1.5',
        'text-sm font-semibold text-plum transition-colors hover:bg-plum/5',
        'disabled:opacity-50 cursor-pointer'
      )}
    >
      <LogOut size={15} strokeWidth={2} aria-hidden />
      {loading ? 'Cerrando...' : 'Cerrar Sesión'}
    </button>
  );
}
