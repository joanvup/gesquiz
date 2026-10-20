import { getSessionUser } from '@/lib/auth';
import { redirect } from 'next/navigation';

// La verificacion de sesion no puede prerenderizarse: el layout debe
// ejecutarse en el servidor en cada request antes de renderizar el panel.
export const instant = false;

export default async function DocenteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSessionUser();

  if (!user) {
    redirect('/login');
  }

  if (user.role !== 'TEACHER' && user.role !== 'ADMIN') {
    // Un estudiante con sesion valida no debe ver el panel de docente.
    redirect('/estudiante');
  }

  return <>{children}</>;
}
