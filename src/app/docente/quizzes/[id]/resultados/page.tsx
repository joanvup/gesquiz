'use client';

import { Suspense } from 'react';
import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { Download } from 'lucide-react';
import { gradeToPercentage } from '@/lib/scoring';
import {
  Alert,
  Badge,
  Card,
  DataTable,
  EmptyState,
  PageHeader,
  StatCard,
} from '@/components/ui';

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

function statusTone(status: string) {
  if (status === 'ENVIADO' || status === 'CALIFICADO') return 'success' as const;
  if (status === 'EN_CURSO') return 'warning' as const;
  return 'danger' as const;
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
    return <div className='py-12 text-center text-muted'>Cargando resultados...</div>;
  }

  if (error || !quiz) {
    return (
      <div>
        <Alert tone='error' className='mb-4'>
          {error || 'No encontrado'}
        </Alert>
        <Link
          href='/docente'
          className='text-sm font-semibold text-plum/60 underline'
        >
          Volver al panel
        </Link>
      </div>
    );
  }

  const calificados = quiz.attempts.filter(
    (a) => a.score !== null && a.status !== 'ANULADO'
  ).length;
  const enCurso = quiz.attempts.filter((a) => a.status === 'EN_CURSO').length;

  return (
    <div>
      <PageHeader
        title={quiz.titulo}
        subtitle={`Puntaje Máximo: ${quiz.puntajeMaximo} | Total Intentos: ${quiz.attempts.length}`}
        breadcrumbs={
          <span className='flex items-center gap-2'>
            <Link href='/docente' className='text-plum/60 transition-colors hover:text-plum'>
              ← Panel
            </Link>
            <span aria-hidden>/</span>
            <span>Resultados</span>
          </span>
        }
        actions={
          <a
            href={'/api/docente/quizzes/' + id + '/resultados?format=csv'}
            className='inline-flex items-center justify-center gap-2 rounded-btn bg-magenta px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-magenta-hover'
          >
            <Download size={16} strokeWidth={2} aria-hidden />
            Exportar a CSV
          </a>
        }
      />

      <div className='mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3'>
        <StatCard label='Total Intentos' value={quiz.attempts.length} tone='plum' />
        <StatCard label='Calificados' value={calificados} tone='aqua' />
        <StatCard label='En Curso' value={enCurso} tone='yellow' />
      </div>

      <Card className='overflow-hidden'>
        <div className='border-b border-line p-6'>
          <h3 className='font-semibold text-plum'>Intentos de Estudiantes</h3>
        </div>
        {quiz.attempts.length === 0 ? (
          <EmptyState
            icon={Download}
            title='No hay intentos registrados para este quiz'
            description='Cuando los estudiantes realicen el quiz, sus intentos aparecerán aquí.'
          />
        ) : (
          <DataTable
            head={[
              'Estudiante',
              'Email',
              'Intento',
              'Estado',
              'Nota / Máx',
              'Infracciones',
              'Fecha Envío',
              'Acciones',
            ]}
          >
            {quiz.attempts.map((att) => (
              <tr key={att.id} className='transition-colors hover:bg-cream/60'>
                <td className='px-4 py-3 font-medium text-plum'>{att.student.name}</td>
                <td className='px-4 py-3 text-plum/70'>{att.student.email}</td>
                <td className='px-4 py-3 text-plum/70'>#{att.numeroAttempt}</td>
                <td className='px-4 py-3'>
                  <Badge tone={statusTone(att.status)}>{att.status}</Badge>
                </td>
                <td className='px-4 py-3 font-semibold text-plum'>
                  {att.score !== null
                    ? gradeToPercentage(att.score, quiz.puntajeMaximo)
                    : '-'}{' '}
                  / 100
                </td>
                <td className='px-4 py-3 text-plum/70'>{att.infractions}</td>
                <td className='px-4 py-3 text-xs text-muted'>
                  {att.submittedAt
                    ? new Date(att.submittedAt).toLocaleString()
                    : 'En curso'}
                </td>
                <td className='px-4 py-3 text-right'>
                  <Link
                    href={'/docente/intentos/' + att.id}
                    className='inline-flex items-center justify-center rounded-btn border border-line-strong px-3 py-1.5 text-xs font-semibold text-plum transition-colors hover:bg-plum/5'
                  >
                    Ver Detalle &amp; Auditoría
                  </Link>
                </td>
              </tr>
            ))}
          </DataTable>
        )}
      </Card>
    </div>
  );
}

export default function QuizResultadosPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<div className='py-12 text-center text-muted'>Cargando resultados...</div>}>
      <QuizResultadosContent params={params} />
    </Suspense>
  );
}
