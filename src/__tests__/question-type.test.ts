import { describe, it, expect } from 'vitest';
import { isRespuestaUnica } from '../lib/question-type';

describe('Tipo de respuesta de preguntas MULTICHOICE', () => {
  it('usa el flag <single> persistido en datosJson', () => {
    expect(
      isRespuestaUnica({
        tipo: 'MULTICHOICE',
        datosJson: JSON.stringify({ respuestaUnica: true }),
        options: [
          { fraction: 100 },
          { fraction: 0 },
        ],
      })
    ).toBe(true);

    expect(
      isRespuestaUnica({
        tipo: 'MULTICHOICE',
        datosJson: JSON.stringify({ respuestaUnica: false }),
        options: [
          { fraction: 50 },
          { fraction: 50 },
        ],
      })
    ).toBe(false);
  });

  it('deduce respuesta unica cuando hay una sola opcion con puntaje', () => {
    expect(
      isRespuestaUnica({
        tipo: 'MULTICHOICE',
        options: [
          { fraction: 100 },
          { fraction: 0 },
          { fraction: 0 },
          { fraction: 0 },
        ],
      })
    ).toBe(true);
  });

  it('deduce respuesta multiple cuando hay varias opciones con puntaje', () => {
    expect(
      isRespuestaUnica({
        tipo: 'MULTICHOICE',
        options: [
          { fraction: 50 },
          { fraction: 50 },
          { fraction: -100 },
        ],
      })
    ).toBe(false);
  });

  it('usa esCorrecta cuando no hay fraction', () => {
    expect(
      isRespuestaUnica({
        tipo: 'MULTICHOICE',
        options: [
          { esCorrecta: true },
          { esCorrecta: false },
        ],
      })
    ).toBe(true);
  });

  it('asume respuesta unica si no hay informacion suficiente', () => {
    expect(isRespuestaUnica({ tipo: 'MULTICHOICE' })).toBe(true);
    expect(isRespuestaUnica({ tipo: 'MULTICHOICE', options: [] })).toBe(true);
    expect(isRespuestaUnica({ tipo: 'MULTICHOICE', datosJson: 'no-json' })).toBe(true);
  });

  it('siempre es respuesta unica para otros tipos de pregunta', () => {
    for (const tipo of ['TRUEFALSE', 'SHORTANSWER', 'NUMERICAL', 'MATCHING', 'ESSAY']) {
      expect(isRespuestaUnica({ tipo, options: [{ fraction: 100 }, { fraction: 100 }] })).toBe(true);
    }
  });
});
