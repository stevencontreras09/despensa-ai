import { parseTicketWithGemini } from '../src/lib/gemini/ticket-parser';
import { batchInventoryItemSchema } from '../src/lib/validations/inventory';
import { DEFAULT_STORAGE_LOCATIONS } from '../src/types/inventory';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`FAIL: ${message}`);
  }
  console.log(`  ✓ ${message}`);
}

async function runSprint2Verification() {
  console.log('🧪 Verificando Sprint 2: Ingesta Inteligente y Batch Insert...\n');

  // 1. Test de extracción con Gemini Flash (mock / pipeline)
  console.log('1. Test de extracción estructurada de tickets:');
  const result = await parseTicketWithGemini({
    text: '2 litros de leche desnatada, 1kg de platanos, medio kilo de salmon',
  });

  assert(result !== null && typeof result === 'object', 'Respuesta de extracción es un objeto');
  assert(Array.isArray(result.items), 'Contiene array de items');
  assert(result.items.length > 0, `Extrajo ${result.items.length} productos`);

  for (const item of result.items) {
    assert(!!item.normalized_name, `Producto normalizado: "${item.normalized_name}"`);
    assert(
      DEFAULT_STORAGE_LOCATIONS.includes(item.storage_location as any),
      `Ubicación válida "${item.storage_location}" asignada a ${item.normalized_name}`
    );
    assert(item.default_shelf_life_days > 0, `Vida útil inferida > 0 (${item.default_shelf_life_days} días)`);
    assert(item.quantity > 0, `Cantidad > 0 (${item.quantity} ${item.unit})`);
  }

  // 2. Test de validación de Batch Ingestion
  console.log('\n2. Test de validación de Batch Ingestion con Zod:');
  const batchPayload = {
    items: result.items.map((it) => ({
      name: it.normalized_name,
      storage_location_id: '123e4567-e89b-12d3-a456-426614174000',
      quantity: it.quantity,
      unit: it.unit,
      purchase_date: '2026-09-04',
      expiration_date: '2026-09-11',
      estimated_cost: it.estimated_cost,
    })),
  };

  const parsedBatch = batchInventoryItemSchema.safeParse(batchPayload);
  if (!parsedBatch.success) {
    console.error('Validation errors:', parsedBatch.error.issues);
  }
  assert(parsedBatch.success, 'El lote generado por la extracción pasa batchInventoryItemSchema');

  // 3. Test de rechazo de lote vacío
  const emptyBatch = batchInventoryItemSchema.safeParse({ items: [] });
  assert(!emptyBatch.success, 'Rechaza correctamente lote vacío');

  console.log('\n🎉 ¡TODOS LOS TESTS DE SPRINT 2 HAN PASADO CON ÉXITO!\n');
}

runSprint2Verification().catch((err) => {
  console.error(err);
  process.exit(1);
});
