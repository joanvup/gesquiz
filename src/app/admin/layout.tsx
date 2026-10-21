import { getSessionUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { AppShell } from '@/components/AppShell';

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

  return <AppShell>{children}</AppShell>;
}
