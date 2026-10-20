'use client';

import { useState } from 'react';
import Link from 'next/link';

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
    <div className='flex-1 p-8 max-w-4xl mx-auto w-full'>
      <div className='mb-6 flex items-center justify-between'>
        <h1 className='text-2xl font-bold text-slate-800'>Importar Estudiantes desde Excel</h1>
        <Link href='/admin' className='text-sm text-indigo-600 hover:underline'>
          ← Volver al panel
        </Link>
      </div>

      {error && (
        <div className='mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm'>
          {error}
        </div>
      )}

      <div className='bg-white p-8 rounded-xl shadow-sm border border-slate-200 mb-8 space-y-4'>
        <div className='bg-indigo-50 border border-indigo-100 p-4 rounded-lg text-sm text-indigo-900 space-y-2'>
          <p className='font-semibold'>Instrucciones:</p>
          <p>Sube un archivo Excel (.xlsx) con columnas: <code className='bg-white px-1.5 py-0.5 rounded border border-indigo-200'>Nombre</code>, <code className='bg-white px-1.5 py-0.5 rounded border border-indigo-200'>Email</code>, y opcionalmente <code className='bg-white px-1.5 py-0.5 rounded border border-indigo-200'>Contrasena</code>.</p>
          <div>
            <a
              href='/plantillas/plantilla-estudiantes.xlsx'
              download
              className='inline-block px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-medium transition mt-2'
            >
              Descargar Plantilla Excel (.xlsx)
            </a>
          </div>
        </div>

        <form onSubmit={handleImport} className='space-y-4 pt-4'>
          <div>
            <label className='block text-sm font-medium text-slate-700 mb-2'>
              Seleccionar archivo Excel (.xlsx, max 10MB)
            </label>
            <input
              type='file'
              accept='.xlsx'
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className='w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100'
            />
          </div>
          <button
            type='submit'
            disabled={loading || !file}
            className='px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition disabled:opacity-50'
          >
            {loading ? 'Importando...' : 'Importar Estudiantes'}
          </button>
        </form>
      </div>

      {result && (
        <div className='bg-white p-8 rounded-xl shadow-sm border border-slate-200 space-y-6'>
          <div className='border-b border-slate-100 pb-4'>
            <h3 className='text-lg font-bold text-slate-800'>Resultado de Importacion</h3>
          </div>

          <div className='grid grid-cols-3 gap-4 text-center'>
            <div className='p-4 bg-slate-50 rounded-lg'>
              <div className='text-2xl font-bold text-indigo-600'>{result.creados}</div>
              <div className='text-xs text-slate-500 font-medium'>Creados</div>
            </div>
            <div className='p-4 bg-slate-50 rounded-lg'>
              <div className='text-2xl font-bold text-blue-600'>{result.actualizados}</div>
              <div className='text-xs text-slate-500 font-medium'>Actualizados</div>
            </div>
            <div className='p-4 bg-slate-50 rounded-lg'>
              <div className='text-2xl font-bold text-red-600'>{allErrors.length}</div>
              <div className='text-xs text-slate-500 font-medium'>Errores</div>
            </div>
          </div>

          {allErrors.length > 0 && (
            <div>
              <h4 className='text-sm font-semibold text-slate-700 mb-2'>Detalle de Errores:</h4>
              <div className='border border-slate-200 rounded-lg overflow-hidden max-h-96 overflow-y-auto'>
                <table className='w-full text-left border-collapse text-xs'>
                  <thead className='bg-slate-50 border-b border-slate-200 text-slate-600'>
                    <tr>
                      <th className='p-3 w-20'>Fila</th>
                      <th className='p-3'>Mensaje</th>
                    </tr>
                  </thead>
                  <tbody className='divide-y divide-slate-100'>
                    {allErrors.map((err, idx) => (
                      <tr key={idx} className='hover:bg-slate-50'>
                        <td className='p-3 font-medium text-slate-800'>Fila {err.fila}</td>
                        <td className='p-3 text-red-600'>{err.mensaje}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
