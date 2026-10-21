import { getSessionUser } from '@/lib/auth';
import { getCsrfToken } from '@/lib/csrf';
import { redirect } from 'next/navigation';
import { LogoutButton } from '@/components/LogoutButton';

// La verificacion de sesion no puede prerenderizarse: el layout debe
// ejecutarse en el servidor en cada request antes de renderizar el panel.
export const instant = false;

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSessionUser();

  if (!user) {
    redirect('/login');
  }

  if (user.role !== 'ADMIN') {
    // Un docente o estudiante con sesion valida no debe ver el panel de admin.
    redirect(user.role === 'TEACHER' ? '/docente' : '/estudiante');
  }

  // El token CSRF se pasa al boton de logout para que el POST a
  // /api/auth/logout no sea rechazado con 403.
  const csrfToken = await getCsrfToken();

  return (
    <div className="flex-1 w-full">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-8 py-4 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-slate-800">
              Administrador: {user.name}
            </p>
            <p className="text-xs text-slate-500">{user.email}</p>
          </div>
          <LogoutButton csrfToken={csrfToken} />
        </div>
      </header>
      {children}
    </div>
  );
}
