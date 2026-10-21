import Link from "next/link";
import { FileUp, GraduationCap, ListChecks, ShieldCheck } from "lucide-react";
import { buttonClass } from "@/components/ui";

const FEATURES = [
  {
    icon: GraduationCap,
    title: "Quizzes para tu aula",
    description:
      "Crea cuestionarios, importa preguntas desde Moodle y asigna cada quiz a los grupos que te corresponden.",
    accent: "bg-peach-100 text-orange-800",
    border: "border-t-peach",
  },
  {
    icon: ShieldCheck,
    title: "Modo seguro integrado",
    description:
      "Seguimiento de infractions, control de fullscreen y deteccion de cambios de pestana durante el intento.",
    accent: "bg-aqua-100 text-aqua-500",
    border: "border-t-aqua-200",
  },
  {
    icon: ListChecks,
    title: "Resultados al instante",
    description:
      "Correccion automatica, calificacion de preguntas abiertas y exportacion de resultados en CSV.",
    accent: "bg-lavender-100 text-lavender-900",
    border: "border-t-lavender-200",
  },
];

export default function Home() {
  return (
    <div className="relative flex-1 overflow-hidden">
      {/* Blobs de fondo difuminados, al estilo Wayground. */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-magenta/25 blur-3xl" />
        <div className="absolute -right-20 top-32 h-80 w-80 rounded-full bg-peach/40 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-64 w-64 rounded-full bg-lavender-200/50 blur-3xl" />
      </div>

      <section className="mx-auto flex max-w-4xl flex-col items-center px-6 py-20 text-center sm:py-28">
        <span className="mb-6 inline-flex items-center gap-2 rounded-chip bg-white/70 px-3 py-1.5 text-xs font-semibold uppercase tracking-widest text-plum/70 shadow-pop">
          <ShieldCheck size={14} strokeWidth={2} aria-hidden />
          Plataforma de evaluacion escolar
        </span>

        <h1 className="text-4xl font-extrabold leading-tight tracking-tight sm:text-6xl">
          <span className="bg-linear-to-r from-peach to-orange bg-clip-text text-transparent">
            QuizColegio
          </span>
        </h1>

        <p className="mt-5 max-w-2xl text-lg text-plum/70">
          Sistema integral de gestión y aplicación de quizzes para instituciones
          educativas. Importa, asigna, aplica y evalúa todo desde un mismo lugar.
        </p>

        <div className="mt-9 flex flex-col items-center gap-3 sm:flex-row">
          <Link href="/login" className={buttonClass({ size: "lg" })}>
            Iniciar Sesión
          </Link>
          <Link
            href="/login"
            className={buttonClass({ variant: "secondary", size: "lg" })}
          >
            <FileUp size={16} strokeWidth={2} aria-hidden />
            Ver credenciales de prueba
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 pb-20">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature) => (
            <article
              key={feature.title}
              className={`rounded-card border border-line border-t-4 ${feature.border} bg-white p-6 shadow-card transition-shadow hover:shadow-card-hover`}
            >
              <div
                className={`mb-4 flex h-11 w-11 items-center justify-center rounded-full ${feature.accent}`}
              >
                <feature.icon size={20} strokeWidth={2} aria-hidden />
              </div>
              <h2 className="mb-2 text-lg font-bold text-plum">{feature.title}</h2>
              <p className="text-sm leading-relaxed text-muted">
                {feature.description}
              </p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
