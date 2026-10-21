"use client";

import { Suspense } from "react";
import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { Eye } from 'lucide-react';
import { isRespuestaUnica } from '@/lib/question-type';
import { Alert, Badge, Button, Card, EmptyState, PageHeader } from '@/components/ui';

function PreviewQuizPageContent({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  interface OptionItem {
    id: string;
    textoHtml: string;
    esCorrecta: boolean;
  }
  interface QuestionItem {
    id: string;
    tipo: string;
    defaultGrade: number;
    enunciadoHtml: string;
    datosJson?: string | null;
    options: OptionItem[];
  }
  interface QuizData {
    titulo: string;
    descripcion?: string;
    instrucciones?: string;
    questions: QuestionItem[];
  }
  const [quiz, setQuiz] = useState<QuizData | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/docente/quizzes/' + id)
      .then((res) => res.json())
      .then((data) => {
        if (data.quiz) {
          setQuiz(data.quiz);
        } else {
          setError(data.error || 'Quiz no encontrado');
        }
        setLoading(false);
      })
      .catch(() => {
        setError('Error al cargar quiz');
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return <div className='py-12 text-center text-muted'>Cargando vista previa...</div>;
  }

  if (error || !quiz) {
    return (
      <div className='py-12 text-center'>
        <Alert tone='error' className='mx-auto max-w-md'>
          {error || 'Quiz no encontrado'}
        </Alert>
        <Link
          href='/docente'
          className='mt-4 inline-block text-sm font-semibold text-plum/60 underline'
        >
          Volver al panel
        </Link>
      </div>
    );
  }

  const questions = quiz.questions || [];
  const currentQ = questions[currentIndex];
  // Misma regla que aplica el estudiante: el <single> del XML de Moodle
  // determina si la pregunta admite una o varias respuestas.
  const isMultiChoice = currentQ
    ? !isRespuestaUnica({
        tipo: currentQ.tipo,
        datosJson: currentQ.datosJson,
        options: currentQ.options,
      })
    : false;

  return (
    <div>
      <Alert tone='warning' className='mb-6 flex items-center justify-between gap-4'>
        <span>Modo vista previa, no se registrarán intentos</span>
        <Link
          href='/docente'
          className='shrink-0 rounded-btn border border-line-strong bg-white px-3 py-1 text-xs font-semibold text-plum transition-colors hover:bg-plum/5'
        >
          Salir de vista previa
        </Link>
      </Alert>

      <PageHeader
        title={quiz.titulo}
        subtitle={quiz.descripcion}
        breadcrumbs={
          <Link href='/docente' className='text-plum/60 transition-colors hover:text-plum'>
            ← Volver al panel
          </Link>
        }
      />

      {quiz.instrucciones && (
        <Card tone='cream' className='mb-6 p-4 text-xs text-plum/80'>
          <strong className='text-plum'>Instrucciones:</strong> {quiz.instrucciones}
        </Card>
      )}

      {questions.length === 0 ? (
        <Card>
          <EmptyState
            icon={Eye}
            title='Este quiz no tiene preguntas importadas todavía'
            description='Importa un archivo Moodle XML para llenar el cuestionario.'
          />
        </Card>
      ) : (
        <Card className='space-y-6 p-8'>
          <div className='flex flex-wrap items-center justify-between gap-2 border-b border-line pb-4'>
            <span className='text-sm font-semibold text-plum'>
              Pregunta {currentIndex + 1} de {questions.length}
            </span>
            <div className='flex items-center gap-2'>
              <Badge tone='lavender'>{currentQ.tipo}</Badge>
              <Badge tone='magenta'>Puntaje: {currentQ.defaultGrade}</Badge>
            </div>
          </div>

          <div
            className='moodle-content text-sm'
            dangerouslySetInnerHTML={{ __html: currentQ.enunciadoHtml }}
          />

          <div className='space-y-3 pt-4'>
            {currentQ.options?.map((opt) => (
              <label
                key={opt.id}
                className='flex cursor-pointer items-center gap-3 rounded-card border border-line bg-white p-3 transition-colors hover:border-line-strong hover:bg-cream/50'
              >
                <input
                  type={isMultiChoice ? 'checkbox' : 'radio'}
                  name='preview-option'
                  className='h-4 w-4 shrink-0 accent-magenta'
                />
                <span
                  className='text-sm text-plum'
                  dangerouslySetInnerHTML={{ __html: opt.textoHtml }}
                />
                {opt.esCorrecta && (
                  <Badge tone='success' className='ml-auto'>
                    Correcta (Vista Previa)
                  </Badge>
                )}
              </label>
            ))}
          </div>

          <div className='flex justify-between border-t border-line pt-6'>
            <Button
              variant='secondary'
              onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
              disabled={currentIndex === 0}
            >
              Anterior
            </Button>
            <Button
              onClick={() =>
                setCurrentIndex((prev) => Math.min(questions.length - 1, prev + 1))
              }
              disabled={currentIndex === questions.length - 1}
            >
              Siguiente
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}

export default function PreviewQuizPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<div className="py-12 text-center text-muted">Cargando...</div>}>
      <PreviewQuizPageContent params={params} />
    </Suspense>
  );
}
