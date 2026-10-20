import Link from "next/link";

export default function Home() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
      <div className="max-w-xl space-y-6">
        <h1 className="text-4xl font-extrabold tracking-tight text-indigo-600 sm:text-5xl">
          QuizColegio
        </h1>
        <p className="text-lg text-slate-600">
          Sistema integral de gestión y aplicación de quizzes para instituciones educativas.
        </p>
        <div className="flex justify-center gap-4 pt-4">
          <Link
            href="/login"
            className="rounded-lg bg-indigo-600 px-6 py-3 text-base font-medium text-white shadow hover:bg-indigo-700 transition"
          >
            Iniciar Sesión
          </Link>
        </div>
      </div>
    </div>
  );
}
