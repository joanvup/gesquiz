"use client";

import { Suspense } from "react";



import { useState, useEffect, use } from 'react';
import Link from 'next/link';

interface Group {
  id: string;
  name: string;
}

interface Student {
  id: string;
  name: string;
  email: string;
}

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
    return <div className='p-8 text-center text-slate-500'>Cargando asignaciones...</div>;
  }

  return (
    <div className='flex-1 p-8 max-w-3xl mx-auto w-full'>
      <div className='mb-6 flex items-center justify-between'>
        <h1 className='text-2xl font-bold text-slate-800'>Asignar Quiz</h1>
        <Link href='/docente' className='text-sm text-indigo-600 hover:underline'>
          ← Volver al panel
        </Link>
      </div>

      {error && (
        <div className='mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm'>
          {error}
        </div>
      )}

      {message && (
        <div className='mb-6 p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm'>
          {message}
        </div>
      )}

      <form onSubmit={handleSave} className='bg-white p-8 rounded-xl shadow-sm border border-slate-200 space-y-8'>
        <div>
          <h3 className='text-lg font-semibold text-slate-800 mb-4'>Grupos Habilitados</h3>
          {groups.length === 0 ? (
            <p className='text-sm text-slate-500'>No hay grupos creados en el sistema.</p>
          ) : (
            <div className='grid grid-cols-1 md:grid-cols-2 gap-3'>
              {groups.map((g) => (
                <label
                  key={g.id}
                  className={'flex items-center gap-3 p-4 rounded-lg border cursor-pointer transition ' + (selectedGroupIds.includes(g.id) ? 'border-indigo-600 bg-indigo-50/30' : 'border-slate-200 hover:border-slate-300')}
                >
                  <input
                    type='checkbox'
                    checked={selectedGroupIds.includes(g.id)}
                    onChange={() => toggleGroup(g.id)}
                    className='rounded border-slate-300 text-indigo-600'
                  />
                  <span className='text-sm font-medium text-slate-800'>{g.name}</span>
                </label>
              ))}
            </div>
          )}
        </div>

        <div>
          <h3 className='text-lg font-semibold text-slate-800 mb-4'>Estudiantes Específicos (Opcional)</h3>
          {students.length === 0 ? (
            <p className='text-sm text-slate-500'>No hay estudiantes en el sistema.</p>
          ) : (
            <div className='grid grid-cols-1 md:grid-cols-2 gap-3'>
              {students.map((s) => (
                <label
                  key={s.id}
                  className={'flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition ' + (selectedStudentIds.includes(s.id) ? 'border-indigo-600 bg-indigo-50/30' : 'border-slate-200 hover:border-slate-300')}
                >
                  <input
                    type='checkbox'
                    checked={selectedStudentIds.includes(s.id)}
                    onChange={() => toggleStudent(s.id)}
                    className='rounded border-slate-300 text-indigo-600'
                  />
                  <div>
                    <div className='text-sm font-medium text-slate-800'>{s.name}</div>
                    <div className='text-xs text-slate-500'>{s.email}</div>
                  </div>
                </label>
              ))}
            </div>
          )}
        </div>

        <div className='flex justify-end gap-4 pt-4 border-t border-slate-100'>
          <Link
            href='/docente'
            className='px-4 py-2 border border-slate-300 rounded-lg text-sm text-slate-700'
          >
            Volver
          </Link>
          <button
            type='submit'
            disabled={saving}
            className='px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition'
          >
            {saving ? 'Guardando...' : 'Guardar Asignaciones'}
          </button>
        </div>
      </form>
    </div>
  );
}
export default function AsignarQuizPage( { params }: { params: Promise<{ id: string }> } ) {
  return (
      <Suspense fallback={<div className="p-8 text-center text-slate-500">Cargando...</div>}><AsignarQuizPageContent params={params} /></Suspense>
  );
}