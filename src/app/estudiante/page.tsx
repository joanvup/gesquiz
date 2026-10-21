import { getSessionUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { gradeToPercentage } from "@/lib/scoring";
import { Suspense } from "react";
import Link from "next/link";
import { unstable_noStore } from "next/cache";
import { BookOpen, CalendarClock, Hash, Timer } from "lucide-react";
import { StartQuizButton } from "./StartQuizButton";
import { Badge, Card, EmptyState, PageHeader } from "@/components/ui";

/**
 * Quizzes asignados al estudiante, con la ventana de tiempo ya resuelta.
 *
 * La ventana se evalua aqui (y no en el render) porque el API vuelve a
 * comprobarla al crear el intento: en el panel solo sirve para no ofrecer un
 * boton de "Iniciar Quiz" que va a fallar.
 */
async function loadStudentQuizzes(studentId: string) {
  const memberships = await db.groupMember.findMany({
    where: { userId: studentId },
    select: { groupId: true },
  });
  const groupIds = memberships.map(m => m.groupId);

  const assignments = await db.quizAssignment.findMany({
    where: {
      OR: [
        { studentId },
        { groupId: { in: groupIds } },
      ],
    },
    select: { quizId: true },
  });
  const quizIds = Array.from(new Set(assignments.map(a => a.quizId)));

  const quizzes = await db.quiz.findMany({
    where: {
      id: { in: quizIds },
      publicado: true,
    },
    include: {
      attempts: {
        where: { studentId },
        orderBy: { numeroAttempt: 'desc' },
      },
      _count: {
        select: { questions: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  const now = Date.now();

  return quizzes.map(quiz => ({
    ...quiz,
    windowOpen:
      (!quiz.ventanaAbre || new Date(quiz.ventanaAbre).getTime() <= now) &&
      (!quiz.ventanaCierra || new Date(quiz.ventanaCierra).getTime() >= now),
  }));
}

async function EstudianteContent() {
  unstable_noStore();
  const user = await getSessionUser();
  if (!user || user.role !== "STUDENT") {
    redirect("/login");
  }

  const quizzes = await loadStudentQuizzes(user.id);

  return (
    <div>
      <PageHeader
        title="Panel del Estudiante"
        subtitle={`Estudiante: ${user.name} (${user.email})`}
      />

      <h2 className="mb-4 text-xl font-bold text-plum">Tus Quizzes Asignados</h2>

      {quizzes.length === 0 ? (
        <Card>
          <EmptyState
            icon={BookOpen}
            title="No hay quizzes asignados"
            description="Cuando tus docentes te asignen cuestionarios, aparecerán aquí."
          />
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {quizzes.map(quiz => {
            const activeAttempt = quiz.attempts.find(a => a.status === 'EN_CURSO');
            const validAttempts = quiz.attempts.filter(a => a.status !== 'ANULADO');
            const attemptsCount = validAttempts.length;
            const canAttempt = attemptsCount < quiz.intentosPermitidos;

            // La ventana de tiempo ya viene resuelta desde el servidor.
            const windowOpen = quiz.windowOpen;

            const latestAttempt = quiz.attempts[0];

            return (
              <Card key={quiz.id} interactive className="flex flex-col justify-between p-6">
                <div>
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <h3 className="text-lg font-semibold text-plum">{quiz.titulo}</h3>
                    <Badge tone="lavender">
                      <Hash size={12} strokeWidth={2} aria-hidden />
                      {quiz._count.questions} preguntas
                    </Badge>
                  </div>
                  <p className="mb-4 line-clamp-2 text-sm text-muted">
                    {quiz.descripcion || 'Sin descripción'}
                  </p>

                  <dl className="mb-6 space-y-1.5 rounded-chip bg-cream p-4 text-xs text-plum/70">
                    <div className="flex justify-between">
                      <dt className="inline-flex items-center gap-1.5">
                        <Timer size={13} strokeWidth={2} aria-hidden />
                        Tiempo límite:
                      </dt>
                      <dd className="font-medium text-plum">
                        {quiz.tiempoLimiteMinutos ? `${quiz.tiempoLimiteMinutos} min` : 'Sin límite'}
                      </dd>
                    </div>
                    <div className="flex justify-between">
                      <dt>Intentos realizados:</dt>
                      <dd className="font-medium text-plum">
                        {attemptsCount} de {quiz.intentosPermitidos}
                      </dd>
                    </div>
                    {quiz.ventanaAbre && (
                      <div className="flex justify-between">
                        <dt className="inline-flex items-center gap-1.5">
                          <CalendarClock size={13} strokeWidth={2} aria-hidden />
                          Abre:
                        </dt>
                        <dd className="font-medium text-plum">
                          {new Date(quiz.ventanaAbre).toLocaleString()}
                        </dd>
                      </div>
                    )}
                    {quiz.ventanaCierra && (
                      <div className="flex justify-between">
                        <dt className="inline-flex items-center gap-1.5">
                          <CalendarClock size={13} strokeWidth={2} aria-hidden />
                          Cierra:
                        </dt>
                        <dd className="font-medium text-plum">
                          {new Date(quiz.ventanaCierra).toLocaleString()}
                        </dd>
                      </div>
                    )}
                    {latestAttempt && (
                      <div className="flex justify-between border-t border-line pt-2">
                        <dt>Último estado:</dt>
                        <dd
                          className={`font-semibold ${latestAttempt.status === 'CALIFICADO' ? 'text-aqua-500' : latestAttempt.status === 'EN_CURSO' ? 'text-yellow-600' : 'text-plum'}`}
                        >
                          {latestAttempt.status} {latestAttempt.score !== null ? `(${gradeToPercentage(latestAttempt.score, quiz.puntajeMaximo)}/100)` : ''}
                        </dd>
                      </div>
                    )}
                  </dl>
                </div>

                <div className="flex items-center justify-between border-t border-line pt-4">
                  {activeAttempt ? (
                    <Link
                      href={`/estudiante/quizzes/${quiz.id}/intentos/${activeAttempt.id}/presentar`}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-btn bg-magenta px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-magenta-hover"
                    >
                      Continuar Intento en Curso
                    </Link>
                  ) : canAttempt && windowOpen ? (
                    <StartQuizButton quizId={quiz.id} />
                  ) : latestAttempt && (latestAttempt.status === 'CALIFICADO' || latestAttempt.status === 'ENVIADO') ? (
                    <Link
                      href={`/estudiante/quizzes/${quiz.id}/intentos/${latestAttempt.id}/presentar`}
                      className="inline-flex w-full items-center justify-center rounded-btn border border-line-strong px-4 py-2.5 text-sm font-semibold text-plum transition-colors hover:bg-plum/5"
                    >
                      Ver Resultados
                    </Link>
                  ) : (
                    <button
                      disabled
                      className="w-full cursor-not-allowed rounded-btn bg-cream px-4 py-2.5 text-sm font-semibold text-plum/40"
                    >
                      {!windowOpen ? 'Fuera de ventana de tiempo' : 'Intentos agotados'}
                    </button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function EstudianteDashboard() {
  return (
    <Suspense fallback={<div className="py-12 text-center text-muted">Cargando quizzes...</div>}>
      <EstudianteContent />
    </Suspense>
  );
}
