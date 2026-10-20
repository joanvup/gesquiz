const { PrismaClient } = require('./src/generated/prisma');
const { databaseUrl } = require('./prisma7.config');
const Database = require('better-sqlite3');
const { BetterSQLite3Adapter } = require('@prisma/adapter-better-sqlite3');

const db = new Database(databaseUrl);
const adapter = new BetterSQLite3Adapter(db);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('=== Verificando Quizzes con Modo Seguro ===\n');

  const quizzes = await prisma.quiz.findMany({
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

  // Actualizar el primer quiz para tener modo seguro activado
  if (quizzes.length > 0) {
    const firstQuiz = quizzes[0];

    await prisma.quiz.update({
      where: { id: firstQuiz.id },
      data: {
        modoSeguro: true,
        maxInfracciones: 3,
        publicado: true,
      },
    });

    console.log(`✅ Quiz "${firstQuiz.titulo}" actualizado con modo seguro activado\n`);
  }

  // Mostrar intentos activos
  const attempts = await prisma.attempt.findMany({
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
}

main()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
