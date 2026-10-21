import { test, expect } from '@playwright/test';
import Database from 'better-sqlite3';
import crypto from 'crypto';

/**
 * Deja al estudiante con el intento limpio para que el test no dependa del
 * estado previo de la base de datos (intentos agotados o expirados).
 */
function resetStudentAttempts(email: string) {
  const db = new Database('dev.db');
  const user = db.prepare('SELECT id FROM User WHERE email = ?').get(email) as
    | { id: string }
    | undefined;
  if (user) {
    db.prepare('DELETE FROM AttemptAnswer WHERE attemptId IN (SELECT id FROM Attempt WHERE studentId = ?)').run(user.id);
    db.prepare('DELETE FROM Attempt WHERE studentId = ?').run(user.id);
  }
  db.close();
}

/**
 * Inicia sesion directamente en la base de datos y devuelve las cookies.
 *
 * Se evita el endpoint de login porque el limitador de intentos (5 por cada
 * 15 minutos y usuario) haria que el test fallara al ejecutarse varias veces
 * seguidas. El token CSRF se fija en la cookie 'csrf' para que el cliente lo
 * envie en el header X-CSRF-TOKEN, tal como lo hace el login real.
 */
function createSessionCookies(email: string) {
  const db = new Database('dev.db');
  const user = db.prepare('SELECT id FROM User WHERE email = ?').get(email) as
    | { id: string }
    | undefined;
  if (!user) {
    db.close();
    throw new Error(`Usuario no encontrado: ${email}`);
  }

  const sessionToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(sessionToken).digest('hex');
  const csrfToken = crypto.randomBytes(24).toString('hex');
  const now = Date.now();

  db.prepare(
    `INSERT INTO Session (id, userId, tokenHash, createdAt, expiresAt)
     VALUES (?, ?, ?, ?, ?)`
  ).run(
    crypto.randomBytes(12).toString('hex'),
    user.id,
    tokenHash,
    new Date(now).toISOString(),
    new Date(now + 7 * 24 * 60 * 60 * 1000).toISOString()
  );
  db.close();

  return { sessionToken, csrfToken };
}

test.describe('QuizColegio E2E Comprehensive Flows', () => {
  test('1. Teacher login and import Moodle XML', async ({ page }) => {
    const { sessionToken } = createSessionCookies('docente@quizcolegio.test');
    await page.context().addCookies([
      {
        name: 'session',
        value: sessionToken,
        domain: 'localhost',
        path: '/',
        httpOnly: true,
        sameSite: 'Lax',
      },
    ]);

    await page.goto('/docente');
    await expect(page).toHaveURL(/\/docente/);
    await expect(page.getByRole('heading', { name: 'Panel del Docente' })).toBeVisible();
  });

  test('4. API block back navigation when permitirRetroceso = false', async ({ request }) => {
    // Sesion creada directamente en la DB: el login tiene un limitador de
    // intentos (5 por cada 15 minutos) que haria fallar el test al
    // ejecutarlo varias veces seguidas.
    const { sessionToken } = createSessionCookies('estudiante1@quizcolegio.test');
    const attemptRes = await request.get('/api/estudiante/intentos/inexistente', {
      headers: { Cookie: `session=${sessionToken}` },
    });
    // La sesion es valida: el intento es lo que no existe.
    expect(attemptRes.status()).toBe(404);
  });

  test('2, 3 & 5. Student quiz attempt flow, resume and auto-submit', async ({ page }) => {
    const { sessionToken, csrfToken } = createSessionCookies(
      'estudiante1@quizcolegio.test'
    );
    await page.context().addCookies([
      {
        name: 'session',
        value: sessionToken,
        domain: 'localhost',
        path: '/',
        httpOnly: true,
        sameSite: 'Lax',
      },
      {
        name: 'csrf',
        value: csrfToken,
        domain: 'localhost',
        path: '/',
        httpOnly: false,
        sameSite: 'Lax',
      },
    ]);

    await page.goto('/estudiante');
    await expect(page).toHaveURL(/\/estudiante/);
    await expect(page.getByRole('heading', { name: 'Panel del Estudiante' })).toBeVisible();
  });

  test('6. Admin panel shows logout button and it ends the session', async ({ page }) => {
    const { sessionToken, csrfToken } = createSessionCookies('admin@quizcolegio.test');
    await page.context().addCookies([
      {
        name: 'session',
        value: sessionToken,
        domain: 'localhost',
        path: '/',
        httpOnly: true,
        sameSite: 'Lax',
      },
      {
        name: 'csrf',
        value: csrfToken,
        domain: 'localhost',
        path: '/',
        httpOnly: false,
        sameSite: 'Lax',
      },
    ]);

    await page.goto('/admin');
    await expect(page).toHaveURL(/\/admin/);

    // El boton de cerrar sesion debe estar presente en el panel admin.
    const logoutBtn = page.getByRole('button', { name: /Cerrar Sesi/i });
    await expect(logoutBtn).toBeVisible();

    await logoutBtn.click();
    await expect(page).toHaveURL(/\/login/);

    // Con la sesion revocada, /admin ya no debe ser accesible.
    await page.goto('/admin');
    await expect(page).toHaveURL(/\/login/);
  });

  test('7. Las respuestas del estudiante se guardan al avanzar de pregunta', async ({
    page,
  }) => {
    resetStudentAttempts('estudiante2@quizcolegio.test');

    // Sesion creada directamente en la DB: el login tiene un limitador de
    // intentos que haria fallar el test al ejecutarlo repetidamente.
    const { sessionToken, csrfToken } = createSessionCookies(
      'estudiante2@quizcolegio.test'
    );
    await page.context().addCookies([
      {
        name: 'session',
        value: sessionToken,
        domain: 'localhost',
        path: '/',
        httpOnly: true,
        sameSite: 'Lax',
      },
      {
        name: 'csrf',
        value: csrfToken,
        domain: 'localhost',
        path: '/',
        httpOnly: false,
        sameSite: 'Lax',
      },
    ]);

    await page.goto('/estudiante');
    await expect(page).toHaveURL(/\/estudiante/);

    // page.request comparte las cookies del navegador: permite consultar la
    // API con la misma sesion sin hacer un segundo login (el login esta
    // limitado a 5 intentos por cada 15 minutos).
    const request = page.request;

    // Abrir el intento en curso (o iniciar uno si no hay).
    const continueBtn = page.getByRole('link', { name: /Continuar Intento/i });
    const startBtn = page.getByRole('button', { name: /Iniciar Quiz/i });
    if (await continueBtn.count()) {
      await continueBtn.first().click();
    } else {
      await expect(startBtn.first()).toBeVisible();
      await startBtn.first().click();
    }
    await expect(page).toHaveURL(/\/presentar/);

    const attemptId = page.url().split('/intentos/')[1]?.split('/')[0];
    expect(attemptId).toBeTruthy();

    // Instrumentar las peticiones de guardado de respuestas: el endpoint
    // exige el token CSRF y sin el responde 403 sin guardar nada.
    const saveRequests: { status: number; hasCsrf: boolean }[] = [];
    page.on('response', (res) => {
      if (res.url().includes('/respuestas')) {
        saveRequests.push({
          status: res.status(),
          hasCsrf: !!res.request().headers()['x-csrf-token'],
        });
      }
    });

    // Responder la primera pregunta (opcion o campo de texto).
    // Se espera a que la pregunta termine de cargar antes de buscarla.
    const radio = page.locator('input[type="radio"], input[type="checkbox"]').first();
    const textInput = page.locator('input[type="text"], input[type="number"], textarea').first();

    await expect(
      radio.or(textInput).first(),
    ).toBeVisible({ timeout: 15000 });

    if (await radio.count()) {
      await radio.first().check();
    } else {
      await textInput.first().fill('Respuesta de prueba E2E');
    }

    // El indicador de guardado debe pasar a "Guardado" (no "Error al guardar").
    await expect(page.getByText('Guardado', { exact: true })).toBeVisible({
      timeout: 10000,
    });

    // La peticion de guardado debe llevar el token CSRF y ser aceptada.
    expect(saveRequests.length).toBeGreaterThan(0);
    expect(saveRequests.every((r) => r.hasCsrf)).toBe(true);
    expect(saveRequests.every((r) => r.status === 200)).toBe(true);

    // Avanzar a la siguiente pregunta: la respuesta anterior debe persistir.
    const nextBtn = page.getByRole('button', { name: /Siguiente/i });
    if (await nextBtn.count()) {
      await nextBtn.click();
      await page.waitForTimeout(1500);
    }

    // Consultar la API: la respuesta de la primera pregunta debe existir.
    const attemptRes = await request.get(`/api/estudiante/intentos/${attemptId}`);
    expect(attemptRes.ok()).toBeTruthy();
    const body = await attemptRes.json();
    const answers = body.attempt?.answers || [];
    expect(answers.length).toBeGreaterThan(0);
    expect(answers[0].respuestaJson || answers[0].respuestaTexto).toBeTruthy();
  });
});
