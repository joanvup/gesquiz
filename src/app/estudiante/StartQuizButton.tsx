"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Play } from "lucide-react";
import { getCsrfTokenFromCookie } from "@/lib/csrf-client";

export function StartQuizButton({ quizId }: { quizId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleStart() {
    setLoading(true);
    try {
      const res = await fetch(`/api/estudiante/quizzes/${quizId}/intentos`, {
        method: "POST",
        headers: {
          'X-CSRF-TOKEN': getCsrfTokenFromCookie(),
        },
      });
      const data = await res.json();
      if (data.success && data.attempt) {
        if (data.sessionToken) {
          sessionStorage.setItem(`attempt_token_${data.attempt.id}`, data.sessionToken);
        }
        router.push(`/estudiante/quizzes/${quizId}/intentos/${data.attempt.id}/presentar`);
      } else {
        alert(data.error || "Error al iniciar intento");
        setLoading(false);
      }
    } catch {
      alert("Error de red");
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleStart}
      disabled={loading}
      className="inline-flex w-full items-center justify-center gap-2 rounded-btn bg-magenta px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-magenta-hover disabled:opacity-50"
    >
      <Play size={15} strokeWidth={2} aria-hidden />
      {loading ? "Iniciando..." : "Iniciar Quiz"}
    </button>
  );
}
