import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import { parseGruposExcel } from '@/lib/excel/parser';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    if (!file) {
      return NextResponse.json({ error: 'No se proporcionó ningún archivo' }, { status: 400 });
    }

    if (!file.name.toLowerCase().endsWith('.xlsx')) {
      return NextResponse.json({ error: 'El archivo debe tener extensión .xlsx' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    if (buffer.length > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'El archivo excede el límite de 10MB' }, { status: 400 });
    }

    const parseResult = parseGruposExcel(buffer);
    if (parseResult.registros.length === 0 && parseResult.errores.length > 0) {
      return NextResponse.json({ error: 'Errores de validación en el archivo', errores: parseResult.errores }, { status: 400 });
    }

    let gruposCreados = 0;
    let miembrosVinculados = 0;
    let estudiantesCreados = 0;
    const errores: { fila: number; mensaje: string }[] = [...parseResult.errores];

    const groupMap = new Map<string, string>();

    for (let idx = 0; idx < parseResult.registros.length; idx++) {
      const reg = parseResult.registros[idx];
      const filaNum = idx + 1;

      try {
        let groupId = groupMap.get(reg.grupo);
        if (!groupId) {
          let group = await db.group.findFirst({ where: { name: reg.grupo } });
          if (!group) {
            group = await db.group.create({ data: { name: reg.grupo } });
            gruposCreados++;
          }
          groupId = group.id;
          groupMap.set(reg.grupo, groupId);
        }

        let studentUser = await db.user.findUnique({ where: { email: reg.email } });
        if (!studentUser) {
          if (reg.nombre) {
            const passwordHash = await bcrypt.hash('Estudiante123!', 10);
            studentUser = await db.user.create({
              data: {
                name: reg.nombre,
                email: reg.email,
                passwordHash,
                role: 'STUDENT',
              },
            });
            estudiantesCreados++;
          } else {
            errores.push({ fila: filaNum, mensaje: `Estudiante no registrado con email ${reg.email} y sin nombre para autorregistro` });
            continue;
          }
        }

        await db.groupMember.upsert({
          where: {
            groupId_userId: {
              groupId,
              userId: studentUser.id,
            },
          },
          update: {},
          create: {
            groupId,
            userId: studentUser.id,
          },
        });
        miembrosVinculados++;
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Error al procesar registro de grupo';
        errores.push({ fila: filaNum, mensaje: message });
      }
    }

    const totalProcesados = parseResult.registros.length;

    return NextResponse.json({
      totalProcesados,
      gruposCreados,
      miembrosVinculados,
      estudiantesCreados,
      errores,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error interno';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
