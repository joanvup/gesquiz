import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import { shuffleArray } from '@/lib/quiz-random';
import crypto from 'crypto';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser();
    if (!user || (user.role !== 'STUDENT' && user.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const { id: quizId } = await params;
    const quiz = await db.quiz.findUnique({
      where: { id: quizId },
      include: {
        questions: {
          include: { options: true },
          orderBy: { orden: 'asc' },
        },
        assignments: {
          include: { group: { include: { members: true } } },
        },
      },
    });

    if (!quiz || !quiz.publicado) {
      return NextResponse.json({ error: 'Quiz no encontrado o no disponible' }, { status: 404 });
    }

    const now = new Date();
    if (quiz.ventanaAbre && now < new Date(quiz.ventanaAbre)) {
      return NextResponse.json({ error: 'El quiz aún no está abierto' }, { status: 403 });
    }
    if (quiz.ventanaCierra && now > new Date(quiz.ventanaCierra)) {
      return NextResponse.json({ error: 'El quiz ya ha cerrado' }, { status: 403 });
    }

    const isAssignedDirectly = quiz.assignments.some(a => a.studentId === user.id);
    const isAssignedGroup = quiz.assignments.some(a => a.group?.members.some(m => m.userId === user.id));
    if (!isAssignedDirectly && !isAssignedGroup && user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Quiz no asignado al estudiante' }, { status: 403 });
    }

    const existingAttempts = await db.attempt.findMany({
      where: { quizId, studentId: user.id },
      orderBy: { numeroAttempt: 'desc' },
    });

    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '127.0.0.1';
    const userAgent = request.headers.get('user-agent') || '';

    // Usar transacción para validar límite de intentos y crear el intento de forma atómica,
    // evitando race conditions donde POSTs concurrentes podrían ambos pasar el filtro de límite.
    const result = await db.$transaction(async tx => {
      // Re-contar intentos activos dentro de la transacción (isolation previene carreras)
      const activeAttempts = await tx.attempt.findMany({
        where: { quizId, studentId: user.id, status: 'EN_CURSO' },
      });

      if (activeAttempts.length > 0) {
        // Si ya hay un intento en curso, verificar si expiró
        const now = new Date();
        const active = activeAttempts.find(a => {
          if (a.expiresAt && new Date(a.expiresAt) < now) return true;
          return false;
        });
        if (active) {
          // Marcar como expirado dentro de la transacción
          await tx.attempt.update({
            where: { id: active.id },
            data: { status: 'EXPIRADO' },
          });
        }
      }

      // Contar todos los intentos no anulados dentro de la transacción
      const allAttempts = await tx.attempt.findMany({
        where: { quizId, studentId: user.id, status: { notIn: ['ANULADO'] } },
      });

      const validAttemptsCount = allAttempts.length;

      if (validAttemptsCount >= quiz.intentosPermitidos && user.role !== 'ADMIN') {
        throw new Error('Número máximo de intentos alcanzados');
      }

      // Generar seed y token de sesión
      const seed = crypto.randomBytes(16).toString('hex');
      const sessionToken = crypto.randomBytes(32).toString('hex');
      const sessionTokenHash = crypto.createHash('sha256').update(sessionToken).digest('hex');

      let questionIds = quiz.questions.map(q => q.id);
      if (quiz.ordenAleatorioPreguntas) {
        questionIds = shuffleArray(questionIds, seed);
      }

      const optionOrders: Record<string, string[]> = {};
      for (const q of quiz.questions) {
        let optIds = q.options.map(o => o.id);
        if (quiz.ordenAleatorioOpciones) {
          optIds = shuffleArray(optIds, seed + q.id);
        }
        optionOrders[q.id] = optIds;
      }

      const expiresAt = quiz.tiempoLimiteMinutos
        ? new Date(Date.now() + quiz.tiempoLimiteMinutos * 60 * 1000)
        : null;

      const newAttempt = await tx.attempt.create({
        data: {
          quizId,
          studentId: user.id,
          numeroAttempt: validAttemptsCount + 1,
          status: 'EN_CURSO',
          seed,
          sessionTokenHash,
          expiresAt,
          questionOrderJson: JSON.stringify(questionIds),
          optionOrderJson: JSON.stringify(optionOrders),
          currentQuestionIndex: 0,
        },
      });

      return { newAttempt, sessionToken, validAttemptsCount };
    });

    const { newAttempt, sessionToken, validAttemptsCount } = result;

    await db.auditEvent.create({
      data: {
        attemptId: newAttempt.id,
        userId: user.id,
        tipo: 'INICIO_INTENTO',
        detalle: `Inicio de intento #${newAttempt.numeroAttempt} para quiz ${quizId}`,
        ip,
        userAgent,
      },
    });

    return NextResponse.json({ success: true, attempt: newAttempt, sessionToken, resumed: false });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error interno';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
