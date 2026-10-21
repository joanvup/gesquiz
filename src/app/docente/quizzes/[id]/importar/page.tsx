"use client";

import { Suspense } from "react";
import { useState, use } from 'react';
import Link from 'next/link';
import { Alert, Badge, Button, Card, DataTable, Field, PageHeader, StatCard } from '@/components/ui';

interface Report {
  preguntasImportadas: number;
  preguntasOmitidas: number;
  advertencias: string[];
  detalles: Array<{
    nombre: string;
    tipo: string;
    estado: string;
    mensaje?: string;
  }>;
}

function ImportarQuizPageContent({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<Report | null>(null);
  const [puntajeMaximo, setPuntajeMaximo] = useState<number | null>(null);
  const [error, setError] = useState('');

  async function handleImport(e: React.FormEvent) {
    e.preventDefault();
    if (!file) {
      setError('Seleccione un archivo XML');
      return;
    }

    setLoading(true);
    setError('');
    setReport(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/docente/quizzes/' + id + '/import', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (data.success) {
        setReport(data.report);
        setPuntajeMaximo(data.puntajeMaximo);
      } else {
        setError(data.error || 'Error al importar archivo');
      }
    } catch {
      setError('Error de red al importar');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <PageHeader
        title='Importar Preguntas Moodle XML'
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

      <Card className='mb-8 p-8'>
        <form onSubmit={handleImport} className='space-y-4'>
          <Field label='Seleccionar archivo Moodle XML (.xml, máx 10MB)'>
            <input
              type='file'
              accept='.xml'
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className='w-full text-sm text-plum/70 file:mr-4 file:rounded-btn file:border-0 file:bg-magenta-soft file:px-4 file:py-2 file:text-sm file:font-semibold file:text-magenta-dark hover:file:bg-peach-100'
            />
          </Field>
          <Button type='submit' disabled={loading || !file}>
            {loading ? 'Analizando e Importando...' : 'Importar y Actualizar Quiz'}
          </Button>
        </form>
      </Card>

      {report && (
        <Card className='space-y-6 p-8'>
          <div className='flex flex-wrap items-center justify-between gap-3 border-b border-line pb-4'>
            <h3 className='text-lg font-bold text-plum'>Reporte de Importación</h3>
            {puntajeMaximo !== null && (
              <Badge tone='success'>
                Puntaje Máximo Calculado: {puntajeMaximo}
              </Badge>
            )}
          </div>

          <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
            <StatCard
              label='Preguntas Importadas'
              value={report.preguntasImportadas}
              tone='aqua'
            />
            <StatCard
              label='Preguntas Omitidas / Errores'
              value={report.preguntasOmitidas}
              tone='yellow'
            />
          </div>

          {report.advertencias.length > 0 && (
            <Alert tone='warning' title='Advertencias:'>
              <ul className='list-disc space-y-1 pl-5 text-xs'>
                {report.advertencias.map((adv, idx) => (
                  <li key={idx}>{adv}</li>
                ))}
              </ul>
            </Alert>
          )}

          <div>
            <h4 className='mb-2 text-sm font-semibold text-plum'>Detalle por Pregunta:</h4>
            <div className='max-h-96 overflow-y-auto rounded-card border border-line'>
              <DataTable head={['Nombre', 'Tipo Moodle', 'Estado', 'Mensaje']}>
                {report.detalles.map((d, idx) => (
                  <tr key={idx} className='transition-colors hover:bg-cream/60'>
                    <td className='px-4 py-3 font-medium text-plum'>{d.nombre}</td>
                    <td className='px-4 py-3 text-plum/70'>{d.tipo}</td>
                    <td className='px-4 py-3'>
                      <Badge
                        tone={
                          d.estado === 'IMPORTADA'
                            ? 'success'
                            : d.estado === 'UNSUPPORTED'
                              ? 'warning'
                              : 'danger'
                        }
                      >
                        {d.estado}
                      </Badge>
                    </td>
                    <td className='px-4 py-3 text-muted'>{d.mensaje || '-'}</td>
                  </tr>
                ))}
              </DataTable>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}

export default function ImportarQuizPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<div className="py-12 text-center text-muted">Cargando...</div>}>
      <ImportarQuizPageContent params={params} />
    </Suspense>
  );
}
