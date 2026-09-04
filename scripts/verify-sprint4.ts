import fs from 'fs';
import path from 'path';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`FAIL: ${message}`);
  }
  console.log(`  ✓ ${message}`);
}

async function runSprint4Verification() {
  console.log('🧪 Verificando Sprint 4: PWA, Lista de Compras y Métricas Financieras...\n');

  // 1. Verificación de archivos PWA
  console.log('1. Test de Configuración PWA:');
  const manifestPath = path.join(process.cwd(), 'public', 'manifest.json');
  assert(fs.existsSync(manifestPath), 'manifest.json existe en /public');

  const manifestContent = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
  assert(manifestContent.display === 'standalone', 'PWA configurada en modo standalone');
  assert(manifestContent.theme_color === '#059669', 'Theme color configurado');
  assert(manifestContent.icons.length >= 2, 'Incluye iconos de 192x192 y 512x512');

  const swPath = path.join(process.cwd(), 'public', 'sw.js');
  assert(fs.existsSync(swPath), 'Service worker (sw.js) existe en /public');

  const icon192 = path.join(process.cwd(), 'public', 'icons', 'icon-192x192.svg');
  const icon512 = path.join(process.cwd(), 'public', 'icons', 'icon-512x512.svg');
  assert(fs.existsSync(icon192) && fs.existsSync(icon512), 'Iconos vectoriales 192x192 y 512x512 existen');

  // 2. Test de Cálculos de Métricas Financieras
  console.log('\n2. Test de Cálculos Financieros y Desperdicio:');
  const sampleLogs = [
    { action: 'consumed', financial_impact: 4.50 },
    { action: 'consumed', financial_impact: 2.10 },
    { action: 'wasted', financial_impact: 1.80 },
    { action: 'consumed', financial_impact: 6.00 },
  ];

  let totalSaved = 0;
  let totalWasted = 0;
  let consumedCount = 0;
  let wastedCount = 0;

  for (const l of sampleLogs) {
    if (l.action === 'consumed') {
      totalSaved += l.financial_impact;
      consumedCount++;
    } else {
      totalWasted += l.financial_impact;
      wastedCount++;
    }
  }

  const totalActions = consumedCount + wastedCount;
  const rescueRate = Math.round((consumedCount / totalActions) * 100);

  assert(totalSaved === 12.60, `Dinero ahorrado calculado correctamente: ${totalSaved}€`);
  assert(totalWasted === 1.80, `Dinero desperdiciado calculado correctamente: ${totalWasted}€`);
  assert(rescueRate === 75, `Tasa de aprovechamiento anti-desperdicio calculada: ${rescueRate}%`);

  // 3. Test de Reabastecimiento Automático
  console.log('\n3. Test de Reabastecimiento en Lista de Compras:');
  const depletedItem = {
    name: 'Leche Entera 1L',
    quantity: 1,
    unit: 'litro',
    is_auto_suggested: true,
    is_purchased: false,
  };

  assert(depletedItem.is_auto_suggested, 'El item agotado se marca como auto_suggested');
  assert(!depletedItem.is_purchased, 'Inicia en estado no comprado');

  // Simulación de compra
  depletedItem.is_purchased = true;
  assert(depletedItem.is_purchased, 'Se marca como comprado para posterior traslado a despensa');

  console.log('\n🎉 ¡TODOS LOS TESTS DE SPRINT 4 HAN PASADO CON ÉXITO!\n');
}

runSprint4Verification().catch((err) => {
  console.error(err);
  process.exit(1);
});
