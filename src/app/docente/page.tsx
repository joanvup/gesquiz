'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getCsrfTokenFromCookie } from '@/lib/csrf-client';
import { LogoutButton } from '@/components/LogoutButton';

interface QuizItem {
  id: string;
  titulo: string;
  descripcion?: string;
  publicado: boolean;
  puntajeMaximo: number;
  _count: {
    questions: number;
    assignments: number;
    attempts: number;
  };
}

export default function DocenteDashboard() {
  const [quizzes, setQuizzes] = useState<QuizItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    fetch('/api/docente/quizzes')
      .then((res) => res.json())
      .then((data) => {
        if (data.quizzes) {
          setQuizzes(data.quizzes);
        } else if (data.error) {
          setError(data.error);
        }
        setLoading(false);
      })
      .catch(() => {
        setError('Error al cargar quizzes');
        setLoading(false);
      });
  }, []);

  async function handleDelete(id: string) {
    if (!confirm('¿Está seguro de eliminar este quiz y todas sus preguntas?')) return;
    try {
      const res = await fetch('/api/docente/quizzes/' + id, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setQuizzes(quizzes.filter((q) => q.id !== id));
      } else {
        alert(data.error || 'Error al eliminar');
      }
    } catch {
      alert('Error de red');
    }
  }

  async function handleLogout() {
    await fetch('/api/auth/logout', {
      method: 'POST',
      headers: { 'X-CSRF-TOKEN': getCsrfTokenFromCookie() },
    });
    router.push('/login');
    router.refresh();
  }

  return (
    <div className='flex-1 p-8 max-w-6xl mx-auto w-full'>
      <div className='flex justify-between items-center bg-white p-6 rounded-xl shadow-sm border border-slate-200 mb-8'>
        <div>
          <h1 className='text-2xl font-bold text-slate-800'>Panel del Docente</h1>
          <p className='text-slate-600'>Gestión de Quizzes, Importación Moodle y Asignaciones</p>
        </div>
        <div className='flex gap-3'>
          <Link
            href='/docente/quizzes/nuevo'
            className='px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition text-sm flex items-center gap-2'
          >
            + Crear Nuevo Quiz
          </Link>
          <LogoutButton />
        </div>
      </div>

      {error && (
        <div className='mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm'>
          {error}
        </div>
      )}

      {loading ? (
        <div className='text-center py-12 text-slate-500'>Cargando quizzes...</div>
      ) : quizzes.length === 0 ? (
        <div className='bg-white p-12 rounded-xl shadow-sm border border-slate-200 text-center'>
          <h3 className='text-lg font-semibold text-slate-700 mb-2'>No hay quizzes creados</h3>
          <p className='text-slate-500 mb-6 text-sm'>Comienza creando tu primer cuestionario.</p>
          <Link
            href='/docente/quizzes/nuevo'
            className='px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium'
          >
            Crear Quiz
          </Link>
        </div>
      ) : (
        <div className='grid gap-6 md:grid-cols-2 lg:grid-cols-3'>
          {quizzes.map((q) => (
            <div key={q.id} className='bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col justify-between'>
              <div>
                <div className='flex justify-between items-start mb-3'>
                  <h3 className='font-semibold text-slate-800 text-lg'>{q.titulo}</h3>
                  <span
                    className={'px-2.5 py-0.5 rounded-full text-xs font-medium ' + (q.publicado ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800')}
                  >
                    {q.publicado ? 'Publicado' : 'Borrador'}
                  </span>
                </div>
                <p className='text-slate-500 text-sm mb-4 line-clamp-2'>{q.descripcion || 'Sin descripción'}</p>
                <div className='space-y-1 text-xs text-slate-600 mb-6'>
                  <div className='flex justify-between'>
                    <span>Preguntas:</span>
                    <span className='font-semibold'>{q._count.questions}</span>
                  </div>
                  <div className='flex justify-between'>
                    <span>Puntaje Máximo:</span>
                    <span className='font-semibold'>{q.puntajeMaximo}</span>
                  </div>
                  <div className='flex justify-between'>
                    <span>Asignaciones:</span>
                    <span className='font-semibold'>{q._count.assignments}</span>
                  </div>
                </div>
              </div>

              <div className='border-t border-slate-100 pt-4 flex flex-wrap gap-2 text-xs font-medium'>
                <Link
                  href={'/docente/quizzes/' + q.id + '/editar'}
                  className='px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded'
                >
                  Configurar
                </Link>
                <Link
                  href={'/docente/quizzes/' + q.id + '/importar'}
                  className='px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded'
                >
                  Importar XML
                </Link>
                <Link
                  href={'/docente/quizzes/' + q.id + '/asignar'}
                  className='px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded'
                >
                  Asignar
                </Link>
                <Link
                  href={'/docente/quizzes/' + q.id + '/preview'}
                  className='px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded'
                >
                  Vista previa
                </Link>
                <Link
                  href={'/docente/quizzes/' + q.id + '/resultados'}
                  className='px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded'
                >
                  Resultados
                </Link>
                <button
                  onClick={() => handleDelete(q.id)}
                  className='px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 rounded ml-auto'
                >
                  Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
