/**
 * Determina si una pregunta de opcion multiple admite UNA sola respuesta
 * (radio) o VARIAS (checkbox).
 *
 * La fuente autoritativa es el atributo <single> del XML de Moodle, que el
 * parser persiste en Question.datosJson como { respuestaUnica: boolean }.
 *
 * Cuando no hay ese dato (preguntas creadas a mano o importadas antes de este
 * cambio) se deduce contando las opciones con puntaje: una unica opcion
 * correcta significa respuesta unica. Es la misma regla que aplica el
 * corrector de puntajes, donde una sola opcion acertada da la maxima nota.
 */

export interface QuestionOptionForType {
  esCorrecta?: boolean | null;
  fraction?: number | null;
}

export interface QuestionForType {
  tipo: string;
  datosJson?: string | null;
  options?: QuestionOptionForType[];
}

export function isRespuestaUnica(question: QuestionForType): boolean {
  if (question.tipo !== 'MULTICHOICE') return true;

  if (question.datosJson) {
    try {
      const parsed = JSON.parse(question.datosJson);
      if (typeof parsed?.respuestaUnica === 'boolean') {
        return parsed.respuestaUnica;
      }
    } catch {
      // datosJson corrupto: se cae a la deduccion por opciones
    }
  }

  const options = question.options ?? [];
  if (options.length === 0) {
    // Sin informacion util: se asume respuesta unica, que es el caso mas
    // frecuente en Moodle y el mas restrictivo para el estudiante.
    return true;
  }

  const opcionesConPuntaje = options.filter(
    (o) => (o.fraction ?? (o.esCorrecta ? 100 : 0)) > 0
  );

  return opcionesConPuntaje.length === 1;
}
