'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { getCsrfTokenFromCookie } from '@/lib/csrf-client';

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
      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg transition text-sm disabled:opacity-50"
    >
      {loading ? 'Cerrando...' : 'Cerrar Sesión'}
    </button>
  );
}
