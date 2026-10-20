import { getSessionUser, destroySession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getCsrfToken, setCsrfToken } from "@/lib/csrf";
import { db } from "@/lib/db";
import { gradeToPercentage } from "@/lib/scoring";
import { Suspense } from "react";
import Link from "next/link";
import { unstable_noStore } from "next/cache";
import { StartQuizButton } from "./StartQuizButton";

async function EstudianteContent() {
  unstable_noStore();
  const user = await getSessionUser();
  if (!user || user.role !== "STUDENT") {
    redirect("/login");
  }

  const csrfToken = await getCsrfToken();

  async function logoutAction() {
    "use server";
    await destroySession();
    redirect("/login");
  }

  const memberships = await db.groupMember.findMany({
    where: { userId: user.id },
    select: { groupId: true },
  });
  const groupIds = memberships.map(m => m.groupId);

  const assignments = await db.quizAssignment.findMany({
    where: {
      OR: [
        { studentId: user.id },
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
        where: { studentId: user.id },
        orderBy: { numeroAttempt: 'desc' },
      },
      _count: {
        select: { questions: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });


  return (
    <div className="flex-1 p-8 max-w-5xl mx-auto w-full">
      <div className="flex justify-between items-center bg-white p-6 rounded-xl shadow-sm border border-slate-200 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Panel del Estudiante</h1>
          <p className="text-slate-600">Estudiante: {user.name} ({user.email})</p>
        </div>
        <form action={logoutAction}>
          <input type="hidden" name="csrfToken" value={csrfToken} />
          <button
            type="submit"
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg transition text-sm"
          >
            Cerrar Sesión
          </button>
        </form>
      </div>

      <div className="mb-6">
        <h2 className="text-xl font-bold text-slate-800 mb-4">Tus Quizzes Asignados</h2>
      </div>

      {quizzes.length === 0 ? (
        <div className="bg-white p-12 rounded-xl shadow-sm border border-slate-200 text-center">
          <h3 className="text-lg font-semibold text-slate-700 mb-2">No hay quizzes asignados</h3>
          <p className="text-slate-500 text-sm">Cuando tus docentes te asignen cuestionarios, aparecerán aquí.</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {quizzes.map(quiz => {
            const activeAttempt = quiz.attempts.find(a => a.status === 'EN_CURSO');
            const validAttempts = quiz.attempts.filter(a => a.status !== 'ANULADO');
            const attemptsCount = validAttempts.length;
            const canAttempt = attemptsCount < quiz.intentosPermitidos;

            let windowOpen = true;

            const latestAttempt = quiz.attempts[0];

            return (
              <div key={quiz.id} className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="font-semibold text-slate-800 text-lg">{quiz.titulo}</h3>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700">
                      {quiz._count.questions} preguntas
                    </span>
                  </div>
                  <p className="text-slate-600 text-sm mb-4 line-clamp-2">{quiz.descripcion || 'Sin descripción'}</p>

                  <div className="space-y-1.5 text-xs text-slate-600 mb-6 bg-slate-50 p-4 rounded-lg">
                    <div className="flex justify-between">
                      <span>Tiempo límite:</span>
                      <span className="font-medium">{quiz.tiempoLimiteMinutos ? `${quiz.tiempoLimiteMinutos} min` : 'Sin límite'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Intentos realizados:</span>
                      <span className="font-medium">{attemptsCount} de {quiz.intentosPermitidos}</span>
                    </div>
                    {quiz.ventanaAbre && (
                      <div className="flex justify-between">
                        <span>Abre:</span>
                        <span className="font-medium">{new Date(quiz.ventanaAbre).toLocaleString()}</span>
                      </div>
                    )}
                    {quiz.ventanaCierra && (
                      <div className="flex justify-between">
                        <span>Cierra:</span>
                        <span className="font-medium">{new Date(quiz.ventanaCierra).toLocaleString()}</span>
                      </div>
                    )}
                    {latestAttempt && (
                      <div className="flex justify-between pt-2 border-t border-slate-200">
                        <span>Último estado:</span>
                        <span className={`font-semibold ${latestAttempt.status === 'CALIFICADO' ? 'text-green-600' : latestAttempt.status === 'EN_CURSO' ? 'text-amber-600' : 'text-slate-700'}`}>
                          {latestAttempt.status} {latestAttempt.score !== null ? `(${gradeToPercentage(latestAttempt.score, quiz.puntajeMaximo)}/100)` : ''}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                  {activeAttempt ? (
                    <Link
                      href={`/estudiante/quizzes/${quiz.id}/intentos/${activeAttempt.id}/presentar`}
                      className="w-full text-center px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-medium rounded-lg text-sm transition"
                    >
                      Continuar Intento en Curso
                    </Link>
                  ) : canAttempt && windowOpen ? (
                    <StartQuizButton quizId={quiz.id} />
                  ) : latestAttempt && (latestAttempt.status === 'CALIFICADO' || latestAttempt.status === 'ENVIADO') ? (
                    <Link
                      href={`/estudiante/quizzes/${quiz.id}/intentos/${latestAttempt.id}/presentar`}
                      className="w-full text-center px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg text-sm transition"
                    >
                      Ver Resultados
                    </Link>
                  ) : (
                    <button
                      disabled
                      className="w-full px-4 py-2 bg-slate-100 text-slate-400 font-medium rounded-lg text-sm cursor-not-allowed"
                    >
                      {!windowOpen ? 'Fuera de ventana de tiempo' : 'Intentos agotados'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function EstudianteDashboard() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-500">Cargando quizzes...</div>}>
      <EstudianteContent />
    </Suspense>
  );
}
