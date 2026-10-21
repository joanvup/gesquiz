'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Download } from 'lucide-react';
import { Alert, Button, Card, DataTable, Field, PageHeader, StatCard } from '@/components/ui';

interface ImportErrorItem {
  fila: number;
  mensaje: string;
}

interface EstudiantesResult {
  totalProcesados: number;
  creados: number;
  actualizados: number;
  erroresParser: ImportErrorItem[];
  erroresDb: ImportErrorItem[];
}

export default function ImportarEstudiantesPage() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<EstudiantesResult | null>(null);
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

      const res = await fetch('/api/admin/import/estudiantes', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (res.ok) {
        setResult(data);
      } else {
        setError(data.error || 'Error al importar estudiantes');
        if (data.errores) {
          setResult({
            totalProcesados: 0,
            creados: 0,
            actualizados: 0,
            erroresParser: data.errores,
            erroresDb: [],
          });
        }
      }
    } catch {
      setError('Error de red al importar');
    } finally {
      setLoading(false);
    }
  }

  const allErrors = result ? [...(result.erroresParser || []), ...(result.erroresDb || [])] : [];

  return (
    <div>
      <PageHeader
        title="Importar Estudiantes desde Excel"
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
            <code className='rounded-chip border border-lavender-200 bg-white px-1.5 py-0.5'>Nombre</code>,{' '}
            <code className='rounded-chip border border-lavender-200 bg-white px-1.5 py-0.5'>Email</code>, y opcionalmente{' '}
            <code className='rounded-chip border border-lavender-200 bg-white px-1.5 py-0.5'>Contrasena</code>.
          </p>
          <a
            href='/plantillas/plantilla-estudiantes.xlsx'
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
            {loading ? 'Importando...' : 'Importar Estudiantes'}
          </Button>
        </form>
      </Card>

      {result && (
        <Card className='space-y-6 p-8'>
          <div className='border-b border-line pb-4'>
            <h3 className='text-lg font-bold text-plum'>Resultado de Importacion</h3>
          </div>

          <div className='grid grid-cols-1 gap-4 sm:grid-cols-3'>
            <StatCard label='Creados' value={result.creados} tone='magenta' />
            <StatCard label='Actualizados' value={result.actualizados} tone='aqua' />
            <StatCard label='Errores' value={allErrors.length} tone='peach' />
          </div>

          {allErrors.length > 0 && (
            <div>
              <h4 className='mb-2 text-sm font-semibold text-plum'>Detalle de Errores:</h4>
              <div className='max-h-96 overflow-y-auto rounded-card border border-line'>
                <DataTable head={['Fila', 'Mensaje']}>
                  {allErrors.map((err, idx) => (
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
