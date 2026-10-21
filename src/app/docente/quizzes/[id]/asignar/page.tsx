"use client";

import { Suspense } from "react";
import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { Users } from 'lucide-react';
import { Alert, Badge, Button, Card, PageHeader } from '@/components/ui';

interface Group {
  id: string;
  name: string;
}

interface Student {
  id: string;
  name: string;
  email: string;
}

const CHECKBOX =
  'h-4 w-4 shrink-0 rounded border-line-strong text-magenta accent-magenta focus:ring-2 focus:ring-magenta/40';

function AsignarQuizPageContent({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [groups, setGroups] = useState<Group[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>([]);
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      fetch('/api/docente/grupos').then((res) => res.json()),
      fetch('/api/docente/quizzes/' + id + '/asignar').then((res) => res.json()),
    ])
      .then(([groupData, assignData]) => {
        if (groupData.groups) setGroups(groupData.groups);
        if (groupData.students) setStudents(groupData.students);

        if (assignData.assignments) {
          const gIds: string[] = [];
          const sIds: string[] = [];
          assignData.assignments.forEach((a: { groupId?: string; studentId?: string }) => {
            if (a.groupId) gIds.push(a.groupId);
            if (a.studentId) sIds.push(a.studentId);
          });
          setSelectedGroupIds(gIds);
          setSelectedStudentIds(sIds);
        }
        setLoading(false);
      })
      .catch(() => {
        setError('Error al cargar datos de asignación');
        setLoading(false);
      });
  }, [id]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');
    setMessage('');

    try {
      const res = await fetch('/api/docente/quizzes/' + id + '/asignar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          groupIds: selectedGroupIds,
          studentIds: selectedStudentIds,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setMessage('Asignaciones guardadas correctamente');
      } else {
        setError(data.error || 'Error al guardar asignaciones');
      }
    } catch {
      setError('Error de red');
    } finally {
      setSaving(false);
    }
  }

  function toggleGroup(groupId: string) {
    if (selectedGroupIds.includes(groupId)) {
      setSelectedGroupIds(selectedGroupIds.filter((id) => id !== groupId));
    } else {
      setSelectedGroupIds([...selectedGroupIds, groupId]);
    }
  }

  function toggleStudent(studentId: string) {
    if (selectedStudentIds.includes(studentId)) {
      setSelectedStudentIds(selectedStudentIds.filter((id) => id !== studentId));
    } else {
      setSelectedStudentIds([...selectedStudentIds, studentId]);
    }
  }

  if (loading) {
    return <div className='py-12 text-center text-muted'>Cargando asignaciones...</div>;
  }

  return (
    <div>
      <PageHeader
        title='Asignar Quiz'
        subtitle='Selecciona los grupos y estudiantes que podrán realizar este quiz.'
        breadcrumbs={
          <Link href='/docente' className='text-plum/60 transition-colors hover:text-plum'>
            ← Volver al panel
          </Link>
        }
      />

      {error && (
        <Alert tone='error' className='mb-6'>
          {error}
        </Alert>
      )}

      {message && (
        <Alert tone='success' className='mb-6'>
          {message}
        </Alert>
      )}

      <form onSubmit={handleSave}>
        <Card className='space-y-8 p-8'>
          <div>
            <div className='mb-4 flex flex-wrap items-center gap-2'>
              <h3 className='text-lg font-semibold text-plum'>Grupos Habilitados</h3>
              <Badge tone='lavender'>{selectedGroupIds.length} seleccionados</Badge>
            </div>
            {groups.length === 0 ? (
              <p className='text-sm text-muted'>No hay grupos creados en el sistema.</p>
            ) : (
              <div className='grid grid-cols-1 gap-3 md:grid-cols-2'>
                {groups.map((g) => {
                  const checked = selectedGroupIds.includes(g.id);
                  return (
                    <label
                      key={g.id}
                      className={
                        'flex cursor-pointer items-center gap-3 rounded-card border p-4 transition ' +
                        (checked
                          ? 'border-magenta bg-magenta/5'
                          : 'border-line bg-white hover:border-line-strong')
                      }
                    >
                      <input
                        type='checkbox'
                        checked={checked}
                        onChange={() => toggleGroup(g.id)}
                        className={CHECKBOX}
                      />
                      <span className='text-sm font-medium text-plum'>{g.name}</span>
                    </label>
                  );
                })}
              </div>
            )}
          </div>

          <div>
            <div className='mb-4 flex flex-wrap items-center gap-2'>
              <h3 className='text-lg font-semibold text-plum'>
                Estudiantes Específicos (Opcional)
              </h3>
              <Badge tone='aqua'>{selectedStudentIds.length} seleccionados</Badge>
            </div>
            {students.length === 0 ? (
              <p className='text-sm text-muted'>No hay estudiantes en el sistema.</p>
            ) : (
              <div className='grid grid-cols-1 gap-3 md:grid-cols-2'>
                {students.map((s) => {
                  const checked = selectedStudentIds.includes(s.id);
                  return (
                    <label
                      key={s.id}
                      className={
                        'flex cursor-pointer items-center gap-3 rounded-card border p-3 transition ' +
                        (checked
                          ? 'border-magenta bg-magenta/5'
                          : 'border-line bg-white hover:border-line-strong')
                      }
                    >
                      <input
                        type='checkbox'
                        checked={checked}
                        onChange={() => toggleStudent(s.id)}
                        className={CHECKBOX}
                      />
                      <div>
                        <div className='text-sm font-medium text-plum'>{s.name}</div>
                        <div className='text-xs text-muted'>{s.email}</div>
                      </div>
                    </label>
                  );
                })}
              </div>
            )}
          </div>

          <div className='flex justify-end gap-4 border-t border-line pt-4'>
            <Link
              href='/docente'
              className='inline-flex items-center justify-center rounded-btn border border-line-strong px-4 py-2.5 text-sm font-semibold text-plum transition-colors hover:bg-plum/5'
            >
              Volver
            </Link>
            <Button type='submit' disabled={saving}>
              <Users size={16} strokeWidth={2} aria-hidden />
              {saving ? 'Guardando...' : 'Guardar Asignaciones'}
            </Button>
          </div>
        </Card>
      </form>
    </div>
  );
}

export default function AsignarQuizPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<div className="py-12 text-center text-muted">Cargando...</div>}>
      <AsignarQuizPageContent params={params} />
    </Suspense>
  );
}
