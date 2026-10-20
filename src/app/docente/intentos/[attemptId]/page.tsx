'use client';

import { Suspense } from 'react';
import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { gradeToPercentage } from '@/lib/scoring';

interface Question {
  id: string;
  tipo: string;
  enunciadoHtml: string;
  defaultGrade: number;
  options: Array<{
    id: string;
    textoHtml: string;
    esCorrecta: boolean;
    fraction: number;
    extraJson?: string | null;
  }>;
}

interface AttemptAnswer {
  id: string;
  questionId: string;
  respuestaJson?: string | null;
  respuestaTexto?: string | null;
  puntuacion: number | null;
  esCorrecta: boolean | null;
  calificadaManualmente: boolean;
}

interface AuditEvent {
  id: string;
  tipo: string;
  detalle?: string | null;
  ip?: string | null;
  userAgent?: string | null;
  createdAt: string;
  user?: {
    name: string;
    email: string;
  } | null;
}

interface AttemptDetail {
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
  quiz: {
    id: string;
    titulo: string;
    puntajeMaximo: number;
    questions: Question[];
  };
  answers: AttemptAnswer[];
  events: AuditEvent[];
}

function AttemptDetailContent({ params }: { params: Promise<{ attemptId: string }> }) {
  const { attemptId } = use(params);
  const router = useRouter();
  const [attempt, setAttempt] = useState<AttemptDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [essayScores, setEssayScores] = useState<Record<string, number>>({});
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (!attemptId) return;
    fetch('/api/docente/intentos/' + attemptId)
      .then((res) => res.json())
      .then((data) => {
        if (data.attempt) {
          setAttempt(data.attempt);
          const initialScores: Record<string, number> = {};
          data.attempt.answers.forEach((ans: AttemptAnswer) => {
            if (ans.puntuacion !== null) {
              initialScores[ans.questionId] = ans.puntuacion;
            }
          });
          setEssayScores(initialScores);
        } else if (data.error) {
          setError(data.error);
        }
        setLoading(false);
      })
      .catch(() => {
        setError('Error al cargar intento');
        setLoading(false);
      });
  }, [attemptId]);

  async function handleGradeEssay(questionId: string) {
    const score = essayScores[questionId];
    if (score === undefined || isNaN(score)) {
      alert('Ingrese una puntuación válida');
      return;
    }
    setActionLoading(true);
    try {
      const res = await fetch('/api/docente/intentos/' + attemptId + '/calificar-essay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questionId, puntuacion: Number(score) }),
      });
      const data = await res.json();
      if (data.success && data.attempt) {
        const refRes = await fetch('/api/docente/intentos/' + attemptId);
        const refData = await refRes.json();
        if (refData.attempt) setAttempt(refData.attempt);
        alert('Calificación guardada exitosamente');
      } else {
        alert(data.error || 'Error al calificar');
      }
    } catch {
      alert('Error de red');
    } finally {
      setActionLoading(false);
    }
  }

  async function handleReopen() {
    const motivo = prompt('Motivo de la reapertura:', 'Reabierto por solicitud del estudiante');
    if (motivo === null) return;
    setActionLoading(true);
    try {
      const res = await fetch('/api/docente/intentos/' + attemptId + '/reabrir', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ motivo }),
      });
      const data = await res.json();
      if (data.success) {
        router.refresh();
        window.location.reload();
      } else {
        alert(data.error || 'Error al reabrir');
      }
    } catch {
      alert('Error de red');
    } finally {
      setActionLoading(false);
    }
  }

  async function handleAnnul() {
    const motivo = prompt('Motivo de la anulación:', 'Anulado por fraude o regla incumplida');
    if (motivo === null) return;
    setActionLoading(true);
    try {
      const res = await fetch('/api/docente/intentos/' + attemptId + '/anular', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ motivo }),
      });
      const data = await res.json();
      if (data.success) {
        router.refresh();
        window.location.reload();
      } else {
        alert(data.error || 'Error al anular');
      }
    } catch {
      alert('Error de red');
    } finally {
      setActionLoading(false);
    }
  }

  if (loading) {
    return <div className='p-8 text-center text-slate-500'>Cargando detalle del intento...</div>;
  }

  if (error || !attempt) {
    return (
      <div className='p-8 max-w-4xl mx-auto'>
        <div className='p-4 bg-red-50 text-red-700 rounded-lg mb-4'>{error || 'No encontrado'}</div>
        <Link href='/docente' className='text-indigo-600 hover:underline'>Volver al panel</Link>
      </div>
    );
  }

  return (
    <div className='flex-1 p-8 max-w-5xl mx-auto w-full'>
      <div className='flex justify-between items-center bg-white p-6 rounded-xl shadow-sm border border-slate-200 mb-8'>
        <div>
          <div className='flex items-center gap-3 mb-1'>
            <Link href={'/docente/quizzes/' + attempt.quiz.id + '/resultados'} className='text-indigo-600 hover:underline text-sm'>← Resultados</Link>
          </div>
          <h1 className='text-2xl font-bold text-slate-800'>Intento #{attempt.numeroAttempt} - {attempt.student.name}</h1>
          <p className='text-slate-600 text-sm'>Quiz: {attempt.quiz.titulo} | Email: {attempt.student.email}</p>
        </div>
        <div className='flex gap-3'>
          <button
            onClick={handleReopen}
            disabled={actionLoading}
            className='px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-medium rounded-lg transition text-sm'
          >
            Reabrir Intento
          </button>
          <button
            onClick={handleAnnul}
            disabled={actionLoading}
            className='px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition text-sm'
          >
            Anular Intento
          </button>
        </div>
      </div>

      <div className='grid grid-cols-1 md:grid-cols-4 gap-6 mb-8'>
        <div className='bg-white p-6 rounded-xl shadow-sm border border-slate-200'>
          <span className='text-xs text-slate-500 font-medium uppercase'>Estado</span>
          <p className='text-lg font-bold text-slate-800 mt-1'>{attempt.status}</p>
        </div>
        <div className='bg-white p-6 rounded-xl shadow-sm border border-slate-200'>
          <span className='text-xs text-slate-500 font-medium uppercase'>Nota Obtenida</span>
          <p className='text-lg font-bold text-slate-800 mt-1'>
            {gradeToPercentage(attempt.score ?? 0, attempt.quiz.puntajeMaximo)} / 100
          </p>
        </div>
        <div className='bg-white p-6 rounded-xl shadow-sm border border-slate-200'>
          <span className='text-xs text-slate-500 font-medium uppercase'>Infracciones</span>
          <p className='text-lg font-bold text-slate-800 mt-1'>{attempt.infractions}</p>
        </div>
        <div className='bg-white p-6 rounded-xl shadow-sm border border-slate-200'>
          <span className='text-xs text-slate-500 font-medium uppercase'>Fecha Envío</span>
          <p className='text-sm font-semibold text-slate-800 mt-1'>{attempt.submittedAt ? new Date(attempt.submittedAt).toLocaleString() : 'En curso'}</p>
        </div>
      </div>

      <div className='bg-white rounded-xl shadow-sm border border-slate-200 mb-8 p-6'>
        <h3 className='text-lg font-semibold text-slate-800 mb-6'>Preguntas y Respuestas del Estudiante</h3>
        <div className='space-y-8'>
          {attempt.quiz.questions.map((q, idx) => {
            const ans = attempt.answers.find((a) => a.questionId === q.id);
            return (
              <div key={q.id} className='p-6 bg-slate-50 rounded-xl border border-slate-200'>
                <div className='flex justify-between items-start mb-3'>
                  <span className='font-semibold text-slate-700'>Pregunta {idx + 1} ({q.tipo})</span>
                  <span className='text-xs font-medium px-2.5 py-1 bg-white rounded border border-slate-200 text-slate-600'>
                    Puntaje: {gradeToPercentage(ans?.puntuacion ?? 0, q.defaultGrade)} / 100
                  </span>
                </div>
                <div className='text-slate-800 mb-4 prose max-w-none text-sm' dangerouslySetInnerHTML={{ __html: q.enunciadoHtml }} />

                <div className='bg-white p-4 rounded-lg border border-slate-200 mb-4 text-sm'>
                  <span className='font-semibold text-slate-600 block mb-1'>Respuesta del estudiante:</span>
                  <p className='text-slate-800'>
                    {ans?.respuestaTexto || ans?.respuestaJson || <span className='text-slate-400 italic'>Sin respuesta</span>}
                  </p>
                </div>

                {q.tipo === 'ESSAY' && (
                  <div className='bg-indigo-50 p-4 rounded-lg border border-indigo-100 flex items-center gap-4'>
                    <div className='flex-1'>
                      <label className='block text-xs font-semibold text-indigo-900 mb-1'>Calificación manual (0 a {q.defaultGrade}):</label>
                      <input
                        type='number'
                        step='0.1'
                        min='0'
                        max={q.defaultGrade}
                        value={essayScores[q.id] ?? ''}
                        onChange={(e) => setEssayScores({ ...essayScores, [q.id]: parseFloat(e.target.value) })}
                        className='w-full px-3 py-1.5 bg-white border border-indigo-200 rounded text-sm'
                      />
                    </div>
                    <button
                      onClick={() => handleGradeEssay(q.id)}
                      disabled={actionLoading}
                      className='mt-5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded text-sm transition'
                    >
                      Guardar Calificación
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className='bg-white rounded-xl shadow-sm border border-slate-200 p-6'>
        <h3 className='text-lg font-semibold text-slate-800 mb-6'>Línea de Tiempo de Auditoría (AuditEvent)</h3>
        {attempt.events.length === 0 ? (
          <p className='text-slate-500 text-sm'>No hay eventos de auditoría registrados.</p>
        ) : (
          <div className='space-y-4'>
            {attempt.events.map((ev) => (
              <div key={ev.id} className='flex items-start gap-4 p-4 bg-slate-50 rounded-lg border border-slate-200 text-sm'>
                <div className='w-32 flex-shrink-0 text-xs text-slate-500 font-mono'>
                  {new Date(ev.createdAt).toLocaleString()}
                </div>
                <div className='flex-1'>
                  <div className='flex items-center gap-2 mb-1'>
                    <span className='font-semibold text-slate-800 px-2 py-0.5 bg-slate-200 rounded text-xs'>{ev.tipo}</span>
                    {ev.user && <span className='text-xs text-slate-600'>por {ev.user.name}</span>}
                  </div>
                  <p className='text-slate-700 text-xs'>{ev.detalle || 'Sin detalle'}</p>
                  {(ev.ip || ev.userAgent) && (
                    <div className='mt-2 text-[11px] text-slate-400 font-mono flex gap-4'>
                      {ev.ip && <span>IP: {ev.ip}</span>}
                      {ev.userAgent && <span className='truncate max-w-md'>UA: {ev.userAgent}</span>}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function AttemptDetailPage({ params }: { params: Promise<{ attemptId: string }> }) {
  return (
    <Suspense fallback={<div className='p-8 text-center text-slate-500'>Cargando detalle...</div>}>
      <AttemptDetailContent params={params} />
    </Suspense>
  );
}
