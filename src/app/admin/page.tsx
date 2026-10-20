import Link from "next/link";

export default function AdminPage() {
  return (
    <div className="flex-1 p-8 max-w-4xl mx-auto w-full">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-slate-800">Panel de Administración</h1>
        <p className="text-slate-600 mt-1">Gestión administrativa de QuizColegio</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-800 mb-2">Importar Estudiantes</h2>
            <p className="text-sm text-slate-600 mb-4">
              Sube un archivo Excel para dar de alta o actualizar estudiantes de forma masiva.
            </p>
          </div>
          <Link
            href="/admin/importar-estudiantes"
            className="inline-block text-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition"
          >
            Ir a Importar Estudiantes
          </Link>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-800 mb-2">Importar Grupos</h2>
            <p className="text-sm text-slate-600 mb-4">
              Sube un archivo Excel con grupos y asignación de estudiantes de forma masiva.
            </p>
          </div>
          <Link
            href="/admin/importar-grupos"
            className="inline-block text-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition"
          >
            Ir a Importar Grupos
          </Link>
        </div>
      </div>
    </div>
  );
}
