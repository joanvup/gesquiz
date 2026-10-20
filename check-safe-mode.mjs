import { db } from './src/lib/db.ts';

async function main() {
  console.log('=== Verificando Quizzes con Modo Seguro ===\n');

  const quizzes = await db.quiz.findMany({
    select: {
      id: true,
      titulo: true,
      modoSeguro: true,
      maxInfracciones: true,
      publicado: true,
    },
  });

  console.log(`Total de quizzes: ${quizzes.length}\n`);

  quizzes.forEach((quiz, idx) => {
    console.log(`${idx + 1}. ${quiz.titulo}`);
    console.log(`   ID: ${quiz.id}`);
    console.log(`   Modo Seguro: ${quiz.modoSeguro ? '✅ ACTIVO' : '❌ INACTIVO'}`);
    console.log(`   Max Infracciones: ${quiz.maxInfracciones}`);
    console.log(`   Publicado: ${quiz.publicado ? 'Sí' : 'No'}`);
    console.log('');
  });

  // Actualizar todos los quizzes para tener modo seguro activado
  if (quizzes.length > 0) {
    for (const quiz of quizzes) {
      await db.quiz.update({
        where: { id: quiz.id },
        data: {
          modoSeguro: true,
          maxInfracciones: 3,
          publicado: true,
        },
      });
    }

    console.log(`✅ Todos los quizzes actualizados con modo seguro activado\n`);
  }

  // Mostrar intentos activos
  const attempts = await db.attempt.findMany({
    where: {
      status: 'EN_CURSO',
    },
    include: {
      quiz: {
        select: {
          titulo: true,
          modoSeguro: true,
          maxInfracciones: true,
        },
      },
      student: {
        select: {
          email: true,
        },
      },
    },
  });

  console.log(`=== Intentos Activos: ${attempts.length} ===\n`);

  attempts.forEach((attempt, idx) => {
    console.log(`${idx + 1}. ${attempt.quiz.titulo}`);
    console.log(`   Estudiante: ${attempt.student.email}`);
    console.log(`   Infracciones: ${attempt.infractions}/${attempt.quiz.maxInfracciones}`);
    console.log(`   Modo Seguro: ${attempt.quiz.modoSeguro ? '✅' : '❌'}`);
    console.log('');
  });

  console.log('\n✅ Proceso completado. Puedes iniciar sesión como estudiante y crear un nuevo intento.\n');
}

main()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  });
