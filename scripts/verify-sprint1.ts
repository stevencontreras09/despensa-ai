import { generateInviteCode, isValidInviteCode, normalizeInviteCode } from '../src/lib/utils/invite-code';
import { calculateTrafficLight } from '../src/lib/utils/traffic-light';
import { createHouseholdSchema, joinHouseholdSchema } from '../src/lib/validations/household';
import { loginSchema, registerSchema } from '../src/lib/validations/auth';
import { inventoryItemSchema, batchInventoryItemSchema } from '../src/lib/validations/inventory';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`FAIL: ${message}`);
  }
  console.log(`  ✓ ${message}`);
}

console.log('🧪 Verificando Sprint 1: Lógica, Utilidades y Validaciones...\n');

// 1. Códigos de Invitación (12 Caracteres)
console.log('1. Test de Códigos de Invitación de 12 Caracteres:');
const code1 = generateInviteCode(12);
assert(code1.length === 12, `Genera código de longitud 12: "${code1}"`);
assert(isValidInviteCode(code1), `Código generado pasa validación isValidInviteCode`);
assert(!isValidInviteCode('ABC'), `Rechaza código corto`);
assert(!isValidInviteCode('ABCDEFGHIJKLMNO'), `Rechaza código largo`);
assert(!isValidInviteCode('ABCD-EFGH-1234'), `Rechaza código con caracteres no permitidos antes de normalizar`);
const normalized = normalizeInviteCode('abcd-efgh-2345');
assert(normalized.length === 12 && isValidInviteCode(normalized), `Normaliza correctamente: ${normalized}`);

// 2. Semáforo de Caducidad
console.log('\n2. Test de Lógica del Semáforo de Caducidad:');
const now = new Date();
const formatDate = (daysOffset: number) => {
  const d = new Date(now);
  d.setDate(d.getDate() + daysOffset);
  return d.toISOString().split('T')[0];
};

// Vencido
const expiredTest = calculateTrafficLight(formatDate(-2));
assert(expiredTest.status === 'red' && expiredTest.is_expired, 'Producto vencido hace 2 días es ROJO');

// 0 a 2 días (<= 48h)
const todayTest = calculateTrafficLight(formatDate(0));
assert(todayTest.status === 'red' && todayTest.is_critical, 'Producto que vence hoy es ROJO crítico');

const tomorrowTest = calculateTrafficLight(formatDate(1));
assert(tomorrowTest.status === 'red' && tomorrowTest.is_critical, 'Producto que vence mañana es ROJO crítico');

const twoDaysTest = calculateTrafficLight(formatDate(2));
assert(twoDaysTest.status === 'red' && twoDaysTest.is_critical, 'Producto que vence en 2 días es ROJO crítico');

// 3 a 5 días
const yellowTest = calculateTrafficLight(formatDate(4));
assert(yellowTest.status === 'yellow', 'Producto que vence en 4 días es AMARILLO');

// > 5 días
const greenTest = calculateTrafficLight(formatDate(10));
assert(greenTest.status === 'green', 'Producto que vence en 10 días es VERDE');

// 3. Validaciones Zod de Hogares
console.log('\n3. Test de Esquemas Zod de Hogares:');
const validCreate = createHouseholdSchema.safeParse({ name: 'Familia Gómez' });
assert(validCreate.success, 'Nombre de hogar válido aceptado');
const invalidCreate = createHouseholdSchema.safeParse({ name: 'A' });
assert(!invalidCreate.success, 'Nombre demasiado corto rechazado');

const validJoin = joinHouseholdSchema.safeParse({ invite_code: code1 });
assert(validJoin.success, 'Código de invitación de 12 caracteres aceptado');

// 4. Validaciones Zod de Inventario
console.log('\n4. Test de Esquemas Zod de Inventario:');
const validItem = inventoryItemSchema.safeParse({
  name: 'Leche Desnatada',
  storage_location_id: '123e4567-e89b-12d3-a456-426614174000',
  quantity: 2,
  unit: 'litro',
  purchase_date: '2026-09-04',
  expiration_date: '2026-09-11',
  estimated_cost: 1.85,
});
assert(validItem.success, 'Item de inventario válido aceptado');

const batchItems = batchInventoryItemSchema.safeParse({
  items: [
    {
      name: 'Yogurt Griego',
      storage_location_id: '123e4567-e89b-12d3-a456-426614174000',
      quantity: 4,
      unit: 'unidad',
      purchase_date: '2026-09-04',
      expiration_date: '2026-09-18',
    },
  ],
});
assert(batchItems.success, 'Lote de inventario batch aceptado');

console.log('\n🎉 ¡TODOS LOS TESTS DE SPRINT 1 HAN PASADO CON ÉXITO!\n');
