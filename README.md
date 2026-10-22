# QuizColegio

Sistema integral de gestion y aplicacion de quizzes escolares con importacion de preguntas desde Moodle XML, modo seguro de examen, control de infracciones y supervisi docente en tiempo real.

## Requisitos

- Node.js 20+ / 24+
- npm

## Instalacion y Configuracion

### 1. Clonar el repositorio
```bash
git clone https://github.com/joanvup/gesquiz.git
cd gesquiz
```

### 2. Instalar dependencias
```bash
npm install
```

### 3. Configurar variables de entorno
El archivo `.env` ya fue creado en la raiz del proyecto con:
```
DATABASE_URL="file:./dev.db"
```

### 4. Generar el cliente Prisma
```bash
npx prisma generate
```

### 5. Ejecutar migraciones de base de datos
```bash
npx prisma migrate dev --name init
```

### 6. Cargar datos de prueba (seed)
```bash
npm run db:seed
```

## Comandos Disponibles

- `npm run dev`: Inicia el servidor de desarrollo Next.js (Turbopack)
- `npm run build`: Genera el build de produccion
- `npm run start`: Inicia el servidor de produccion
- `npm run lint`: Ejecuta el linter (ESLint)
- `npm run test`: Ejecuta las pruebas unitarias con Vitest
- `npm run test:e2e`: Ejecuta las pruebas End-to-End con Playwright
- `npm run db:migrate`: Ejecuta migraciones de base de datos Prisma
- `npm run db:seed`: Carga datos iniciales (docente, estudiantes, grupos, quizzes)

## Credenciales de Prueba (Seed)

| Rol | Email | Contraseña |
|-----|-------|------------|
| Docente | docente@quizcolegio.test | Docente123! |
| Estudiantes (Grupo A) | estudiante1@quizcolegio.test | Estudiante123! |
| | estudiante2@quizcolegio.test | Estudiante123! |
| | estudiante3@quizcolegio.test | Estudiante123! |

## Como Importar Archivos Moodle XML

1. Inicie sesion con una cuenta de rol **Docente**.
2. En el panel docente, seleccione un quiz existente o cree uno nuevo.
3. Acceda a la seccion de **Importar XML**, cargue un archivo compatible con Moodle XML (puede utilizar los ejemplos en samples/) y pulse Importar.

## Nota de Honestidad Tecnica sobre el Modo Seguro

El "modo seguro" basado en eventos del navegador (isibilitychange, blur, deteccion de salida de pantalla completa) es una medida disuasia util para entornos cotidianos, pero **no es infalible**. Un alumno con conocimientos tecnicos avanzados puede eludirlo mediante herramientas de desarrollador, multiples pantallas o scripts externos.

Para examenes formales o de alta exigencia academica, se recomienda encarecidamente el uso de navegadores especializados como **Safe Exam Browser (SEB)** o la supervisi presencial en aula.

## Estructura del Proyecto

```
/gestquiz/gesquiz/
├── .env                     # Variables de entorno (ya creado)
├── package.json
├── prisma/
│   ├── schema.prisma
│   └── prisma7.config.ts
├── src/
│   ├── app/                # Rutas Next.js App Router
│   ├── components/ui/      # Componentes UI mejorados
│   ├── lib/                # Lógica y utilidades
│   └── generated/prisma/   # Cliente Prisma (generado)
├── public/
├── samples/                # Archivos XML de ejemplo
│   ├── completo.xml
│   ├── con-imagenes.xml
│   └── invalido-malicioso.xml
└── prisma/
    └── migrations/
```

## Mejoras Aplicadas en Esta Sesion

- **Rama Git**: Consolidada en `master` (solo una rama)
- **Frontend**: Inputs y botones redimensionados, estilo wayground.com (paleta plum/magenta/cream)
- **Prisma**: Cliente generado, migraciones aplicadas, seed cargado
- **Config**: Archivo `.env` creado en la raiz del proyecto

## Licencia

MIT