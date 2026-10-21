"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
      className="w-full text-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg text-sm transition disabled:opacity-50"
    >
      {loading ? "Iniciando..." : "Iniciar Quiz"}
    </button>
  );
}
