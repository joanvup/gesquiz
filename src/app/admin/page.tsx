import Link from "next/link";
import { GraduationCap, Users } from "lucide-react";
import { Card, PageHeader } from "@/components/ui";

export default function AdminPage() {
  return (
    <div>
      <PageHeader
        title="Panel de Administración"
        subtitle="Gestión administrativa de QuizColegio"
      />

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <Card className="flex flex-col justify-between p-6">
          <div>
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-peach-100 text-orange-800">
              <GraduationCap size={20} strokeWidth={2} aria-hidden />
            </div>
            <h2 className="mb-2 text-xl font-bold text-plum">Importar Estudiantes</h2>
            <p className="mb-4 text-sm text-muted">
              Sube un archivo Excel para dar de alta o actualizar estudiantes de
              forma masiva.
            </p>
          </div>
          <Link
            href="/admin/importar-estudiantes"
            className="inline-flex items-center justify-center rounded-btn bg-magenta px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-magenta-hover"
          >
            Ir a Importar Estudiantes
          </Link>
        </Card>

        <Card className="flex flex-col justify-between p-6">
          <div>
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-aqua-100 text-aqua-500">
              <Users size={20} strokeWidth={2} aria-hidden />
            </div>
            <h2 className="mb-2 text-xl font-bold text-plum">Importar Grupos</h2>
            <p className="mb-4 text-sm text-muted">
              Sube un archivo Excel con grupos y asignación de estudiantes de
              forma masiva.
            </p>
          </div>
          <Link
            href="/admin/importar-grupos"
            className="inline-flex items-center justify-center rounded-btn bg-magenta px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-magenta-hover"
          >
            Ir a Importar Grupos
          </Link>
        </Card>
      </div>
    </div>
  );
}
