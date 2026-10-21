/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useState, useEffect, use, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";
import { CheckCircle2, Lock, Monitor, TriangleAlert, Clock } from "lucide-react";
import { gradeToPercentage } from "@/lib/scoring";
import { getCsrfTokenFromCookie } from "@/lib/csrf-client";
import {
  Alert,
  Badge,
  Button,
  Card,
  Input,
  Select,
  Textarea,
} from "@/components/ui";

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

// Respuesta del estudiante pendiente de enviar al servidor.
interface PendingAnswer {
  respuestaJson: string | null;
  respuestaTexto: string | null;
}

interface AttemptData {
  id: string;
  status: string;
  expiresAt?: string | null;
  currentQuestionIndex: number;
  score?: number | null;
  infractions: number;
  sessionTokenHash: string;
  // Orden real en que se presentan las preguntas. Puede estar barajado, por
  // lo que no coincide con el orden natural de quiz.questions.
  questionOrderJson?: string | null;
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
  // Ids de las preguntas en el orden en que se presentan (pueden estar
  // barajados). La navegacion lateral se indexa contra este orden.
  const [questionOrder, setQuestionOrder] = useState<string[]>([]);

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

  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  // Respuestas modificadas que aun no se han confirmado con el servidor,
  // indexadas por questionId. Se conservan al cambiar de pregunta para no
  // perder lo que el debounce todavia no ha enviado.
  const pendingAnswersRef = useRef<Map<string, PendingAnswer>>(new Map());
  const [answeredQuestionIds, setAnsweredQuestionIds] = useState<string[]>([]);
  const [attemptSessionToken, setAttemptSessionToken] = useState<string>("");
  const [infractions, setInfractions] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showInfractionWarning, setShowInfractionWarning] = useState(false);
  const [infractionMessage, setInfractionMessage] = useState("");
  const fullscreenRequested = useRef(false);
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);

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
          'X-CSRF-TOKEN': getCsrfTokenFromCookie(),
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
            'X-CSRF-TOKEN': getCsrfTokenFromCookie(),
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
  }, [attempt, attemptId, attemptSessionToken]);

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

  /**
   * Envia una respuesta al servidor. El token CSRF se lee de la cookie en el
   * momento de la peticion: /api/estudiante/intentos/[id]/respuestas lo exige
   * y sin el header responde 403, dejando la respuesta sin guardar.
   */
  const sendAnswer = useCallback(
    async (questionId: string, respuestaJson: string | null, respuestaTexto: string | null) => {
      const res = await fetch(
        `/api/estudiante/intentos/${attemptId}/respuestas`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-CSRF-TOKEN": getCsrfTokenFromCookie(),
          },
          body: JSON.stringify({
            questionId,
            respuestaJson,
            respuestaTexto,
          }),
        }
      );
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Error al guardar la respuesta");
      }
      return data;
    },
    [attemptId]
  );

  /**
   * Envia todas las respuestas pendientes de forma inmediata. Se llama antes
   * de cambiar de pregunta y antes de enviar el intento, para que ninguna
   * respuesta se pierda por el debounce.
   */
  const flushPendingAnswers = useCallback(async () => {
    if (pendingAnswersRef.current.size === 0) return;

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
    }

    const entries = Array.from(pendingAnswersRef.current.entries());
    let flushedAny = false;
    for (const [questionId, pending] of entries) {
      try {
        await sendAnswer(questionId, pending.respuestaJson, pending.respuestaTexto);
        pendingAnswersRef.current.delete(questionId);
        setAnsweredQuestionIds(prev =>
          prev.includes(questionId) ? prev : [...prev, questionId]
        );
        flushedAny = true;
      } catch {
        // Se mantiene pendiente: no se descarta la respuesta del estudiante.
      }
    }

    // El flush cancela el debounce de triggerSave antes de que este marque
    // "guardado": aqui reflejamos el estado real para no dejar el badge
    // clavado en "Guardando...".
    if (flushedAny) {
      setSavingStatus("guardado");
      setTimeout(() => setSavingStatus(""), 2000);
    }
  }, [sendAnswer]);

  const loadAttemptAndQuestion = useCallback(
    async (targetIndex: number) => {
      setLoading(true);
      try {
        // Antes de cambiar de pregunta se vacian las respuestas pendientes:
        // el debounce de 400 ms se cancelaria y la respuesta anterior se
        // perderia silenciosamente.
        await flushPendingAnswers();

        const resAttempt = await fetch(`/api/estudiante/intentos/${attemptId}`);
        const dataAttempt = await resAttempt.json();
        if (dataAttempt.error) {
          alert(dataAttempt.error);
          router.push("/estudiante");
          return;
        }
        setAttempt(dataAttempt.attempt);
        setInfractions(dataAttempt.attempt.infractions || 0);

        // El orden barajado vive en el intento; si no existe, se usa el
        // orden natural de las preguntas del quiz.
        let order: string[] = [];
        try {
          order = dataAttempt.attempt.questionOrderJson
            ? JSON.parse(dataAttempt.attempt.questionOrderJson)
            : [];
        } catch {}
        if (order.length === 0) {
          order = (dataAttempt.attempt.quiz.questions || []).map(
            (q: { id: string }) => q.id
          );
        }
        setQuestionOrder(order);

        // Las respuestas ya confirmadas por el servidor se usan para marcar
        // la navegacion lateral como "respondida".
        setAnsweredQuestionIds(
          (dataAttempt.attempt.answers || [])
            .filter((a: { respuestaJson?: string | null; respuestaTexto?: string | null }) =>
              a.respuestaJson || a.respuestaTexto
            )
            .map((a: { questionId: string }) => a.questionId)
        );

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
    [attemptId, router, flushPendingAnswers, requestFullscreen]
  );

  const handleAutoSubmitDueToExpiration = useCallback(async () => {
    try {
      const res = await fetch(`/api/estudiante/intentos/${attemptId}/enviar`, {
        method: "POST",
        headers: { "X-CSRF-TOKEN": getCsrfTokenFromCookie() },
      });
      const data = await res.json();
      setResultsData(data);
    } catch {
      router.push("/estudiante");
    }
  }, [attemptId, router]);

  // Cargar la primera pregunta solo al montar o al cambiar de intento.
  // `loadAttemptAndQuestion` cambia de identidad en cada render (depende de
  // `attempt`, que se regenera con cada carga): usarlo aqui como dependencia
  // provocaba un bucle infinito de refetch (heartbeats y GETs sin fin).
  const loadAttemptRef = useRef(loadAttemptAndQuestion);
  useEffect(() => {
    loadAttemptRef.current = loadAttemptAndQuestion;
  }, [loadAttemptAndQuestion]);
  useEffect(() => {
    loadAttemptRef.current(0);
    // Solo al montar / cambiar de intento: ver comentario sobre el ref.
  }, [attemptId]);

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

      // La respuesta se registra como pendiente para que, si el debounce se
      // cancela al cambiar de pregunta, se pueda reintentar antes de salir.
      pendingAnswersRef.current.set(question.id, {
        respuestaJson: newRespuestaJson,
        respuestaTexto: newRespuestaTexto,
      });

      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);

      setSavingStatus("guardando");

      saveTimeoutRef.current = setTimeout(async () => {
        const pending = pendingAnswersRef.current.get(question.id);
        if (!pending) return;
        try {
          await sendAnswer(question.id, pending.respuestaJson, pending.respuestaTexto);
          pendingAnswersRef.current.delete(question.id);
          setAnsweredQuestionIds(prev =>
            prev.includes(question.id) ? prev : [...prev, question.id]
          );
          setSavingStatus("guardado");
          setTimeout(() => setSavingStatus(""), 2000);
        } catch {
          // La respuesta sigue pendiente: se reintentará al cambiar de
          // pregunta o antes de enviar el intento.
          setSavingStatus("error");
        }
      }, 400);
    },
    [question, sendAnswer]
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
      // Se envian primero las respuestas pendientes: /enviar califica con lo
      // que hay en la base de datos, asi que deben estar guardadas antes.
      await flushPendingAnswers();

      const res = await fetch(`/api/estudiante/intentos/${attemptId}/enviar`, {
        method: "POST",
        headers: { "X-CSRF-TOKEN": getCsrfTokenFromCookie() },
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
      <div className="flex-1 py-12 text-center text-muted">
        Cargando evaluación...
      </div>
    );
  }

  if (resultsData || (attempt && attempt.status !== "EN_CURSO")) {
    const data = resultsData || attempt;
    const showScore = data?.quiz?.mostrarResultado === "NOTA" || data?.score !== undefined || data?.quiz?.mostrarResultado === "NOTA_Y_RESPUESTAS";

    return (
      <div className="mx-auto w-full max-w-3xl">
        <Card className="space-y-6 p-8 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-aqua-100 text-aqua-500">
            <CheckCircle2 size={30} strokeWidth={2} aria-hidden />
          </div>
          <h1 className="text-2xl font-bold text-plum">Evaluación Finalizada</h1>
          <p className="text-plum/70">
            Tu intento ha sido registrado y procesado correctamente.
          </p>

          {showScore ? (
            <div className="inline-block rounded-card bg-cream p-6">
              <span className="mb-1 block text-sm text-muted">Calificación Obtenida</span>
              <span className="block text-4xl font-extrabold text-magenta">
                {gradeToPercentage(data?.score ?? attempt?.score ?? 0, data?.quiz?.puntajeMaximo ?? attempt?.quiz?.puntajeMaximo)}
              </span>
              <span className="mt-1 block text-sm text-muted">sobre 100</span>
            </div>
          ) : (
            <p className="text-sm text-muted">
              Las calificaciones se publicarán próximamente.
            </p>
          )}

          <div className="flex justify-center border-t border-line pt-6">
            <Link
              href="/estudiante"
              className="inline-flex items-center justify-center rounded-btn bg-magenta px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-magenta-hover"
            >
              Volver al Panel
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  if (showConfirmSubmit) {
    return (
      <div className="mx-auto w-full max-w-3xl">
        <Card className="space-y-6 p-8">
          <h1 className="text-2xl font-bold text-plum">
            Confirmar Envío de Evaluación
          </h1>
          <p className="text-sm text-plum/70">
            Estás a punto de finalizar tu intento. Una vez enviado, no podrás
            modificar tus respuestas.
          </p>

          <Alert tone="warning">
            Asegúrate de haber respondido todas las preguntas antes de confirmar.
          </Alert>

          <div className="flex justify-end gap-3 border-t border-line pt-4">
            <Button
              variant="secondary"
              onClick={() => setShowConfirmSubmit(false)}
            >
              Volver al Quiz
            </Button>
            <Button
              variant="plum"
              onClick={handleFinalSubmit}
              disabled={submitting}
            >
              {submitting ? "Enviando..." : "Confirmar y Enviar Intento"}
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  if (!question || !attempt) return null;

  // Multichoice admite una o varias respuestas segun el XML de origen
  // (<single>). El servidor resuelve esa informacion y la envia en
  // `respuestaUnica`; si no llegara, se asume respuesta unica (radio).
  const isMultiChoice =
    question.tipo === "MULTICHOICE" && question.respuestaUnica === false;

  const progressPct =
    totalQuestions > 0 ? Math.round(((currentIndex + 1) / totalQuestions) * 100) : 0;

  return (
    <div className="mx-auto w-full max-w-6xl">
      {/* Modal de advertencia de infracción */}
      {showInfractionWarning && (
        <div className="fixed left-1/2 top-4 z-50 mx-4 w-full max-w-md -translate-x-1/2">
          <div className="rounded-card border-2 border-orange-800 bg-orange-800 p-4 text-white shadow-2xl animate-pulse">
            <div className="flex items-start gap-3">
              <TriangleAlert size={22} strokeWidth={2} aria-hidden className="shrink-0" />
              <div className="flex-1">
                <h3 className="mb-1 text-sm font-bold">¡Infracción Detectada!</h3>
                <p className="text-xs">{infractionMessage}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Indicador de modo seguro */}
      {attempt.quiz.modoSeguro && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-card border border-yellow-200 bg-yellow-100 p-3">
          <div className="flex items-center gap-2">
            <Lock size={18} strokeWidth={2} aria-hidden className="text-yellow-600" />
            <div>
              <span className="text-xs font-semibold text-yellow-600">
                Modo Seguro Activo
              </span>
              <p className="text-[10px] text-yellow-600/80">
                No cambies de ventana ni salgas de pantalla completa
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge tone={isFullscreen ? "success" : "danger"} className="gap-1.5">
              <Monitor size={12} strokeWidth={2} aria-hidden />
              {isFullscreen ? "Pantalla completa" : "Sin pantalla completa"}
            </Badge>
            <div className="rounded-chip bg-yellow-200 px-3 py-1">
              <span className="text-xs font-bold text-yellow-600">
                Infracciones: {infractions}/{attempt.quiz.maxInfracciones}
              </span>
            </div>
          </div>
        </div>
      )}

      <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-card border border-line bg-white p-4 shadow-card">
        <div>
          <h1 className="text-lg font-bold text-plum">{attempt.quiz.titulo}</h1>
          <span className="text-xs text-muted">
            Pregunta {currentIndex + 1} de {totalQuestions}
          </span>
        </div>

        <div className="flex items-center gap-3">
          {savingStatus && (
            <Badge
              tone={
                savingStatus === "guardado"
                  ? "success"
                  : savingStatus === "guardando"
                    ? "warning"
                    : "danger"
              }
            >
              {savingStatus === "guardado"
                ? "Guardado"
                : savingStatus === "guardando"
                ? "Guardando..."
                : "Error al guardar"}
            </Badge>
          )}

          {timeLeft !== null && (
            <Badge tone="danger" className="gap-1.5">
              <Clock size={12} strokeWidth={2} aria-hidden />
              Tiempo: {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, "0")}
            </Badge>
          )}
        </div>
      </div>

      {/* Barra de progreso */}
      <div
        className="mb-6 h-2 w-full overflow-hidden rounded-full bg-cream"
        role="progressbar"
        aria-valuenow={progressPct}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className="h-full rounded-full bg-linear-to-r from-magenta to-plum transition-[width] duration-300"
          style={{ width: `${progressPct}%` }}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        <Card className="space-y-6 p-8 lg:col-span-3">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line pb-4">
            <Badge tone="lavender">{question.tipo}</Badge>
            <span className="text-xs font-medium text-muted">
              Valor: {question.defaultGrade} pts
            </span>
          </div>

          <div
            className="moodle-content text-base"
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
                      className={`flex cursor-pointer items-center gap-3 rounded-card border p-3.5 transition-colors ${
                        checked
                          ? "border-magenta bg-magenta/5"
                          : "border-line bg-white hover:border-line-strong hover:bg-cream/50"
                      }`}
                    >
                      <input
                        type={isMultiChoice ? "checkbox" : "radio"}
                        name={`question-${question.id}`}
                        checked={checked}
                        onChange={() => handleOptionChange(opt.id, isMultiChoice)}
                        className="h-4 w-4 shrink-0 accent-magenta"
                      />
                      <span
                        className="text-sm text-plum"
                        dangerouslySetInnerHTML={{ __html: opt.textoHtml }}
                      />
                    </label>
                  );
                })}
              </div>
            )}

            {(question.tipo === "SHORTANSWER" || question.tipo === "NUMERICAL") && (
              <div>
                <Input
                  type={question.tipo === "NUMERICAL" ? "number" : "text"}
                  value={textValue}
                  onChange={(e) => handleTextChange(e.target.value)}
                  placeholder="Escribe tu respuesta aquí..."
                />
              </div>
            )}

            {question.tipo === "ESSAY" && (
              <div>
                <Textarea
                  rows={6}
                  value={textValue}
                  onChange={(e) => handleTextChange(e.target.value)}
                  placeholder="Escribe tu respuesta desarrollada aquí..."
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
                      className="flex flex-col justify-between gap-3 rounded-card border border-line bg-cream p-3 sm:flex-row sm:items-center"
                    >
                      <span
                        className="text-sm font-medium text-plum"
                        dangerouslySetInnerHTML={{ __html: sub.textoHtml }}
                      />
                      <Select
                        value={matchingPairs[sub.id] || ""}
                        onChange={(e) => handleMatchingChange(sub.id, e.target.value)}
                      >
                        <option value="">-- Seleccionar opción --</option>
                        {rightMatches.map((optText, idx) => (
                          <option key={idx} value={optText}>
                            {optText}
                          </option>
                        ))}
                      </Select>
                    </div>
                  );
                })}
              </div>
            )}

            {(question.tipo === "DESCRIPTION" || question.tipo === "UNSUPPORTED") && (
              <div className="rounded-card bg-cream p-4 text-sm italic text-plum/70">
                Pregunta informativa. Haz clic en Siguiente para continuar.
              </div>
            )}
          </div>

          <div className="flex justify-between border-t border-line pt-6">
            <Button
              variant="secondary"
              onClick={() => goToQuestion(currentIndex - 1)}
              disabled={currentIndex === 0 || !attempt.quiz.permitirRetroceso}
            >
              Anterior
            </Button>

            {currentIndex < totalQuestions - 1 ? (
              <Button onClick={() => goToQuestion(currentIndex + 1)}>
                Siguiente
              </Button>
            ) : (
              <Button variant="plum" onClick={() => setShowConfirmSubmit(true)}>
                Revisar y Enviar
              </Button>
            )}
          </div>
        </Card>

        {attempt.quiz.permitirRetroceso && (
          <Card className="h-fit space-y-4 p-6">
            <h3 className="text-sm font-semibold text-plum">Navegación</h3>
            <div className="grid grid-cols-5 gap-2">
              {Array.from({ length: totalQuestions }).map((_, idx) => {
                const isCurrent = idx === currentIndex;
                // El indice corresponde al orden barajado, no a quiz.questions.
                const questionId = questionOrder[idx];
                const hasAnswer = answeredQuestionIds.includes(questionId);

                return (
                  <button
                    key={idx}
                    onClick={() => goToQuestion(idx)}
                    className={`flex h-10 items-center justify-center rounded-chip text-xs font-semibold transition-colors ${
                      isCurrent
                        ? "bg-magenta text-white shadow-pop"
                        : hasAnswer
                        ? "border border-aqua-200 bg-aqua-100 text-aqua-500"
                        : "bg-cream text-plum/60 hover:bg-line"
                    }`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>
            <div className="space-y-1 border-t border-line pt-4 text-[11px] text-muted">
              <div className="flex items-center gap-2">
                <span className="inline-block h-3 w-3 rounded-sm bg-magenta" /> Actual
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-block h-3 w-3 rounded-sm border border-aqua-200 bg-aqua-100" /> Respondida
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-block h-3 w-3 rounded-sm bg-cream" /> Sin responder
              </div>
            </div>
          </Card>
        )}
      </div>

      {showNoBackWarning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-plum/50 p-4">
          <Card className="w-full max-w-md space-y-4 p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-plum">Advertencia</h3>
            <p className="text-sm text-plum/70">
              En este quiz no está permitido retroceder. Una vez que avances, no podrás volver a esta pregunta ni modificarla.
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <Button
                variant="secondary"
                onClick={() => setShowNoBackWarning(false)}
              >
                Cancelar
              </Button>
              <Button onClick={confirmNoBackNavigation}>Continuar</Button>
            </div>
          </Card>
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
    <Suspense fallback={<div className="py-12 text-center text-muted">Cargando evaluación...</div>}>
      <PresentarQuizContent params={params} />
    </Suspense>
  );
}
