'use client';

import { Suspense } from 'react';
import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { gradeToPercentage } from '@/lib/scoring';

interface AttemptItem {
  id: string;
  numeroAttempt: number;
  status: string;
  score: number | null;
  infractions: number;
  startedAt: string;
  submittedAt: string | null;
  student: {
    id: string;
    name: string;
    email: string;
  };
}

interface QuizData {
  id: string;
  titulo: string;
  puntajeMaximo: number;
  attempts: AttemptItem[];
}

function QuizResultadosContent({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [quiz, setQuiz] = useState<QuizData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    fetch('/api/docente/quizzes/' + id + '/resultados')
      .then((res) => res.json())
      .then((data) => {
        if (data.quiz) {
          setQuiz(data.quiz);
        } else if (data.error) {
          setError(data.error);
        }
        setLoading(false);
      })
      .catch(() => {
        setError('Error al cargar resultados');
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return <div className='p-8 text-center text-slate-500'>Cargando resultados...</div>;
  }

  if (error || !quiz) {
    return (
      <div className='p-8 max-w-4xl mx-auto'>
        <div className='p-4 bg-red-50 text-red-700 rounded-lg mb-4'>{error || 'No encontrado'}</div>
        <Link href='/docente' className='text-indigo-600 hover:underline'>Volver al panel</Link>
      </div>
    );
  }

  return (
    <div className='flex-1 p-8 max-w-6xl mx-auto w-full'>
      <div className='flex justify-between items-center bg-white p-6 rounded-xl shadow-sm border border-slate-200 mb-8'>
        <div>
          <div className='flex items-center gap-3 mb-1'>
            <Link href='/docente' className='text-indigo-600 hover:underline text-sm'>← Panel</Link>
            <span className='text-slate-300'>/</span>
            <span className='text-slate-500 text-sm'>Resultados</span>
          </div>
          <h1 className='text-2xl font-bold text-slate-800'>{quiz.titulo}</h1>
          <p className='text-slate-600 text-sm'>Puntaje Máximo: {quiz.puntajeMaximo} | Total Intentos: {quiz.attempts.length}</p>
        </div>
        <div className='flex gap-3'>
          <a
            href={'/api/docente/quizzes/' + id + '/resultados?format=csv'}
            className='px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition text-sm flex items-center gap-2'
          >
            Exportar a CSV
          </a>
        </div>
      </div>

      <div className='bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden'>
        <div className='p-6 border-b border-slate-100'>
          <h3 className='font-semibold text-slate-800'>Intentos de Estudiantes</h3>
        </div>
        {quiz.attempts.length === 0 ? (
          <div className='p-12 text-center text-slate-500 text-sm'>No hay intentos registrados para este quiz.</div>
        ) : (
          <div className='overflow-x-auto'>
            <table className='w-full text-left border-collapse text-sm'>
              <thead>
                <tr className='bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold'>
                  <th className='p-4'>Estudiante</th>
                  <th className='p-4'>Email</th>
                  <th className='p-4'>Intento</th>
                  <th className='p-4'>Estado</th>
                  <th className='p-4'>Nota / Máx</th>
                  <th className='p-4'>Infracciones</th>
                  <th className='p-4'>Fecha Envío</th>
                  <th className='p-4 text-right'>Acciones</th>
                </tr>
              </thead>
              <tbody className='divide-y divide-slate-100'>
                {quiz.attempts.map((att) => (
                  <tr key={att.id} className='hover:bg-slate-50'>
                    <td className='p-4 font-medium text-slate-800'>{att.student.name}</td>
                    <td className='p-4 text-slate-600'>{att.student.email}</td>
                    <td className='p-4 text-slate-600'>#{att.numeroAttempt}</td>
                    <td className='p-4'>
                      <span
                        className={
                          'px-2.5 py-0.5 rounded-full text-xs font-medium ' +
                          (att.status === 'ENVIADO' || att.status === 'CALIFICADO'
                            ? 'bg-green-100 text-green-800'
                            : att.status === 'EN_CURSO'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-red-100 text-red-800')
                        }
                      >
                        {att.status}
                      </span>
                    </td>
                    <td className='p-4 font-semibold text-slate-800'>
                      {att.score !== null ? gradeToPercentage(att.score, quiz.puntajeMaximo) : '-'} / 100
                    </td>
                    <td className='p-4 text-slate-600'>{att.infractions}</td>
                    <td className='p-4 text-slate-500 text-xs'>
                      {att.submittedAt ? new Date(att.submittedAt).toLocaleString() : 'En curso'}
                    </td>
                    <td className='p-4 text-right'>
                      <Link
                        href={'/docente/intentos/' + att.id}
                        className='px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-medium rounded text-xs transition'
                      >
                        Ver Detalle & Auditoría
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default function QuizResultadosPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<div className='p-8 text-center text-slate-500'>Cargando resultados...</div>}>
      <QuizResultadosContent params={params} />
    </Suspense>
  );
}
