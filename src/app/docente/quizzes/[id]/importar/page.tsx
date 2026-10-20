"use client";

import { Suspense } from "react";



import { useState, use } from 'react';
import Link from 'next/link';

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
    <div className='flex-1 p-8 max-w-4xl mx-auto w-full'>
      <div className='mb-6 flex items-center justify-between'>
        <h1 className='text-2xl font-bold text-slate-800'>Importar Preguntas Moodle XML</h1>
        <Link href='/docente' className='text-sm text-indigo-600 hover:underline'>
          ← Volver al panel
        </Link>
      </div>

      {error && (
        <div className='mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm'>
          {error}
        </div>
      )}

      <div className='bg-white p-8 rounded-xl shadow-sm border border-slate-200 mb-8'>
        <form onSubmit={handleImport} className='space-y-4'>
          <div>
            <label className='block text-sm font-medium text-slate-700 mb-2'>
              Seleccionar archivo Moodle XML (.xml, máx 10MB)
            </label>
            <input
              type='file'
              accept='.xml'
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className='w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100'
            />
          </div>
          <button
            type='submit'
            disabled={loading || !file}
            className='px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition disabled:opacity-50'
          >
            {loading ? 'Analizando e Importando...' : 'Importar y Actualizar Quiz'}
          </button>
        </form>
      </div>

      {report && (
        <div className='bg-white p-8 rounded-xl shadow-sm border border-slate-200 space-y-6'>
          <div className='border-b border-slate-100 pb-4 flex justify-between items-center'>
            <h3 className='text-lg font-bold text-slate-800'>Reporte de Importación</h3>
            {puntajeMaximo !== null && (
              <span className='px-3 py-1 bg-green-50 text-green-700 rounded-full text-sm font-semibold'>
                Puntaje Máximo Calculado: {puntajeMaximo}
              </span>
            )}
          </div>

          <div className='grid grid-cols-2 gap-4 text-center'>
            <div className='p-4 bg-slate-50 rounded-lg'>
              <div className='text-2xl font-bold text-indigo-600'>{report.preguntasImportadas}</div>
              <div className='text-xs text-slate-500 font-medium'>Preguntas Importadas</div>
            </div>
            <div className='p-4 bg-slate-50 rounded-lg'>
              <div className='text-2xl font-bold text-amber-600'>{report.preguntasOmitidas}</div>
              <div className='text-xs text-slate-500 font-medium'>Preguntas Omitidas / Errores</div>
            </div>
          </div>

          {report.advertencias.length > 0 && (
            <div>
              <h4 className='text-sm font-semibold text-amber-800 mb-2'>Advertencias:</h4>
              <ul className='list-disc pl-5 space-y-1 text-xs text-amber-700 bg-amber-50 p-4 rounded-lg'>
                {report.advertencias.map((adv, idx) => (
                  <li key={idx}>{adv}</li>
                ))}
              </ul>
            </div>
          )}

          <div>
            <h4 className='text-sm font-semibold text-slate-700 mb-2'>Detalle por Pregunta:</h4>
            <div className='border border-slate-200 rounded-lg overflow-hidden max-h-96 overflow-y-auto'>
              <table className='w-full text-left border-collapse text-xs'>
                <thead className='bg-slate-50 border-b border-slate-200 text-slate-600'>
                  <tr>
                    <th className='p-3'>Nombre</th>
                    <th className='p-3'>Tipo Moodle</th>
                    <th className='p-3'>Estado</th>
                    <th className='p-3'>Mensaje</th>
                  </tr>
                </thead>
                <tbody className='divide-y divide-slate-100'>
                  {report.detalles.map((d, idx) => (
                    <tr key={idx} className='hover:bg-slate-50'>
                      <td className='p-3 font-medium text-slate-800'>{d.nombre}</td>
                      <td className='p-3 text-slate-600'>{d.tipo}</td>
                      <td className='p-3'>
                        <span
                          className={'px-2 py-0.5 rounded text-[10px] font-semibold ' + (d.estado === 'IMPORTADA' ? 'bg-green-100 text-green-800' : d.estado === 'UNSUPPORTED' ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800')}
                        >
                          {d.estado}
                        </span>
                      </td>
                      <td className='p-3 text-slate-500'>{d.mensaje || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
export default function ImportarQuizPage( { params }: { params: Promise<{ id: string }> } ) {
  return (
      <Suspense fallback={<div className="p-8 text-center text-slate-500">Cargando...</div>}><ImportarQuizPageContent params={params} /></Suspense>
  );
}