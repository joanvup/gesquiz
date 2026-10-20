import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import { verifyCsrf } from '@/lib/csrf';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ attemptId: string }> }
) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    // Verificación CSRF: el token debe venir en el header X-CSRF-TOKEN
    // y coincidir con la cookie csrf (generada al login)
    const csrfValid = await verifyCsrf(request);
    if (!csrfValid) {
      return NextResponse.json({ error: 'Token CSRF inválido' }, { status: 403 });
    }

    const { attemptId } = await params;
    const attempt = await db.attempt.findUnique({
      where: { id: attemptId },
    });

    if (!attempt) {
      return NextResponse.json({ error: 'Intento no encontrado' }, { status: 404 });
    }

    if (attempt.studentId !== user.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    if (attempt.status !== 'EN_CURSO') {
      return NextResponse.json({ error: 'El intento ya no está en curso' }, { status: 400 });
    }

    if (attempt.expiresAt && new Date(attempt.expiresAt) < new Date()) {
      return NextResponse.json({ error: 'El tiempo límite ha expirado' }, { status: 400 });
    }

    const body = await request.json();
    const { questionId, respuestaJson, respuestaTexto } = body;

    if (!questionId) {
      return NextResponse.json({ error: 'questionId requerido' }, { status: 400 });
    }

    const answer = await db.attemptAnswer.upsert({
      where: {
        attemptId_questionId: {
          attemptId,
          questionId,
        },
      },
      update: {
        respuestaJson: respuestaJson !== undefined ? respuestaJson : undefined,
        respuestaTexto: respuestaTexto !== undefined ? respuestaTexto : undefined,
      },
      create: {
        attemptId,
        questionId,
        respuestaJson: respuestaJson || null,
        respuestaTexto: respuestaTexto || null,
      },
    });

    await db.attempt.update({
      where: { id: attemptId },
      data: { lastActivityAt: new Date() },
    });

    return NextResponse.json({ success: true, answer });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error interno';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
