import { chromium } from 'playwright';
import Database from 'better-sqlite3';
import crypto from 'crypto';

const BASE = 'http://localhost:3000';
const OUT = process.argv[2] || 'C:/Users/Admin/Desktop/gesquiz/shots';

function sessionFor(email) {
  const db = new Database('dev.db');
  const user = db.prepare('SELECT id FROM User WHERE email = ?').get(email);
  const sessionToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(sessionToken).digest('hex');
  const csrfToken = crypto.randomBytes(24).toString('hex');
  const now = Date.now();
  db.prepare(
    `INSERT INTO Session (id, userId, tokenHash, createdAt, expiresAt) VALUES (?, ?, ?, ?, ?)`
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

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });

const external = [];
ctx.on('request', (r) => {
  const u = r.url();
  if (!u.startsWith(BASE) && !u.startsWith('data:') && !u.startsWith('blob:')) {
    external.push(u);
  }
});
const errors = [];
ctx.on('console', (m) => {
  if (m.type() === 'error') errors.push(m.text());
});
ctx.on('pageerror', (e) => errors.push('pageerror: ' + e.message));

async function shot(name, url, email) {
  const page = await ctx.newPage();
  if (email) {
    const { sessionToken, csrfToken } = sessionFor(email);
    await ctx.addCookies([
      { name: 'session', value: sessionToken, url: BASE },
      { name: 'csrf', value: csrfToken, url: BASE },
    ]);
  }
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${OUT}/${name}.png`, fullPage: true });
  console.log('OK', name, '->', page.url());
  await page.close();
}

await shot('01-home', `${BASE}/`);
await shot('02-login', `${BASE}/login`);
await shot('03-admin', `${BASE}/admin`, 'admin@quizcolegio.test');
await shot('04-admin-import-est', `${BASE}/admin/importar-estudiantes`, 'admin@quizcolegio.test');
await shot('05-docente', `${BASE}/docente`, 'docente@quizcolegio.test');
await shot('06-docente-nuevo', `${BASE}/docente/quizzes/nuevo`, 'docente@quizcolegio.test');
await shot('07-estudiante', `${BASE}/estudiante`, 'estudiante1@quizcolegio.test');

console.log('\n=== EXTERNAL REQUESTS ===');
console.log(external.length ? external.join('\n') : '(ninguna)');
console.log('\n=== CONSOLE ERRORS ===');
console.log(errors.length ? errors.join('\n') : '(ninguna)');

await browser.close();
