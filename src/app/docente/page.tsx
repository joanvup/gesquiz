'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  BarChart3,
  Eye,
  FileUp,
  Pencil,
  Plus,
  Send,
  Trash2,
} from 'lucide-react';
import { Alert, Badge, Button, Card, EmptyState, PageHeader } from '@/components/ui';

interface QuizItem {
  id: string;
  titulo: string;
  descripcion?: string;
  publicado: boolean;
  puntajeMaximo: number;
  _count: {
    questions: number;
    assignments: number;
    attempts: number;
  };
}

export default function DocenteDashboard() {
  const [quizzes, setQuizzes] = useState<QuizItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/docente/quizzes')
      .then((res) => res.json())
      .then((data) => {
        if (data.quizzes) {
          setQuizzes(data.quizzes);
        } else if (data.error) {
          setError(data.error);
        }
        setLoading(false);
      })
      .catch(() => {
        setError('Error al cargar quizzes');
        setLoading(false);
      });
  }, []);

  async function handleDelete(id: string) {
    if (!confirm('¿Está seguro de eliminar este quiz y todas sus preguntas?')) return;
    try {
      const res = await fetch('/api/docente/quizzes/' + id, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setQuizzes(quizzes.filter((q) => q.id !== id));
      } else {
        alert(data.error || 'Error al eliminar');
      }
    } catch {
      alert('Error de red');
    }
  }

  return (
    <div>
      <PageHeader
        title="Panel del Docente"
        subtitle="Gestión de Quizzes, Importación Moodle y Asignaciones"
        actions={
          <Link
            href='/docente/quizzes/nuevo'
            className="inline-flex items-center justify-center gap-2 rounded-btn bg-magenta px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-magenta-hover"
          >
            <Plus size={16} strokeWidth={2} aria-hidden />
            Crear Nuevo Quiz
          </Link>
        }
      />

      {error && (
        <Alert tone="error" className="mb-6">
          {error}
        </Alert>
      )}

      {loading ? (
        <div className="py-12 text-center text-muted">Cargando quizzes...</div>
      ) : quizzes.length === 0 ? (
        <Card>
          <EmptyState
            icon={FileUp}
            title="No hay quizzes creados"
            description="Comienza creando tu primer cuestionario."
            action={
              <Link
                href='/docente/quizzes/nuevo'
                className="inline-flex items-center justify-center gap-2 rounded-btn bg-magenta px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-magenta-hover"
              >
                <Plus size={16} strokeWidth={2} aria-hidden />
                Crear Quiz
              </Link>
            }
          />
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {quizzes.map((q) => (
            <Card key={q.id} interactive className="flex flex-col justify-between p-6">
              <div>
                <div className="mb-3 flex items-start justify-between gap-3">
                  <h3 className="text-lg font-semibold text-plum">{q.titulo}</h3>
                  <Badge tone={q.publicado ? 'success' : 'warning'}>
                    {q.publicado ? 'Publicado' : 'Borrador'}
                  </Badge>
                </div>
                <p className="mb-4 line-clamp-2 text-sm text-muted">
                  {q.descripcion || 'Sin descripción'}
                </p>

                <dl className="mb-6 space-y-1.5 rounded-chip bg-cream p-4 text-xs text-plum/70">
                  <div className="flex justify-between">
                    <dt>Preguntas:</dt>
                    <dd className="font-semibold text-plum">{q._count.questions}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt>Puntaje Máximo:</dt>
                    <dd className="font-semibold text-plum">{q.puntajeMaximo}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt>Asignaciones:</dt>
                    <dd className="font-semibold text-plum">{q._count.assignments}</dd>
                  </div>
                </dl>
              </div>

              <div className="flex flex-wrap items-center gap-2 border-t border-line pt-4">
                <Link
                  href={'/docente/quizzes/' + q.id + '/editar'}
                  className="inline-flex items-center gap-1.5 rounded-btn border border-line-strong px-3 py-1.5 text-xs font-semibold text-plum transition-colors hover:bg-plum/5"
                >
                  <Pencil size={14} strokeWidth={2} aria-hidden />
                  Configurar
                </Link>
                <Link
                  href={'/docente/quizzes/' + q.id + '/importar'}
                  className="inline-flex items-center gap-1.5 rounded-btn border border-line-strong px-3 py-1.5 text-xs font-semibold text-plum transition-colors hover:bg-plum/5"
                >
                  <FileUp size={14} strokeWidth={2} aria-hidden />
                  Importar XML
                </Link>
                <Link
                  href={'/docente/quizzes/' + q.id + '/asignar'}
                  className="inline-flex items-center gap-1.5 rounded-btn border border-line-strong px-3 py-1.5 text-xs font-semibold text-plum transition-colors hover:bg-plum/5"
                >
                  <Send size={14} strokeWidth={2} aria-hidden />
                  Asignar
                </Link>
                <Link
                  href={'/docente/quizzes/' + q.id + '/preview'}
                  className="inline-flex items-center gap-1.5 rounded-btn border border-line-strong px-3 py-1.5 text-xs font-semibold text-plum transition-colors hover:bg-plum/5"
                >
                  <Eye size={14} strokeWidth={2} aria-hidden />
                  Vista previa
                </Link>
                <Link
                  href={'/docente/quizzes/' + q.id + '/resultados'}
                  className="inline-flex items-center gap-1.5 rounded-btn border border-line-strong px-3 py-1.5 text-xs font-semibold text-plum transition-colors hover:bg-plum/5"
                >
                  <BarChart3 size={14} strokeWidth={2} aria-hidden />
                  Resultados
                </Link>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(q.id)}
                  className="ml-auto text-orange-800 hover:bg-peach-100"
                >
                  <Trash2 size={14} strokeWidth={2} aria-hidden />
                  Eliminar
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
