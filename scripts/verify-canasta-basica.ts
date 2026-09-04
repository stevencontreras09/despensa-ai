import { estimateDominicanPrice, DOMINICAN_SUPERMARKET_CATALOG } from '../src/lib/pricing/canasta-basica';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`FAIL: ${message}`);
  }
  console.log(`  ✓ ${message}`);
}

async function runCanastaBasicaVerification() {
  console.log('🧪 Verificando Motor de Precios de Supermercados Dominicanos (La Sirena, Jumbo, Bravo, Nacional)...\n');

  // 1. Verificación del Catálogo Extendido
  console.log('1. Test de Cobertura de Catálogo y Marcas:');
  assert(DOMINICAN_SUPERMARKET_CATALOG.length >= 50, `Catálogo extendido contiene ${DOMINICAN_SUPERMARKET_CATALOG.length} alimentos de supermercados`);
  
  const hasInduveca = DOMINICAN_SUPERMARKET_CATALOG.some(p => p.keywords.includes('induveca'));
  assert(hasInduveca, 'Incluye marcas icónicas (Induveca, Rica, Santo Domingo)');

  const hasBravoJumbo = DOMINICAN_SUPERMARKET_CATALOG.some(p => p.keywords.some(k => k.includes('jumbo') || k.includes('bravo')));
  assert(hasBravoJumbo, 'Incluye referencias a marcas de supermercado (Bravo, Marca Jumbo)');

  // 2. Test de Carnes, Aves y Embutidos
  console.log('\n2. Test de Carnes, Aves y Embutidos:');
  const pricePechuga = estimateDominicanPrice('Pechuga de pollo fileteada', 1, 'lb');
  assert(pricePechuga === 165, `Pechuga de pollo (1 lb) calculada en RD$ 165: RD$ ${pricePechuga}`);

  const pricePollo = estimateDominicanPrice('Pollo fresco entero', 2, 'lb');
  assert(pricePollo === 168, `Pollo fresco (2 lbs) calculado en RD$ 168: RD$ ${pricePollo}`);

  const priceSalami = estimateDominicanPrice('Salami Especial Induveca', 1, 'lb');
  assert(priceSalami === 140, `Salami Induveca (1 lb) calculado en RD$ 140: RD$ ${priceSalami}`);

  // 3. Test de Lácteos y Huevos
  console.log('\n3. Test de Lácteos y Huevos:');
  const priceLeche = estimateDominicanPrice('Leche Rica UHT 1L', 2, 'litro');
  assert(priceLeche === 156, `Leche Rica UHT (2 litros) calculada en RD$ 156: RD$ ${priceLeche}`);

  const priceHuevos = estimateDominicanPrice('Huevos frescos', 12, 'unidad');
  assert(priceHuevos === 108, `Huevos frescos (12 uds / docena) calculados en RD$ 108: RD$ ${priceHuevos}`);

  const priceQueso = estimateDominicanPrice('Queso Cheddar Bravo', 1, 'lb');
  assert(priceQueso === 220, `Queso Cheddar Bravo (1 lb) calculado en RD$ 220: RD$ ${priceQueso}`);

  // 4. Test de Granos, Despensa y Abarrotes
  console.log('\n4. Test de Granos, Despensa y Abarrotes:');
  const priceArroz = estimateDominicanPrice('Arroz Selecto Marca Jumbo', 2, 'lb');
  assert(priceArroz === 100, `Arroz Selecto Marca Jumbo (2 lbs) calculado en RD$ 100: RD$ ${priceArroz}`);

  const priceHabichuelas = estimateDominicanPrice('Habichuelas rojas La Garza', 1, 'lb');
  assert(priceHabichuelas === 58, `Habichuelas rojas (1 lb) calculadas en RD$ 58: RD$ ${priceHabichuelas}`);

  const priceAceite = estimateDominicanPrice('Aceite vegetal Crisol', 1, 'litro');
  assert(priceAceite === 120, `Aceite Crisol (1 L) calculado en RD$ 120: RD$ ${priceAceite}`);

  const priceCafe = estimateDominicanPrice('Café Santo Domingo 1lb', 1, 'paquete');
  assert(priceCafe === 220, `Café Santo Domingo (1 paquete) calculado en RD$ 220: RD$ ${priceCafe}`);

  // 5. Test de Frutas, Víveres y Vegetales
  console.log('\n5. Test de Frutas, Víveres y Vegetales:');
  const pricePlatanos = estimateDominicanPrice('Plátanos verdes barahoneros', 6, 'unidad');
  assert(pricePlatanos === 120, `Plátanos verdes (6 uds) calculados en RD$ 120: RD$ ${pricePlatanos}`);

  const priceAguacate = estimateDominicanPrice('Aguacates criollos', 2, 'unidad');
  assert(priceAguacate === 110, `Aguacates (2 uds) calculados en RD$ 110: RD$ ${priceAguacate}`);

  const priceYuca = estimateDominicanPrice('Yuca mocana', 3, 'lb');
  assert(priceYuca === 90, `Yuca (3 lbs) calculada en RD$ 90: RD$ ${priceYuca}`);

  // 6. Test de Enlatados, Bebidas y Snacks
  console.log('\n6. Test de Enlatados, Bebidas y Snacks:');
  const priceAtun = estimateDominicanPrice('Atún Paco Fish en aceite', 2, 'lata');
  assert(priceAtun === 160, `Atún Paco Fish (2 latas) calculado en RD$ 160: RD$ ${priceAtun}`);

  const priceGalletas = estimateDominicanPrice('Galletas de soda Hatuey', 1, 'paquete');
  assert(priceGalletas === 55, `Galletas Hatuey (1 paq) calculadas en RD$ 55: RD$ ${priceGalletas}`);

  // 7. Test de Conversión de Unidades Métricas (kg y g)
  console.log('\n7. Test de Conversión Métrica (kg y g a lb):');
  const pricePechugaKg = estimateDominicanPrice('Pechuga de pollo', 1, 'kg');
  // 1 kg = 2.20462 lb * 165 = ~363.76
  assert(Math.round(pricePechugaKg) === 364, `Conversión de 1 kg de pechuga a RD$ 364: RD$ ${pricePechugaKg}`);

  // 8. Test de Heurística de Fallback Departamental (producto no listado)
  console.log('\n8. Test de Fallback Departamental:');
  const priceSnackDesconocido = estimateDominicanPrice('Snack artesanal exótico', 2, 'paquete', 'Snacks');
  assert(priceSnackDesconocido > 0, `Asigna precio por fallback de categoría Snacks: RD$ ${priceSnackDesconocido}`);

  console.log('\n🎉 ¡TODOS LOS TESTS DEL MOTOR DE PRECIOS DE SUPERMERCADOS HAN PASADO CON ÉXITO!\n');
}

runCanastaBasicaVerification().catch((err) => {
  console.error(err);
  process.exit(1);
});
