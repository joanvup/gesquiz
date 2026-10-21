'use client';

import { Suspense } from 'react';
import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { RotateCcw, Ban } from 'lucide-react';
import { gradeToPercentage } from '@/lib/scoring';
import {
  Alert,
  Badge,
  Button,
  Card,
  Field,
  Input,
  PageHeader,
  StatCard,
} from '@/components/ui';

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
    return (
      <div className='py-12 text-center text-muted'>Cargando detalle del intento...</div>
    );
  }

  if (error || !attempt) {
    return (
      <div>
        <Alert tone='error' className='mb-4'>
          {error || 'No encontrado'}
        </Alert>
        <Link href='/docente' className='text-sm font-semibold text-plum/60 underline'>
          Volver al panel
        </Link>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title={`Intento #${attempt.numeroAttempt} - ${attempt.student.name}`}
        subtitle={`Quiz: ${attempt.quiz.titulo} | Email: ${attempt.student.email}`}
        breadcrumbs={
          <Link
            href={'/docente/quizzes/' + attempt.quiz.id + '/resultados'}
            className='text-plum/60 transition-colors hover:text-plum'
          >
            ← Resultados
          </Link>
        }
        actions={
          <>
            <Button
              variant='secondary'
              onClick={handleReopen}
              disabled={actionLoading}
            >
              <RotateCcw size={15} strokeWidth={2} aria-hidden />
              Reabrir Intento
            </Button>
            <Button variant='danger' onClick={handleAnnul} disabled={actionLoading}>
              <Ban size={15} strokeWidth={2} aria-hidden />
              Anular Intento
            </Button>
          </>
        }
      />

      <div className='mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4'>
        <StatCard label='Estado' value={attempt.status} tone='plum' />
        <StatCard
          label='Nota Obtenida'
          value={`${gradeToPercentage(attempt.score ?? 0, attempt.quiz.puntajeMaximo)} / 100`}
          tone='magenta'
        />
        <StatCard label='Infracciones' value={attempt.infractions} tone='peach' />
        <StatCard
          label='Fecha Envío'
          value={
            attempt.submittedAt
              ? new Date(attempt.submittedAt).toLocaleString()
              : 'En curso'
          }
          tone='lavender'
        />
      </div>

      <Card className='mb-8 p-6'>
        <h3 className='mb-6 text-lg font-semibold text-plum'>
          Preguntas y Respuestas del Estudiante
        </h3>
        <div className='space-y-8'>
          {attempt.quiz.questions.map((q, idx) => {
            const ans = attempt.answers.find((a) => a.questionId === q.id);
            return (
              <div
                key={q.id}
                className='rounded-card border border-line bg-cream p-6'
              >
                <div className='mb-3 flex flex-wrap items-start justify-between gap-2'>
                  <span className='font-semibold text-plum'>
                    Pregunta {idx + 1} ({q.tipo})
                  </span>
                  <Badge tone='neutral'>
                    Puntaje: {gradeToPercentage(ans?.puntuacion ?? 0, q.defaultGrade)} / 100
                  </Badge>
                </div>
                <div
                  className='moodle-content mb-4 text-sm'
                  dangerouslySetInnerHTML={{ __html: q.enunciadoHtml }}
                />

                <div className='mb-4 rounded-chip border border-line bg-white p-4 text-sm'>
                  <span className='mb-1 block font-semibold text-plum/70'>
                    Respuesta del estudiante:
                  </span>
                  <p className='text-plum'>
                    {ans?.respuestaTexto || ans?.respuestaJson || (
                      <span className='italic text-plum/40'>Sin respuesta</span>
                    )}
                  </p>
                </div>

                {q.tipo === 'ESSAY' && (
                  <div className='flex flex-wrap items-end gap-4 rounded-chip border border-lavender-200 bg-lavender-100 p-4'>
                    <div className='min-w-[200px] flex-1'>
                      <Field
                        label={`Calificación manual (0 a ${q.defaultGrade}):`}
                      >
                        <Input
                          type='number'
                          step='0.1'
                          min='0'
                          max={q.defaultGrade}
                          value={essayScores[q.id] ?? ''}
                          onChange={(e) =>
                            setEssayScores({
                              ...essayScores,
                              [q.id]: parseFloat(e.target.value),
                            })
                          }
                        />
                      </Field>
                    </div>
                    <Button
                      onClick={() => handleGradeEssay(q.id)}
                      disabled={actionLoading}
                    >
                      Guardar Calificación
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Card>

      <Card className='p-6'>
        <h3 className='mb-6 text-lg font-semibold text-plum'>
          Línea de Tiempo de Auditoría (AuditEvent)
        </h3>
        {attempt.events.length === 0 ? (
          <p className='text-sm text-muted'>
            No hay eventos de auditoría registrados.
          </p>
        ) : (
          <div className='space-y-4'>
            {attempt.events.map((ev) => (
              <div
                key={ev.id}
                className='flex items-start gap-4 rounded-chip border border-line bg-cream p-4 text-sm'
              >
                <div className='w-32 flex-shrink-0 font-mono text-xs text-plum/60'>
                  {new Date(ev.createdAt).toLocaleString()}
                </div>
                <div className='flex-1'>
                  <div className='mb-1 flex items-center gap-2'>
                    <Badge tone='neutral'>{ev.tipo}</Badge>
                    {ev.user && (
                      <span className='text-xs text-plum/60'>por {ev.user.name}</span>
                    )}
                  </div>
                  <p className='text-xs text-plum/80'>{ev.detalle || 'Sin detalle'}</p>
                  {(ev.ip || ev.userAgent) && (
                    <div className='mt-2 flex gap-4 font-mono text-[11px] text-plum/45'>
                      {ev.ip && <span>IP: {ev.ip}</span>}
                      {ev.userAgent && (
                        <span className='max-w-md truncate'>UA: {ev.userAgent}</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

export default function AttemptDetailPage({ params }: { params: Promise<{ attemptId: string }> }) {
  return (
    <Suspense fallback={<div className='py-12 text-center text-muted'>Cargando detalle...</div>}>
      <AttemptDetailContent params={params} />
    </Suspense>
  );
}
