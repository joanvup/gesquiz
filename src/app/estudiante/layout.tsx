import { getSessionUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { AppShell } from '@/components/AppShell';

// La verificacion de sesion no puede prerenderizarse: el layout debe
// ejecutarse en el servidor en cada request antes de renderizar el panel.
export const instant = false;

export default async function EstudianteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSessionUser();

  if (!user) {
    redirect('/login');
  }

  if (user.role !== 'STUDENT') {
    // Un docente o admin con sesion valida va a su propio panel.
    redirect(user.role === 'ADMIN' ? '/admin' : '/docente');
  }

  return <AppShell>{children}</AppShell>;
}
