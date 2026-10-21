'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Download } from 'lucide-react';
import { Alert, Button, Card, DataTable, Field, PageHeader, StatCard } from '@/components/ui';

interface GrupoErrorItem {
  fila: number;
  mensaje: string;
}

interface GruposResult {
  totalProcesados: number;
  gruposCreados: number;
  miembrosVinculados: number;
  estudiantesCreados: number;
  errores: GrupoErrorItem[];
}

export default function ImportarGruposPage() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<GruposResult | null>(null);
  const [error, setError] = useState('');

  async function handleImport(e: React.FormEvent) {
    e.preventDefault();
    if (!file) {
      setError('Seleccione un archivo Excel (.xlsx)');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/admin/import/grupos', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (res.ok) {
        setResult(data);
      } else {
        setError(data.error || 'Error al importar grupos');
        if (data.errores) {
          setResult({
            totalProcesados: 0,
            gruposCreados: 0,
            miembrosVinculados: 0,
            estudiantesCreados: 0,
            errores: data.errores,
          });
        }
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
        title="Importar Grupos y Estudiantes desde Excel"
        breadcrumbs={
          <Link href='/admin' className='text-plum/60 transition-colors hover:text-plum'>
            ← Volver al panel
          </Link>
        }
      />

      {error && (
        <Alert tone="error" className="mb-6">
          {error}
        </Alert>
      )}

      <Card className="mb-8 space-y-4 p-8">
        <Alert tone="info" title="Instrucciones:">
          <p>
            Sube un archivo Excel (.xlsx) con columnas:{' '}
            <code className='rounded-chip border border-lavender-200 bg-white px-1.5 py-0.5'>Grupo</code>,{' '}
            <code className='rounded-chip border border-lavender-200 bg-white px-1.5 py-0.5'>Email</code>, y opcionalmente{' '}
            <code className='rounded-chip border border-lavender-200 bg-white px-1.5 py-0.5'>Nombre</code> (para autorregistro de estudiantes nuevos).
          </p>
          <a
            href='/plantillas/plantilla-grupos.xlsx'
            download
            className='mt-3 inline-flex items-center gap-2 rounded-btn border border-line-strong px-4 py-2 text-xs font-semibold text-plum transition-colors hover:bg-plum/5'
          >
            <Download size={14} strokeWidth={2} aria-hidden />
            Descargar Plantilla Excel (.xlsx)
          </a>
        </Alert>

        <form onSubmit={handleImport} className='space-y-4 pt-4'>
          <Field label='Seleccionar archivo Excel (.xlsx, max 10MB)'>
            <input
              type='file'
              accept='.xlsx'
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className='w-full text-sm text-plum/70 file:mr-4 file:rounded-btn file:border-0 file:bg-magenta-soft file:px-4 file:py-2 file:text-sm file:font-semibold file:text-magenta-dark hover:file:bg-peach-100'
            />
          </Field>
          <Button type='submit' disabled={loading || !file}>
            {loading ? 'Importando...' : 'Importar Grupos'}
          </Button>
        </form>
      </Card>

      {result && (
        <Card className='space-y-6 p-8'>
          <div className='border-b border-line pb-4'>
            <h3 className='text-lg font-bold text-plum'>Resultado de Importacion</h3>
          </div>

          <div className='grid grid-cols-1 gap-4 sm:grid-cols-3'>
            <StatCard label='Grupos Creados' value={result.gruposCreados} tone='magenta' />
            <StatCard label='Miembros Vinculados' value={result.miembrosVinculados} tone='aqua' />
            <StatCard label='Estudiantes Creados' value={result.estudiantesCreados} tone='lavender' />
          </div>

          {result.errores && result.errores.length > 0 && (
            <div>
              <h4 className='mb-2 text-sm font-semibold text-plum'>
                Detalle de Errores ({result.errores.length}):
              </h4>
              <div className='max-h-96 overflow-y-auto rounded-card border border-line'>
                <DataTable head={['Fila', 'Mensaje']}>
                  {result.errores.map((err, idx) => (
                    <tr key={idx} className='transition-colors hover:bg-cream/60'>
                      <td className='px-4 py-3 font-medium text-plum'>Fila {err.fila}</td>
                      <td className='px-4 py-3 text-orange-800'>{err.mensaje}</td>
                    </tr>
                  ))}
                </DataTable>
              </div>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
