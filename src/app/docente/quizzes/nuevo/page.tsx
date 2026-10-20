'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function NuevoQuizPage() {
  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [instrucciones, setInstrucciones] = useState('');
  const [permitirRetroceso, setPermitirRetroceso] = useState(true);
  const [tiempoLimiteMinutos, setTiempoLimiteMinutos] = useState('');
  const [ordenAleatorioPreguntas, setOrdenAleatorioPreguntas] = useState(false);
  const [ordenAleatorioOpciones, setOrdenAleatorioOpciones] = useState(false);
  const [intentosPermitidos, setIntentosPermitidos] = useState('1');
  const [ventanaAbre, setVentanaAbre] = useState('');
  const [ventanaCierra, setVentanaCierra] = useState('');
  const [mostrarResultado, setMostrarResultado] = useState('NOTA');
  const [modoSeguro, setModoSeguro] = useState(true);
  const [maxInfracciones, setMaxInfracciones] = useState('3');
  const [publicado, setPublicado] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/docente/quizzes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          titulo,
          descripcion: descripcion || null,
          instrucciones: instrucciones || null,
          permitirRetroceso,
          tiempoLimiteMinutos: tiempoLimiteMinutos ? parseInt(tiempoLimiteMinutos) : null,
          ordenAleatorioPreguntas,
          ordenAleatorioOpciones,
          intentosPermitidos: parseInt(intentosPermitidos) || 1,
          ventanaAbre: ventanaAbre ? new Date(ventanaAbre).toISOString() : null,
          ventanaCierra: ventanaCierra ? new Date(ventanaCierra).toISOString() : null,
          mostrarResultado,
          modoSeguro,
          maxInfracciones: parseInt(maxInfracciones) || 3,
          publicado,
        }),
      });

      const data = await res.json();
      if (data.success) {
        router.push('/docente');
      } else {
        setError(data.error || 'Error al crear quiz');
        setLoading(false);
      }
    } catch {
      setError('Error de red');
      setLoading(false);
    }
  }

  return (
    <div className='flex-1 p-8 max-w-3xl mx-auto w-full'>
      <div className='mb-6 flex items-center justify-between'>
        <h1 className='text-2xl font-bold text-slate-800'>Crear Nuevo Quiz</h1>
        <Link href='/docente' className='text-sm text-indigo-600 hover:underline'>
          ← Volver al panel
        </Link>
      </div>

      {error && (
        <div className='mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm'>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className='bg-white p-8 rounded-xl shadow-sm border border-slate-200 space-y-6'>
        <div>
          <label className='block text-sm font-medium text-slate-700 mb-1'>Título *</label>
          <input
            type='text'
            required
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            className='w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500'
          />
        </div>

        <div>
          <label className='block text-sm font-medium text-slate-700 mb-1'>Descripción</label>
          <textarea
            rows={3}
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            className='w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500'
          />
        </div>

        <div>
          <label className='block text-sm font-medium text-slate-700 mb-1'>Instrucciones</label>
          <textarea
            rows={3}
            value={instrucciones}
            onChange={(e) => setInstrucciones(e.target.value)}
            className='w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500'
          />
        </div>

        <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
          <div>
            <label className='block text-sm font-medium text-slate-700 mb-1'>Tiempo límite (minutos)</label>
            <input
              type='number'
              placeholder='Ej. 30 (vacío = sin límite)'
              value={tiempoLimiteMinutos}
              onChange={(e) => setTiempoLimiteMinutos(e.target.value)}
              className='w-full px-3 py-2 border border-slate-300 rounded-lg text-sm'
            />
          </div>

          <div>
            <label className='block text-sm font-medium text-slate-700 mb-1'>Intentos permitidos</label>
            <input
              type='number'
              min={1}
              value={intentosPermitidos}
              onChange={(e) => setIntentosPermitidos(e.target.value)}
              className='w-full px-3 py-2 border border-slate-300 rounded-lg text-sm'
            />
          </div>
        </div>

        <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
          <div>
            <label className='block text-sm font-medium text-slate-700 mb-1'>Ventana abre</label>
            <input
              type='datetime-local'
              value={ventanaAbre}
              onChange={(e) => setVentanaAbre(e.target.value)}
              className='w-full px-3 py-2 border border-slate-300 rounded-lg text-sm'
            />
          </div>

          <div>
            <label className='block text-sm font-medium text-slate-700 mb-1'>Ventana cierra</label>
            <input
              type='datetime-local'
              value={ventanaCierra}
              onChange={(e) => setVentanaCierra(e.target.value)}
              className='w-full px-3 py-2 border border-slate-300 rounded-lg text-sm'
            />
          </div>
        </div>

        <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
          <div>
            <label className='block text-sm font-medium text-slate-700 mb-1'>Mostrar resultado</label>
            <select
              value={mostrarResultado}
              onChange={(e) => setMostrarResultado(e.target.value)}
              className='w-full px-3 py-2 border border-slate-300 rounded-lg text-sm'
            >
              <option value='NOTA'>Solo Nota</option>
              <option value='NOTA_Y_RESPUESTAS'>Nota y Respuestas</option>
              <option value='NADA'>Nada</option>
            </select>
          </div>

          <div>
            <label className='block text-sm font-medium text-slate-700 mb-1'>Máx. infracciones modo seguro</label>
            <input
              type='number'
              min={1}
              value={maxInfracciones}
              onChange={(e) => setMaxInfracciones(e.target.value)}
              className='w-full px-3 py-2 border border-slate-300 rounded-lg text-sm'
            />
          </div>
        </div>

        <div className='space-y-3'>
          <label className='flex items-center gap-2 text-sm text-slate-700'>
            <input
              type='checkbox'
              checked={permitirRetroceso}
              onChange={(e) => setPermitirRetroceso(e.target.checked)}
              className='rounded border-slate-300 text-indigo-600'
            />
            Permitir retroceso entre preguntas
          </label>

          <label className='flex items-center gap-2 text-sm text-slate-700'>
            <input
              type='checkbox'
              checked={ordenAleatorioPreguntas}
              onChange={(e) => setOrdenAleatorioPreguntas(e.target.checked)}
              className='rounded border-slate-300 text-indigo-600'
            />
            Orden aleatorio de preguntas
          </label>

          <label className='flex items-center gap-2 text-sm text-slate-700'>
            <input
              type='checkbox'
              checked={ordenAleatorioOpciones}
              onChange={(e) => setOrdenAleatorioOpciones(e.target.checked)}
              className='rounded border-slate-300 text-indigo-600'
            />
            Orden aleatorio de opciones
          </label>

          <label className='flex items-center gap-2 text-sm text-slate-700'>
            <input
              type='checkbox'
              checked={modoSeguro}
              onChange={(e) => setModoSeguro(e.target.checked)}
              className='rounded border-slate-300 text-indigo-600'
            />
            Activar modo seguro anti-copia (fullscreen / blur detection)
          </label>

          <label className='flex items-center gap-2 text-sm text-slate-700'>
            <input
              type='checkbox'
              checked={publicado}
              onChange={(e) => setPublicado(e.target.checked)}
              className='rounded border-slate-300 text-indigo-600'
            />
            Publicar quiz (visible para estudiantes asignados)
          </label>
        </div>

        <div className='flex justify-end gap-4 pt-4 border-t border-slate-100'>
          <Link
            href='/docente'
            className='px-4 py-2 border border-slate-300 rounded-lg text-sm text-slate-700'
          >
            Cancelar
          </Link>
          <button
            type='submit'
            disabled={loading}
            className='px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition'
          >
            {loading ? 'Guardando...' : 'Crear Quiz'}
          </button>
        </div>
      </form>
    </div>
  );
}
