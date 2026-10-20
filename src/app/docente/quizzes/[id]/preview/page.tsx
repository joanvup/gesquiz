"use client";

import { Suspense } from "react";



import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { isRespuestaUnica } from '@/lib/question-type';

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
    return <div className='p-8 text-center text-slate-500'>Cargando vista previa...</div>;
  }

  if (error || !quiz) {
    return (
      <div className='p-8 text-center'>
        <div className='text-red-600 mb-4'>{error || 'Quiz no encontrado'}</div>
        <Link href='/docente' className='text-indigo-600 underline text-sm'>Volver al panel</Link>
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
    <div className='flex-1 p-8 max-w-4xl mx-auto w-full'>
      <div className='bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-xl mb-6 text-sm flex justify-between items-center'>
        <span>Modo vista previa, no se registrarán intentos</span>
        <Link href='/docente' className='px-3 py-1 bg-white border border-amber-300 rounded font-medium text-xs hover:bg-amber-100'>
          Salir de vista previa
        </Link>
      </div>

      <div className='bg-white p-8 rounded-xl shadow-sm border border-slate-200 mb-6'>
        <h1 className='text-2xl font-bold text-slate-800 mb-2'>{quiz.titulo}</h1>
        <p className='text-slate-600 text-sm mb-4'>{quiz.descripcion}</p>
        {quiz.instrucciones && (
          <div className='p-4 bg-slate-50 rounded-lg text-xs text-slate-700 mb-4'>
            <strong>Instrucciones:</strong> {quiz.instrucciones}
          </div>
        )}
      </div>

      {questions.length === 0 ? (
        <div className='bg-white p-12 rounded-xl shadow-sm border border-slate-200 text-center'>
          <p className='text-slate-500 text-sm'>Este quiz no tiene preguntas importadas todavía.</p>
        </div>
      ) : (
        <div className='bg-white p-8 rounded-xl shadow-sm border border-slate-200 space-y-6'>
          <div className='flex justify-between items-center border-b border-slate-100 pb-4'>
            <span className='text-sm font-semibold text-slate-700'>
              Pregunta {currentIndex + 1} de {questions.length} ({currentQ.tipo})
            </span>
            <span className='text-xs font-medium px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-full'>
              Puntaje: {currentQ.defaultGrade}
            </span>
          </div>

          <div
            className='prose text-slate-800 text-sm'
            dangerouslySetInnerHTML={{ __html: currentQ.enunciadoHtml }}
          />

          <div className='space-y-3 pt-4'>
            {currentQ.options?.map((opt) => (
              <label
                key={opt.id}
                className='flex items-center gap-3 p-3 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer'
              >
                <input
                  type={isMultiChoice ? 'checkbox' : 'radio'}
                  name='preview-option'
                  className='text-indigo-600'
                />
                <span className='text-sm text-slate-700' dangerouslySetInnerHTML={{ __html: opt.textoHtml }} />
                {opt.esCorrecta && (
                  <span className='ml-auto text-[10px] bg-green-100 text-green-800 px-2 py-0.5 rounded font-semibold'>
                    Correcta (Vista Previa)
                  </span>
                )}
              </label>
            ))}
          </div>

          <div className='flex justify-between pt-6 border-t border-slate-100'>
            <button
              onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
              disabled={currentIndex === 0}
              className='px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium disabled:opacity-50'
            >
              Anterior
            </button>
            <button
              onClick={() => setCurrentIndex((prev) => Math.min(questions.length - 1, prev + 1))}
              disabled={currentIndex === questions.length - 1}
              className='px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium disabled:opacity-50'
            >
              Siguiente
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
export default function PreviewQuizPage( { params }: { params: Promise<{ id: string }> } ) {
  return (
      <Suspense fallback={<div className="p-8 text-center text-slate-500">Cargando...</div>}><PreviewQuizPageContent params={params} /></Suspense>
  );
}