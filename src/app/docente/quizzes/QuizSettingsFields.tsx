'use client';

import { Input, Field, Select, Textarea } from '@/components/ui';

export interface QuizSettingsValues {
  titulo: string;
  descripcion: string;
  instrucciones: string;
  permitirRetroceso: boolean;
  tiempoLimiteMinutos: string;
  ordenAleatorioPreguntas: boolean;
  ordenAleatorioOpciones: boolean;
  intentosPermitidos: string;
  ventanaAbre: string;
  ventanaCierra: string;
  mostrarResultado: string;
  modoSeguro: boolean;
  maxInfracciones: string;
  publicado: boolean;
}

export type QuizSettingsSetter = <K extends keyof QuizSettingsValues>(
  key: K,
  value: QuizSettingsValues[K]
) => void;

const CHECKBOX =
  'h-4 w-4 shrink-0 rounded border-line-strong text-magenta accent-magenta focus:ring-2 focus:ring-magenta/40';

const CHECKBOX_LABEL =
  'flex cursor-pointer items-center gap-2.5 text-sm font-medium text-plum';

/**
 * Campos de configuracion de un quiz. Compartido por la pantalla de creación
 * y la de edicion: solo cambian los valores iniciales y la accion de envio.
 */
export function QuizSettingsFields({
  values,
  set,
}: {
  values: QuizSettingsValues;
  set: QuizSettingsSetter;
}) {
  return (
    <div className='space-y-6'>
      <Field label='Título *'>
        <Input
          type='text'
          required
          value={values.titulo}
          onChange={(e) => set('titulo', e.target.value)}
        />
      </Field>

      <Field label='Descripción'>
        <Textarea
          rows={3}
          value={values.descripcion}
          onChange={(e) => set('descripcion', e.target.value)}
        />
      </Field>

      <Field label='Instrucciones'>
        <Textarea
          rows={3}
          value={values.instrucciones}
          onChange={(e) => set('instrucciones', e.target.value)}
        />
      </Field>

      <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
        <Field label='Tiempo límite (minutos)' hint='Vacío = sin límite'>
          <Input
            type='number'
            placeholder='Ej. 30'
            value={values.tiempoLimiteMinutos}
            onChange={(e) => set('tiempoLimiteMinutos', e.target.value)}
          />
        </Field>

        <Field label='Intentos permitidos'>
          <Input
            type='number'
            min={1}
            value={values.intentosPermitidos}
            onChange={(e) => set('intentosPermitidos', e.target.value)}
          />
        </Field>
      </div>

      <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
        <Field label='Ventana abre'>
          <Input
            type='datetime-local'
            value={values.ventanaAbre}
            onChange={(e) => set('ventanaAbre', e.target.value)}
          />
        </Field>

        <Field label='Ventana cierra'>
          <Input
            type='datetime-local'
            value={values.ventanaCierra}
            onChange={(e) => set('ventanaCierra', e.target.value)}
          />
        </Field>
      </div>

      <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
        <Field label='Mostrar resultado'>
          <Select
            value={values.mostrarResultado}
            onChange={(e) => set('mostrarResultado', e.target.value)}
          >
            <option value='NOTA'>Solo Nota</option>
            <option value='NOTA_Y_RESPUESTAS'>Nota y Respuestas</option>
            <option value='NADA'>Nada</option>
          </Select>
        </Field>

        <Field label='Máx. infracciones modo seguro'>
          <Input
            type='number'
            min={1}
            value={values.maxInfracciones}
            onChange={(e) => set('maxInfracciones', e.target.value)}
          />
        </Field>
      </div>

      <div className='space-y-3 rounded-card bg-cream p-4'>
        <label className={CHECKBOX_LABEL}>
          <input
            type='checkbox'
            checked={values.permitirRetroceso}
            onChange={(e) => set('permitirRetroceso', e.target.checked)}
            className={CHECKBOX}
          />
          Permitir retroceso entre preguntas
        </label>

        <label className={CHECKBOX_LABEL}>
          <input
            type='checkbox'
            checked={values.ordenAleatorioPreguntas}
            onChange={(e) => set('ordenAleatorioPreguntas', e.target.checked)}
            className={CHECKBOX}
          />
          Orden aleatorio de preguntas
        </label>

        <label className={CHECKBOX_LABEL}>
          <input
            type='checkbox'
            checked={values.ordenAleatorioOpciones}
            onChange={(e) => set('ordenAleatorioOpciones', e.target.checked)}
            className={CHECKBOX}
          />
          Orden aleatorio de opciones
        </label>

        <label className={CHECKBOX_LABEL}>
          <input
            type='checkbox'
            checked={values.modoSeguro}
            onChange={(e) => set('modoSeguro', e.target.checked)}
            className={CHECKBOX}
          />
          Activar modo seguro anti-copia (fullscreen / blur detection)
        </label>

        <label className={CHECKBOX_LABEL}>
          <input
            type='checkbox'
            checked={values.publicado}
            onChange={(e) => set('publicado', e.target.checked)}
            className={CHECKBOX}
          />
          Publicar quiz (visible para estudiantes asignados)
        </label>
      </div>
    </div>
  );
}
