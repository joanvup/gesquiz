import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import { parseEstudiantesExcel } from '@/lib/excel/parser';
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

    const parseResult = parseEstudiantesExcel(buffer);
    if (parseResult.registros.length === 0 && parseResult.errores.length > 0) {
      return NextResponse.json({ error: 'Errores de validación en el archivo', errores: parseResult.errores }, { status: 400 });
    }

    let creados = 0;
    let actualizados = 0;
    const erroresDb: { fila: number; mensaje: string }[] = [];

    for (let idx = 0; idx < parseResult.registros.length; idx++) {
      const reg = parseResult.registros[idx];
      try {
        const existing = await db.user.findUnique({ where: { email: reg.email } });
        const defaultPassword = 'Estudiante123!';
        const passwordToHash = reg.password || defaultPassword;
        const passwordHash = await bcrypt.hash(passwordToHash, 10);

        if (existing) {
          await db.user.update({
            where: { email: reg.email },
            data: {
              name: reg.nombre,
              ...(reg.password ? { passwordHash } : {}),
            },
          });
          actualizados++;
        } else {
          await db.user.create({
            data: {
              name: reg.nombre,
              email: reg.email,
              passwordHash,
              role: 'STUDENT',
            },
          });
          creados++;
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Error al guardar en base de datos';
        erroresDb.push({ fila: idx + 1, mensaje: message });
      }
    }

    const totalProcesados = parseResult.registros.length;

    return NextResponse.json({
      totalProcesados,
      creados,
      actualizados,
      erroresParser: parseResult.errores,
      erroresDb,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error interno';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
