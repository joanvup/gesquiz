import * as XLSX from 'xlsx';

export interface EstudianteRow {
  nombre: string;
  email: string;
  password?: string;
}

export interface GrupoRow {
  grupo: string;
  email: string;
  nombre?: string;
}

export interface ExcelError {
  fila: number;
  mensaje: string;
}

export interface ParseEstudiantesResult {
  registros: EstudianteRow[];
  errores: ExcelError[];
}

export interface ParseGruposResult {
  registros: GrupoRow[];
  errores: ExcelError[];
}

export function parseEstudiantesExcel(buffer: Buffer): ParseEstudiantesResult {
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) {
    return { registros: [], errores: [{ fila: 0, mensaje: 'El archivo Excel está vacío o no tiene hojas' }] };
  }
  const sheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1 });

  const registros: EstudianteRow[] = [];
  const errores: ExcelError[] = [];

  if (rows.length === 0) {
    return { registros: [], errores: [{ fila: 0, mensaje: 'El archivo Excel está vacío' }] };
  }

  let headerIndex = 0;
  let headers: string[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i] as unknown[];
    if (row && row.length > 0 && row.some(cell => cell !== undefined && cell !== null && String(cell).trim() !== '')) {
      headerIndex = i;
      headers = row.map(h => String(h || '').trim().toLowerCase());
      break;
    }
  }

  let nombreIdx = headers.findIndex(h => h.includes('nombre') || h.includes('name'));
  let emailIdx = headers.findIndex(h => h.includes('email') || h.includes('correo') || h.includes('mail'));
  let passwordIdx = headers.findIndex(h => h.includes('password') || h.includes('contraseña') || h.includes('contrasena') || h.includes('clave'));

  if (nombreIdx === -1) nombreIdx = 0;
  if (emailIdx === -1) emailIdx = 1;
  if (passwordIdx === -1) passwordIdx = 2;

  for (let i = headerIndex + 1; i < rows.length; i++) {
    const row = rows[i] as unknown[];
    if (!row || row.length === 0) continue;
    const filaNum = i + 1;

    const rawNombre = row[nombreIdx];
    const rawEmail = row[emailIdx];
    const rawPassword = passwordIdx !== -1 ? row[passwordIdx] : undefined;

    const nombre = rawNombre !== undefined && rawNombre !== null ? String(rawNombre).trim() : '';
    const email = rawEmail !== undefined && rawEmail !== null ? String(rawEmail).trim().toLowerCase() : '';
    const password = rawPassword !== undefined && rawPassword !== null && String(rawPassword).trim() !== '' ? String(rawPassword).trim() : undefined;

    if (!nombre && !email && !password) continue;

    if (!nombre) {
      errores.push({ fila: filaNum, mensaje: 'Falta el nombre del estudiante' });
      continue;
    }
    if (!email || !email.includes('@')) {
      errores.push({ fila: filaNum, mensaje: 'Email inválido o faltante' });
      continue;
    }

    registros.push({
      nombre,
      email,
      ...(password ? { password } : {}),
    });
  }

  return { registros, errores };
}

export function parseGruposExcel(buffer: Buffer): ParseGruposResult {
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) {
    return { registros: [], errores: [{ fila: 0, mensaje: 'El archivo Excel está vacío o no tiene hojas' }] };
  }
  const sheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1 });

  const registros: GrupoRow[] = [];
  const errores: ExcelError[] = [];

  if (rows.length === 0) {
    return { registros: [], errores: [{ fila: 0, mensaje: 'El archivo Excel está vacío' }] };
  }

  let headerIndex = 0;
  let headers: string[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i] as unknown[];
    if (row && row.length > 0 && row.some(cell => cell !== undefined && cell !== null && String(cell).trim() !== '')) {
      headerIndex = i;
      headers = row.map(h => String(h || '').trim().toLowerCase());
      break;
    }
  }

  let grupoIdx = headers.findIndex(h => h.includes('grupo') || h.includes('group'));
  let emailIdx = headers.findIndex(h => h.includes('email') || h.includes('correo') || h.includes('mail'));
  let nombreIdx = headers.findIndex(h => h.includes('nombre') || h.includes('name') || h.includes('estudiante'));

  if (grupoIdx === -1) grupoIdx = 0;
  if (emailIdx === -1) emailIdx = 1;
  if (nombreIdx === -1) nombreIdx = 2;

  for (let i = headerIndex + 1; i < rows.length; i++) {
    const row = rows[i] as unknown[];
    if (!row || row.length === 0) continue;
    const filaNum = i + 1;

    const rawGrupo = row[grupoIdx];
    const rawEmail = row[emailIdx];
    const rawNombre = nombreIdx !== -1 ? row[nombreIdx] : undefined;

    const grupo = rawGrupo !== undefined && rawGrupo !== null ? String(rawGrupo).trim() : '';
    const email = rawEmail !== undefined && rawEmail !== null ? String(rawEmail).trim().toLowerCase() : '';
    const nombre = rawNombre !== undefined && rawNombre !== null && String(rawNombre).trim() !== '' ? String(rawNombre).trim() : undefined;

    if (!grupo && !email && !nombre) continue;

    if (!grupo) {
      errores.push({ fila: filaNum, mensaje: 'Falta el nombre del grupo' });
      continue;
    }
    if (!email || !email.includes('@')) {
      errores.push({ fila: filaNum, mensaje: 'Email inválido o faltante' });
      continue;
    }

    registros.push({
      grupo,
      email,
      ...(nombre ? { nombre } : {}),
    });
  }

  return { registros, errores };
}
