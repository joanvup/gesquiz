"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Alert, Button, Card, Field, Input } from "@/components/ui";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Error al iniciar sesión");
      }

      if (data.user.role === "ADMIN") {
        router.push("/admin");
      } else if (data.user.role === "TEACHER") {
        router.push("/docente");
      } else {
        router.push("/estudiante");
      }
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-1 items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <span
            aria-hidden
            className="mx-auto mb-3 block h-10 w-10 rounded-btn bg-linear-to-r from-plum-deep to-plum"
          />
          <h1 className="text-2xl font-bold text-plum">
            Iniciar Sesión en QuizColegio
          </h1>
          <p className="mt-1 text-sm text-muted">
            Accede con tu cuenta de la institución.
          </p>
        </div>

        <Card className="p-8">
          {error && (
            <Alert tone="error" className="mb-5">
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Field label="Correo Electrónico">
              <Input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="docente@quizcolegio.test"
              />
            </Field>

            <Field label="Contraseña">
              <Input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </Field>

            <Button type="submit" disabled={loading} fullWidth size="lg">
              {loading ? "Verificando..." : "Entrar"}
            </Button>
          </form>

          <Alert tone="info" title="Credenciales de prueba" className="mt-6">
            <p>Docente: docente@quizcolegio.test / Docente123!</p>
            <p>Estudiante: estudiante1@quizcolegio.test / Estudiante123!</p>
          </Alert>
        </Card>
      </div>
    </div>
  );
}
