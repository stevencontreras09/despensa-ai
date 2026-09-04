import { generateRescueRecipesWithGemini } from '../src/lib/gemini/recipe-generator';
import { deductRecipeRequestSchema, rescueRecipesRequestSchema } from '../src/lib/validations/recipes';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`FAIL: ${message}`);
  }
  console.log(`  ✓ ${message}`);
}

async function runSprint3Verification() {
  console.log('🧪 Verificando Sprint 3: Dashboard Semáforo, Motor de Recetas y Deducción Idempotente...\n');

  // 1. Test de Generación de Recetas de Rescate
  console.log('1. Test de Generador de Recetas con Gemini 2.5 Flash:');
  const sampleItems = [
    {
      id: '123e4567-e89b-12d3-a456-426614174001',
      name: 'Pechuga de Pollo',
      quantity: 0.5,
      unit: 'kg',
      expiration_date: '2026-09-05',
      days_remaining: 1,
      traffic_light: 'red',
    },
    {
      id: '123e4567-e89b-12d3-a456-426614174002',
      name: 'Arroz Redondo',
      quantity: 1,
      unit: 'paquete',
      expiration_date: '2027-01-01',
      days_remaining: 120,
      traffic_light: 'green',
    },
  ];

  const recipeResult = await generateRescueRecipesWithGemini({
    inventoryItems: sampleItems,
    maxPrepTimeMinutes: 30,
  });

  assert(recipeResult !== null && typeof recipeResult === 'object', 'Generador devuelve objeto válido');
  assert(Array.isArray(recipeResult.recipes), 'Contiene array de recetas');
  assert(recipeResult.recipes.length > 0, `Generó ${recipeResult.recipes.length} receta(s) de rescate`);

  const recipe = recipeResult.recipes[0];
  assert(!!recipe.title, `Título: "${recipe.title}"`);
  assert(!!recipe.rescue_score, `Rescue score asignado: "${recipe.rescue_score}"`);
  assert(recipe.used_inventory_items.length > 0, 'Usa ingredientes de inventario');
  assert(Array.isArray(recipe.pantry_staples_used), 'Lista básicos de despensa');
  assert(Array.isArray(recipe.missing_ingredients), 'Lista ingredientes faltantes');
  assert(Array.isArray(recipe.steps) && recipe.steps.length > 0, 'Incluye pasos detallados');

  // 2. Test de Esquemas Zod para Recetas
  console.log('\n2. Test de Esquemas Zod para Recetas y Deducción:');
  const validRescueReq = rescueRecipesRequestSchema.safeParse({
    expiring_within_days: 3,
    max_prep_time_minutes: 25,
    excluded_item_ids: [],
  });
  assert(validRescueReq.success, 'Validación de consulta de recetas exitosa');

  const validDeductReq = deductRecipeRequestSchema.safeParse({
    recipe_id: recipe.id,
    recipe_title: recipe.title,
    items: [
      {
        item_id: '123e4567-e89b-12d3-a456-426614174001',
        used_quantity: 0.5,
      },
    ],
  });
  assert(validDeductReq.success, 'Validación de payload de deducción exitosa');

  // 3. Test de Simulación de Idempotencia y Stock Depletion
  console.log('\n3. Test de Simulación de Deducción Idempotente:');
  const mockCache = new Map<string, any>();
  const testIdempotencyKey = 'idemp_test_key_123';

  function simulateDeduction(idempKey: string, initialQty: number, deductQty: number) {
    if (mockCache.has(idempKey)) {
      return { ...mockCache.get(idempKey), cached: true };
    }

    const newQty = Math.max(0, initialQty - deductQty);
    const depleted = newQty <= 0;
    const response = {
      success: true,
      initialQty,
      used_quantity: deductQty,
      remaining_quantity: newQty,
      status: depleted ? 'consumed' : 'active',
      added_to_shopping_list: depleted,
      cached: false,
    };

    mockCache.set(idempKey, response);
    return response;
  }

  // Primera ejecución: deducción real
  const run1 = simulateDeduction(testIdempotencyKey, 0.5, 0.5);
  assert(!run1.cached && run1.remaining_quantity === 0, 'Primera llamada descuenta stock a 0');
  assert(run1.status === 'consumed', 'Se marca status=consumed al llegar a 0');
  assert(run1.added_to_shopping_list, 'Se auto-sugiere a la lista de compras');

  // Segunda ejecución con la MISMA idempotency key: retorno desde caché sin doble deducción
  const run2 = simulateDeduction(testIdempotencyKey, 0, 0.5);
  assert(run2.cached, 'Segunda llamada detecta Idempotency-Key y retorna respuesta en caché');
  assert(run2.remaining_quantity === 0, 'No se produce doble deducción');

  console.log('\n🎉 ¡TODOS LOS TESTS DE SPRINT 3 HAN PASADO CON ÉXITO!\n');
}

runSprint3Verification().catch((err) => {
  console.error(err);
  process.exit(1);
});
