import { db } from '../src/lib/db';

async function main() {
  console.log('=== Habilitando Modo Seguro en Quizzes ===\n');

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

  for (const quiz of quizzes) {
    console.log(`Actualizando: ${quiz.titulo}`);
    console.log(`  - Modo Seguro anterior: ${quiz.modoSeguro}`);
    console.log(`  - Max Infracciones anterior: ${quiz.maxInfracciones}`);

    await db.quiz.update({
      where: { id: quiz.id },
      data: {
        modoSeguro: true,
        maxInfracciones: 3,
        publicado: true,
      },
    });

    console.log(`  ✅ Actualizado con modo seguro activado\n`);
  }

  // Eliminar intentos anteriores para permitir nuevos intentos con modo seguro
  console.log('Eliminando intentos anteriores...');
  await db.attempt.deleteMany({});
  console.log('✅ Intentos eliminados\n');

  console.log('====================================');
  console.log('✅ Proceso completado exitosamente');
  console.log('====================================');
  console.log('\nAhora puedes:');
  console.log('1. Iniciar sesión como estudiante (estudiante1@quizcolegio.test / Estudiante123!)');
  console.log('2. Iniciar un quiz desde el dashboard de estudiante');
  console.log('3. El sistema solicitará pantalla completa automáticamente');
  console.log('4. Si cambias de ventana o sales de pantalla completa, se registrará una infracción');
  console.log('5. Al llegar a 3 infracciones, el quiz se enviará automáticamente\n');
}

main()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(() => {
    process.exit(0);
  });
