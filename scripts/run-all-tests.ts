import { execSync } from 'child_process';

console.log('================================================================');
console.log('🚀 EJECUTANDO SUITE COMPLETA DE TESTS (SPRINTS 1, 2, 3 y 4)');
console.log('================================================================\n');

try {
  execSync('npx tsx scripts/verify-sprint1.ts', { stdio: 'inherit' });
  execSync('npx tsx scripts/verify-sprint2.ts', { stdio: 'inherit' });
  execSync('npx tsx scripts/verify-sprint3.ts', { stdio: 'inherit' });
  execSync('npx tsx scripts/verify-sprint4.ts', { stdio: 'inherit' });
  console.log('================================================================');
  console.log('🏆 ¡TODOS LOS SPRINTS HAN SIDO VERIFICADOS Y VALIDADOS CON ÉXITO!');
  console.log('================================================================');
} catch (err) {
  console.error('❌ Error durante la ejecución de los tests');
  process.exit(1);
}
