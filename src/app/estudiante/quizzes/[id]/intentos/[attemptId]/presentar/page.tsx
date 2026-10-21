/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useState, useEffect, use, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";
import { gradeToPercentage } from "@/lib/scoring";
import { getCsrfTokenFromCookie } from "@/lib/csrf-client";

interface Option {
  id: string;
  textoHtml: string;
  orden: number;
  extraJson?: string | null;
  esCorrecta?: boolean;
}

interface Question {
  id: string;
  tipo: string;
  enunciadoHtml: string;
  defaultGrade: number;
  datosJson?: string | null;
  respuestaUnica?: boolean;
  options: Option[];
}

interface AnswerData {
  respuestaJson?: string | null;
  respuestaTexto?: string | null;
}

interface AttemptData {
  id: string;
  status: string;
  expiresAt?: string | null;
  currentQuestionIndex: number;
  score?: number | null;
  infractions: number;
  sessionTokenHash: string;
  quiz: {
    id: string;
    titulo: string;
    permitirRetroceso: boolean;
    puntajeMaximo: number;
    mostrarResultado: string;
    tiempoLimiteMinutos?: number | null;
    modoSeguro: boolean;
    maxInfracciones: number;
    questions: { id: string; tipo: string }[];
  };
  answers: {
    questionId: string;
    respuestaJson?: string | null;
    respuestaTexto?: string | null;
  }[];
}

function PresentarQuizContent({
  params,
}: {
  params: Promise<{ id: string; attemptId: string }>;
}) {
  const { attemptId } = use(params);
  const router = useRouter();

  const [attempt, setAttempt] = useState<AttemptData | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [question, setQuestion] = useState<Question | null>(null);
  const [totalQuestions, setTotalQuestions] = useState(0);

  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [textValue, setTextValue] = useState("");
  const [matchingPairs, setMatchingPairs] = useState<Record<string, string>>({});

  const [loading, setLoading] = useState(true);
  const [savingStatus, setSavingStatus] = useState<"guardado" | "guardando" | "error" | "">("");
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [showConfirmSubmit, setShowConfirmSubmit] = useState(false);
  const [showNoBackWarning, setShowNoBackWarning] = useState(false);
  const [targetIndexToNavigate, setTargetIndexToNavigate] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [resultsData, setResultsData] = useState<AttemptData | null>(null);
  const [csrfToken, setCsrfToken] = useState<string>("");

  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [attemptSessionToken, setAttemptSessionToken] = useState<string>("");
  const [infractions, setInfractions] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showInfractionWarning, setShowInfractionWarning] = useState(false);
  const [infractionMessage, setInfractionMessage] = useState("");
  const fullscreenRequested = useRef(false);
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Cargar token CSRF desde document.cookie al montar el componente
    const token = getCsrfTokenFromCookie();
    setCsrfToken(token);
  }, []);

  // Generar/persistir token de sesión para el intento
  useEffect(() => {
    const key = `attempt_token_${attemptId}`;
    const existing = sessionStorage.getItem(key);
    if (existing) {
      setAttemptSessionToken(existing);
      return;
    }
    const token = Array.from(crypto.getRandomValues(new Uint8Array(32)))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    sessionStorage.setItem(key, token);
    setAttemptSessionToken(token);
  }, [attemptId]);

  // Registrar infracción
  const registerInfraction = useCallback(async (tipo: string, detalle: string) => {
    if (!attempt || !attempt.quiz.modoSeguro) return;

    try {
      const res = await fetch(`/api/estudiante/intentos/${attemptId}/infracciones`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-attempt-session': attemptSessionToken,
          'X-CSRF-TOKEN': csrfToken,
        },
        body: JSON.stringify({ tipo, detalle }),
      });

      const data = await res.json();

      if (data.success) {
        setInfractions(data.infractions);

        if (data.autoSubmitted) {
          // Quiz terminado por infracciones
          setInfractionMessage(`Has alcanzado el límite de ${data.maxInfracciones} infracciones. El examen se ha enviado automáticamente.`);
          setShowInfractionWarning(true);

          setTimeout(() => {
            router.push('/estudiante');
          }, 3000);
        } else {
          // Advertencia de infracción
          const remaining = data.maxInfracciones - data.infractions;
          setInfractionMessage(`⚠️ Infracción detectada: ${detalle}. Te quedan ${remaining} advertencia(s) antes de que se envíe automáticamente el examen.`);
          setShowInfractionWarning(true);

          setTimeout(() => {
            setShowInfractionWarning(false);
          }, 5000);
        }
      }
    } catch (error) {
      console.error('Error al registrar infracción:', error);
    }
  }, [attempt, attemptId, attemptSessionToken, router]);

  // Solicitar pantalla completa
  const requestFullscreen = useCallback(async () => {
    if (fullscreenRequested.current) return;

    try {
      const elem = document.documentElement;
      if (elem.requestFullscreen) {
        await elem.requestFullscreen();
        fullscreenRequested.current = true;
        setIsFullscreen(true);
      }
    } catch (err) {
      console.error('Error al activar pantalla completa:', err);
      await registerInfraction('INFRACCION_FULLSCREEN_DENIED', 'Pantalla completa denegada');
    }
  }, [registerInfraction]);

  // Detectar salida de pantalla completa
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isCurrentlyFullscreen = !!document.fullscreenElement;
      setIsFullscreen(isCurrentlyFullscreen);

      if (!isCurrentlyFullscreen && fullscreenRequested.current && attempt?.quiz.modoSeguro && attempt.status === 'EN_CURSO') {
        registerInfraction('INFRACCION_FULLSCREEN_EXIT', 'Salida de pantalla completa detectada');
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, [attempt, registerInfraction]);

  // Detectar cambio de visibilidad (cambio de pestaña)
  useEffect(() => {
    if (!attempt?.quiz.modoSeguro || attempt.status !== 'EN_CURSO') return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        registerInfraction('INFRACCION_VISIBILIDAD', 'Cambio de pestaña o ventana detectado');
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [attempt, registerInfraction]);

  // Detectar blur (pérdida de foco)
  useEffect(() => {
    if (!attempt?.quiz.modoSeguro || attempt.status !== 'EN_CURSO') return;

    const handleBlur = () => {
      registerInfraction('INFRACCION_BLUR', 'Pérdida de foco de la ventana detectada');
    };

    window.addEventListener('blur', handleBlur);

    return () => {
      window.removeEventListener('blur', handleBlur);
    };
  }, [attempt, registerInfraction]);

  // Heartbeat para mantener la sesión activa
  useEffect(() => {
    if (!attempt || attempt.status !== 'EN_CURSO') return;

    // Heartbeat: envío inmediato + intervalo, con header CSRF
    const sendHeartbeat = async () => {
      try {
        await fetch(`/api/estudiante/intentos/${attemptId}/heartbeat`, {
          method: 'POST',
          headers: {
            'x-attempt-session': attemptSessionToken,
            'X-CSRF-TOKEN': csrfToken,
          },
        });
      } catch (error) {
        console.error('Error en heartbeat:', error);
      }
    };

    sendHeartbeat(); // Envío inmediato al iniciar
    heartbeatIntervalRef.current = setInterval(() => {
      sendHeartbeat();
    }, 30000); // Cada 30 segundos

    return () => {
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
      }
    };
  }, [attempt, attemptId, attemptSessionToken, csrfToken]);

  const initializeAnswerState = (q: Question, ans: AnswerData | null) => {
    setSelectedOptions([]);
    setTextValue("");
    setMatchingPairs({});

    if (!ans) return;

    if (q.tipo === "MULTICHOICE" || q.tipo === "TRUEFALSE") {
      try {
        const parsed = ans.respuestaJson ? JSON.parse(ans.respuestaJson) : [];
        if (Array.isArray(parsed)) {
          setSelectedOptions(parsed.map(String));
        } else if (parsed) {
          setSelectedOptions([String(parsed)]);
        }
      } catch {
        if (ans.respuestaJson) setSelectedOptions([ans.respuestaJson]);
      }
    } else if (q.tipo === "SHORTANSWER" || q.tipo === "NUMERICAL" || q.tipo === "ESSAY") {
      setTextValue(ans.respuestaTexto || ans.respuestaJson || "");
    } else if (q.tipo === "MATCHING") {
      try {
        const parsed = ans.respuestaJson ? JSON.parse(ans.respuestaJson) : {};
        if (parsed.pairs) {
          setMatchingPairs(parsed.pairs);
        } else if (typeof parsed === "object" && parsed !== null) {
          setMatchingPairs(parsed as Record<string, string>);
        }
      } catch {}
    }
  };

  const loadAttemptAndQuestion = useCallback(
    async (targetIndex: number) => {
      setLoading(true);
      try {
        const resAttempt = await fetch(`/api/estudiante/intentos/${attemptId}`);
        const dataAttempt = await resAttempt.json();
        if (dataAttempt.error) {
          alert(dataAttempt.error);
          router.push("/estudiante");
          return;
        }
        setAttempt(dataAttempt.attempt);
        setInfractions(dataAttempt.attempt.infractions || 0);

        if (dataAttempt.attempt.status !== "EN_CURSO") {
          setResultsData(dataAttempt.attempt);
          setLoading(false);
          return;
        }

        // Activar pantalla completa si modo seguro está activado
        if (dataAttempt.attempt.quiz.modoSeguro && !document.fullscreenElement) {
          setTimeout(() => {
            requestFullscreen();
          }, 500);
        }

        const resQ = await fetch(
          `/api/estudiante/intentos/${attemptId}/preguntas/${targetIndex}`
        );
        const dataQ = await resQ.json();
        if (dataQ.error) {
          alert(dataQ.error);
          return;
        }

        setQuestion(dataQ.question);
        setTotalQuestions(dataQ.totalQuestions);
        setCurrentIndex(dataQ.index);

        initializeAnswerState(dataQ.question, dataQ.answer);
      } catch {
        alert("Error de red al cargar pregunta");
      } finally {
        setLoading(false);
      }
    },
    [attemptId, router]
  );

  const handleAutoSubmitDueToExpiration = useCallback(async () => {
    try {
      const res = await fetch(`/api/estudiante/intentos/${attemptId}/enviar`, {
        method: "POST",
      });
      const data = await res.json();
      setResultsData(data);
    } catch {
      router.push("/estudiante");
    }
  }, [attemptId, router]);

  useEffect(() => {
    loadAttemptAndQuestion(0);
  }, [loadAttemptAndQuestion]);

  useEffect(() => {
    if (!attempt?.expiresAt) return;
    const expiryTime = new Date(attempt.expiresAt).getTime();

    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.floor((expiryTime - Date.now()) / 1000));
      setTimeLeft(remaining);
      if (remaining === 0) {
        clearInterval(interval);
        handleAutoSubmitDueToExpiration();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [attempt?.expiresAt, handleAutoSubmitDueToExpiration]);

  const triggerSave = useCallback(
    (newRespuestaJson: string | null, newRespuestaTexto: string | null) => {
      if (!question) return;
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);

      setSavingStatus("guardando");

      saveTimeoutRef.current = setTimeout(async () => {
        try {
          const res = await fetch(
            `/api/estudiante/intentos/${attemptId}/respuestas`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                questionId: question.id,
                respuestaJson: newRespuestaJson,
                respuestaTexto: newRespuestaTexto,
              }),
            }
          );
          const data = await res.json();
          if (data.success) {
            setSavingStatus("guardado");
            setTimeout(() => setSavingStatus(""), 2000);
          } else {
            setSavingStatus("error");
          }
        } catch {
          setSavingStatus("error");
        }
      }, 400);
    },
    [attemptId, question]
  );

  function handleOptionChange(optionId: string, isMulti: boolean) {
    let updated: string[];
    if (isMulti) {
      if (selectedOptions.includes(optionId)) {
        updated = selectedOptions.filter((id) => id !== optionId);
      } else {
        updated = [...selectedOptions, optionId];
      }
    } else {
      updated = [optionId];
    }
    setSelectedOptions(updated);
    triggerSave(JSON.stringify(updated), null);
  }

  function handleTextChange(val: string) {
    setTextValue(val);
    triggerSave(null, val);
  }

  function handleMatchingChange(subId: string, rightVal: string) {
    const updated = { ...matchingPairs, [subId]: rightVal };
    setMatchingPairs(updated);
    triggerSave(JSON.stringify({ pairs: updated }), null);
  }

  async function goToQuestion(targetIndex: number) {
    if (!attempt) return;
    if (targetIndex < 0 || targetIndex >= totalQuestions) return;

    if (!attempt.quiz.permitirRetroceso && targetIndex < currentIndex) {
      alert("No está permitido retroceder en este quiz.");
      return;
    }

    if (!attempt.quiz.permitirRetroceso && targetIndex > currentIndex) {
      setShowNoBackWarning(true);
      setTargetIndexToNavigate(targetIndex);
      return;
    }

    await loadAttemptAndQuestion(targetIndex);
  }

  async function confirmNoBackNavigation() {
    setShowNoBackWarning(false);
    if (targetIndexToNavigate !== null) {
      await loadAttemptAndQuestion(targetIndexToNavigate);
      setTargetIndexToNavigate(null);
    }
  }

  async function handleFinalSubmit() {
    if (!confirm("¿Estás seguro de enviar tu intento? No podrás realizar más cambios.")) {
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`/api/estudiante/intentos/${attemptId}/enviar`, {
        method: "POST",
      });
      const data = await res.json();
      if (data.success) {
        setResultsData(data);
      } else {
        alert(data.error || "Error al enviar intento");
      }
    } catch {
      alert("Error de red al enviar");
    } finally {
      setSubmitting(false);
      setShowConfirmSubmit(false);
    }
  }

  if (loading) {
    return (
      <div className="flex-1 p-12 text-center text-slate-500">
        Cargando evaluación...
      </div>
    );
  }

  if (resultsData || (attempt && attempt.status !== "EN_CURSO")) {
    const data = resultsData || attempt;
    const showScore = data?.quiz?.mostrarResultado === "NOTA" || data?.score !== undefined || data?.quiz?.mostrarResultado === "NOTA_Y_RESPUESTAS";

    return (
      <div className="flex-1 p-8 max-w-3xl mx-auto w-full">
        <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200 text-center space-y-6">
          <div className="w-16 h-16 bg-green-100 text-green-700 rounded-full flex items-center justify-center mx-auto text-2xl font-bold">
            ✓
          </div>
          <h1 className="text-2xl font-bold text-slate-800">Evaluación Finalizada</h1>
          <p className="text-slate-600">Tu intento ha sido registrado y procesado correctamente.</p>

          {showScore ? (
            <div className="p-6 bg-slate-50 rounded-xl inline-block">
              <span className="text-sm text-slate-500 block mb-1">Calificación Obtenida</span>
              <span className="text-4xl font-extrabold text-indigo-600">
                {gradeToPercentage(data?.score ?? attempt?.score ?? 0, data?.quiz?.puntajeMaximo ?? attempt?.quiz?.puntajeMaximo)}
              </span>
              <span className="text-sm text-slate-500 block mt-1">sobre 100</span>
            </div>
          ) : (
            <p className="text-sm text-slate-500">Las calificaciones se publicarán próximamente.</p>
          )}

          <div className="pt-6 border-t border-slate-100 flex justify-center">
            <Link
              href="/estudiante"
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg text-sm transition"
            >
              Volver al Panel
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (showConfirmSubmit) {
    return (
      <div className="flex-1 p-8 max-w-3xl mx-auto w-full">
        <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200 space-y-6">
          <h1 className="text-2xl font-bold text-slate-800">Confirmar Envío de Evaluación</h1>
          <p className="text-slate-600 text-sm">
            Estás a punto de finalizar tu intento. Una vez enviado, no podrás modificar tus respuestas.
          </p>

          <div className="p-4 bg-amber-50 border border-amber-200 text-amber-800 rounded-lg text-sm">
            Asegúrate de haber respondido todas las preguntas antes de confirmar.
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              onClick={() => setShowConfirmSubmit(false)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-medium"
            >
              Volver al Quiz
            </button>
            <button
              onClick={handleFinalSubmit}
              disabled={submitting}
              className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium disabled:opacity-50"
            >
              {submitting ? "Enviando..." : "Confirmar y Enviar Intento"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!question || !attempt) return null;

  // Multichoice admite una o varias respuestas segun el XML de origen
  // (<single>). El servidor resuelve esa informacion y la envia en
  // `respuestaUnica`; si no llegara, se asume respuesta unica (radio).
  const isMultiChoice =
    question.tipo === "MULTICHOICE" && question.respuestaUnica === false;

  return (
    <div className="flex-1 p-8 max-w-6xl mx-auto w-full">
      {/* Modal de advertencia de infracción */}
      {showInfractionWarning && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 max-w-md w-full mx-4">
          <div className="bg-red-600 text-white p-4 rounded-xl shadow-2xl border-2 border-red-700 animate-pulse">
            <div className="flex items-start gap-3">
              <span className="text-2xl">⚠️</span>
              <div className="flex-1">
                <h3 className="font-bold text-sm mb-1">¡Infracción Detectada!</h3>
                <p className="text-xs">{infractionMessage}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Indicador de modo seguro */}
      {attempt.quiz.modoSeguro && (
        <div className="mb-4 bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">🔒</span>
            <div>
              <span className="text-xs font-semibold text-amber-900">Modo Seguro Activo</span>
              <p className="text-[10px] text-amber-700">No cambies de ventana ni salgas de pantalla completa</p>
            </div>
          </div>
          <div className="px-3 py-1 bg-amber-100 rounded-lg">
            <span className="text-xs font-bold text-amber-900">
              Infracciones: {infractions}/{attempt.quiz.maxInfracciones}
            </span>
          </div>
        </div>
      )}

      <div className="flex flex-wrap justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-6 gap-4">
        <div>
          <h1 className="font-bold text-slate-800 text-lg">{attempt.quiz.titulo}</h1>
          <span className="text-xs text-slate-500">
            Pregunta {currentIndex + 1} de {totalQuestions}
          </span>
        </div>

        <div className="flex items-center gap-4">
          {savingStatus && (
            <span
              className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                savingStatus === "guardado"
                  ? "bg-green-100 text-green-800"
                  : savingStatus === "guardando"
                  ? "bg-amber-100 text-amber-800"
                  : "bg-red-100 text-red-800"
              }`}
            >
              {savingStatus === "guardado"
                ? "Guardado"
                : savingStatus === "guardando"
                ? "Guardando..."
                : "Error al guardar"}
            </span>
          )}

          {timeLeft !== null && (
            <div className="px-3 py-1 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs font-semibold">
              Tiempo: {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, "0")}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 bg-white p-8 rounded-xl shadow-sm border border-slate-200 space-y-6">
          <div className="flex justify-between items-center border-b border-slate-100 pb-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full">
              {question.tipo}
            </span>
            <span className="text-xs text-slate-500 font-medium">
              Valor: {question.defaultGrade} pts
            </span>
          </div>

          <div
            className="prose text-slate-800 text-base"
            dangerouslySetInnerHTML={{ __html: question.enunciadoHtml }}
          />

          <div className="space-y-3 pt-4">
            {(question.tipo === "MULTICHOICE" || question.tipo === "TRUEFALSE") && (
              <div className="space-y-2">
                {question.options.map((opt) => {
                  const checked = selectedOptions.includes(opt.id);
                  return (
                    <label
                      key={opt.id}
                      className={`flex items-center gap-3 p-3.5 rounded-xl border transition cursor-pointer ${
                        checked
                          ? "border-indigo-600 bg-indigo-50/50"
                          : "border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      <input
                        type={isMultiChoice ? "checkbox" : "radio"}
                        name={`question-${question.id}`}
                        checked={checked}
                        onChange={() => handleOptionChange(opt.id, isMultiChoice)}
                        className="text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                      />
                      <span
                        className="text-sm text-slate-700"
                        dangerouslySetInnerHTML={{ __html: opt.textoHtml }}
                      />
                    </label>
                  );
                })}
              </div>
            )}

            {(question.tipo === "SHORTANSWER" || question.tipo === "NUMERICAL") && (
              <div>
                <input
                  type={question.tipo === "NUMERICAL" ? "number" : "text"}
                  value={textValue}
                  onChange={(e) => handleTextChange(e.target.value)}
                  placeholder="Escribe tu respuesta aquí..."
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm text-slate-800"
                />
              </div>
            )}

            {question.tipo === "ESSAY" && (
              <div>
                <textarea
                  rows={6}
                  value={textValue}
                  onChange={(e) => handleTextChange(e.target.value)}
                  placeholder="Escribe tu respuesta desarrollada aquí..."
                  className="w-full p-4 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm text-slate-800"
                />
              </div>
            )}

            {question.tipo === "MATCHING" && (
              <div className="space-y-4">
                {question.options.map((sub) => {
                  let rightMatches: string[] = [];
                  try {
                    if (sub.extraJson) {
                      const extra = JSON.parse(sub.extraJson);
                      if (extra.choices) rightMatches = extra.choices;
                    }
                  } catch {}

                  if (rightMatches.length === 0) {
                    rightMatches = question.options.map((o) => o.textoHtml);
                  }

                  return (
                    <div
                      key={sub.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200"
                    >
                      <span
                        className="text-sm text-slate-700 font-medium"
                        dangerouslySetInnerHTML={{ __html: sub.textoHtml }}
                      />
                      <select
                        value={matchingPairs[sub.id] || ""}
                        onChange={(e) => handleMatchingChange(sub.id, e.target.value)}
                        className="px-3 py-2 rounded-lg border border-slate-200 text-sm bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="">-- Seleccionar opción --</option>
                        {rightMatches.map((optText, idx) => (
                          <option key={idx} value={optText}>
                            {optText}
                          </option>
                        ))}
                      </select>
                    </div>
                  );
                })}
              </div>
            )}

            {(question.tipo === "DESCRIPTION" || question.tipo === "UNSUPPORTED") && (
              <div className="p-4 bg-slate-50 rounded-xl text-slate-600 text-sm italic">
                Pregunta informativa. Haz clic en Siguiente para continuar.
              </div>
            )}
          </div>

          <div className="flex justify-between pt-6 border-t border-slate-100">
            <button
              onClick={() => goToQuestion(currentIndex - 1)}
              disabled={currentIndex === 0 || !attempt.quiz.permitirRetroceso}
              className="px-5 py-2.5 bg-slate-100 text-slate-700 rounded-xl text-sm font-medium hover:bg-slate-200 transition disabled:opacity-50"
            >
              Anterior
            </button>

            {currentIndex < totalQuestions - 1 ? (
              <button
                onClick={() => goToQuestion(currentIndex + 1)}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium transition"
              >
                Siguiente
              </button>
            ) : (
              <button
                onClick={() => setShowConfirmSubmit(true)}
                className="px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-medium transition"
              >
                Revisar y Enviar
              </button>
            )}
          </div>
        </div>

        {attempt.quiz.permitirRetroceso && (
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 h-fit space-y-4">
            <h3 className="font-semibold text-slate-800 text-sm">Navegación</h3>
            <div className="grid grid-cols-5 gap-2">
              {Array.from({ length: totalQuestions }).map((_, idx) => {
                const isCurrent = idx === currentIndex;
                const hasAnswer = attempt.answers.some(
                  (a) => a.questionId === attempt.quiz.questions?.[idx]?.id && (a.respuestaJson || a.respuestaTexto)
                );

                return (
                  <button
                    key={idx}
                    onClick={() => goToQuestion(idx)}
                    className={`h-10 rounded-lg text-xs font-semibold transition flex items-center justify-center ${
                      isCurrent
                        ? "bg-indigo-600 text-white shadow-sm"
                        : hasAnswer
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>
            <div className="pt-4 border-t border-slate-100 text-[11px] text-slate-500 space-y-1">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded bg-indigo-600 inline-block" /> Actual
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded bg-emerald-50 border border-emerald-200 inline-block" /> Respondida
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded bg-slate-100 inline-block" /> Sin responder
              </div>
            </div>
          </div>
        )}
      </div>

      {showNoBackWarning && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 rounded-2xl max-w-md w-full space-y-4 shadow-xl">
            <h3 className="text-lg font-bold text-slate-800">Advertencia</h3>
            <p className="text-slate-600 text-sm">
              En este quiz no está permitido retroceder. Una vez que avances, no podrás volver a esta pregunta ni modificarla.
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setShowNoBackWarning(false)}
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={confirmNoBackNavigation}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium"
              >
                Continuar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function PresentarQuizPage({
  params,
}: {
  params: Promise<{ id: string; attemptId: string }>;
}) {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-500">Cargando evaluación...</div>}>
      <PresentarQuizContent params={params} />
    </Suspense>
  );
}
