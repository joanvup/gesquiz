"use client";

import { Suspense } from "react";
import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Alert, Button, Card, PageHeader } from '@/components/ui';
import {
  QuizSettingsFields,
  type QuizSettingsValues,
} from '../../QuizSettingsFields';

const INITIAL: QuizSettingsValues = {
  titulo: '',
  descripcion: '',
  instrucciones: '',
  permitirRetroceso: true,
  tiempoLimiteMinutos: '',
  ordenAleatorioPreguntas: false,
  ordenAleatorioOpciones: false,
  intentosPermitidos: '1',
  ventanaAbre: '',
  ventanaCierra: '',
  mostrarResultado: 'NOTA',
  modoSeguro: true,
  maxInfracciones: '3',
  publicado: false,
};

function EditarQuizPageContent({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [values, setValues] = useState<QuizSettingsValues>(INITIAL);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  function set<K extends keyof QuizSettingsValues>(
    key: K,
    value: QuizSettingsValues[K]
  ) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  useEffect(() => {
    fetch('/api/docente/quizzes/' + id)
      .then((res) => res.json())
      .then((data) => {
        if (data.quiz) {
          const q = data.quiz;
          setValues({
            titulo: q.titulo || '',
            descripcion: q.descripcion || '',
            instrucciones: q.instrucciones || '',
            permitirRetroceso: q.permitirRetroceso,
            tiempoLimiteMinutos: q.tiempoLimiteMinutos
              ? q.tiempoLimiteMinutos.toString()
              : '',
            ordenAleatorioPreguntas: q.ordenAleatorioPreguntas,
            ordenAleatorioOpciones: q.ordenAleatorioOpciones,
            intentosPermitidos: q.intentosPermitidos
              ? q.intentosPermitidos.toString()
              : '1',
            ventanaAbre: q.ventanaAbre ? q.ventanaAbre.substring(0, 16) : '',
            ventanaCierra: q.ventanaCierra ? q.ventanaCierra.substring(0, 16) : '',
            mostrarResultado: q.mostrarResultado || 'NOTA',
            modoSeguro: q.modoSeguro,
            maxInfracciones: q.maxInfracciones ? q.maxInfracciones.toString() : '3',
            publicado: q.publicado,
          });
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      const res = await fetch('/api/docente/quizzes/' + id, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          titulo: values.titulo,
          descripcion: values.descripcion || null,
          instrucciones: values.instrucciones || null,
          permitirRetroceso: values.permitirRetroceso,
          tiempoLimiteMinutos: values.tiempoLimiteMinutos
            ? parseInt(values.tiempoLimiteMinutos)
            : null,
          ordenAleatorioPreguntas: values.ordenAleatorioPreguntas,
          ordenAleatorioOpciones: values.ordenAleatorioOpciones,
          intentosPermitidos: parseInt(values.intentosPermitidos) || 1,
          ventanaAbre: values.ventanaAbre
            ? new Date(values.ventanaAbre).toISOString()
            : null,
          ventanaCierra: values.ventanaCierra
            ? new Date(values.ventanaCierra).toISOString()
            : null,
          mostrarResultado: values.mostrarResultado,
          modoSeguro: values.modoSeguro,
          maxInfracciones: parseInt(values.maxInfracciones) || 3,
          publicado: values.publicado,
        }),
      });

      const data = await res.json();
      if (data.success) {
        router.push('/docente');
      } else {
        setError(data.error || 'Error al actualizar');
        setSaving(false);
      }
    } catch {
      setError('Error de red');
      setSaving(false);
    }
  }

  if (loading) {
    return <div className='py-12 text-center text-muted'>Cargando quiz...</div>;
  }

  return (
    <div>
      <PageHeader
        title='Configurar Quiz'
        breadcrumbs={
          <Link href='/docente' className='text-plum/60 transition-colors hover:text-plum'>
            ← Volver al panel
          </Link>
        }
      />

      {error && (
        <Alert tone='error' className='mb-6'>
          {error}
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        <Card className='space-y-6 p-8'>
          <QuizSettingsFields values={values} set={set} />

          <div className='flex justify-end gap-4 border-t border-line pt-4'>
            <Link
              href='/docente'
              className='inline-flex items-center justify-center rounded-btn border border-line-strong px-4 py-2.5 text-sm font-semibold text-plum transition-colors hover:bg-plum/5'
            >
              Cancelar
            </Link>
            <Button type='submit' disabled={saving}>
              {saving ? 'Guardando...' : 'Guardar Cambios'}
            </Button>
          </div>
        </Card>
      </form>
    </div>
  );
}

export default function EditarQuizPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<div className="py-12 text-center text-muted">Cargando...</div>}>
      <EditarQuizPageContent params={params} />
    </Suspense>
  );
}
