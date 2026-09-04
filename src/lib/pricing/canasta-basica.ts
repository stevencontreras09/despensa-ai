/**
 * Catálogo y Motor de Precios de Supermercados Dominicanos
 * Fuentes de referencia:
 * - Precios de Supermercados La Sirena / Sirena Market
 * - Supermercados Jumbo (incluyendo Marca Jumbo)
 * - Supermercados Bravo (incluyendo productos marca Bravo)
 * - Supermercados Nacional
 * - Sistema Dominicano de Información de Precios (SIDIP 3.0 ProConsumidor)
 * - Precios Justos MICM (Ministerio de Industria, Comercio y Mipymes)
 *
 * Todos los precios están en Pesos Dominicanos (RD$) y calculados por unidad de medida base.
 */

export interface DominicanProductPrice {
  keywords: string[];
  basePrice: number; // Precio en RD$
  baseUnit: 'lb' | 'kg' | 'litro' | 'unidad' | 'lata' | 'paquete';
  category: string;
}

// 1. Catálogo Extendido de Supermercados de República Dominicana
export const DOMINICAN_SUPERMARKET_CATALOG: DominicanProductPrice[] = [
  // --- CARNES, AVES, CERDO Y RES ---
  { keywords: ['pechuga', 'pechuga de pollo', 'pechugas', 'filete de pollo'], basePrice: 165, baseUnit: 'lb', category: 'Carnes y Aves' },
  { keywords: ['pollo', 'pollo fresco', 'pollo entero', 'muslo', 'muslito', 'alitas', 'alas de pollo'], basePrice: 84, baseUnit: 'lb', category: 'Carnes y Aves' },
  { keywords: ['carne molida', 'res molida', 'molida de res'], basePrice: 210, baseUnit: 'lb', category: 'Carnes y Aves' },
  { keywords: ['bistec', 'bistec de res', 'carne de res', 'res para guisar'], basePrice: 260, baseUnit: 'lb', category: 'Carnes y Aves' },
  { keywords: ['chuleta', 'chuleta fresca', 'chuleta ahumada', 'cerdo', 'carne de cerdo'], basePrice: 165, baseUnit: 'lb', category: 'Carnes y Aves' },
  { keywords: ['costillita', 'costillas de cerdo', 'costillitas'], basePrice: 220, baseUnit: 'lb', category: 'Carnes y Aves' },
  { keywords: ['chivo', 'carne de chivo'], basePrice: 320, baseUnit: 'lb', category: 'Carnes y Aves' },

  // --- PESCADOS Y MARISCOS ---
  { keywords: ['salmon', 'salmón', 'lomo de salmon'], basePrice: 480, baseUnit: 'lb', category: 'Pescados y Mariscos' },
  { keywords: ['mero', 'filete de mero', 'basa', 'tilapia', 'pescado'], basePrice: 195, baseUnit: 'lb', category: 'Pescados y Mariscos' },
  { keywords: ['camarones', 'camaron', 'camarón'], basePrice: 380, baseUnit: 'lb', category: 'Pescados y Mariscos' },
  { keywords: ['atun', 'atún', 'atun en lata', 'paco fish', 'calvo', 'bumble bee'], basePrice: 80, baseUnit: 'lata', category: 'Pescados y Mariscos' },
  { keywords: ['sardinas', 'sardina', 'sardinas en salsa'], basePrice: 55, baseUnit: 'lata', category: 'Pescados y Mariscos' },

  // --- EMBUTIDOS Y CHARCUTERÍA ---
  { keywords: ['salami', 'induveca', 'salami induveca', 'mallita', 'don pedro', 'checo', 'salami especial'], basePrice: 140, baseUnit: 'lb', category: 'Carnes y Aves' },
  { keywords: ['salchicha', 'salchichas', 'hot dog', 'salchichas viena'], basePrice: 110, baseUnit: 'paquete', category: 'Carnes y Aves' },
  { keywords: ['jamon', 'jamón', 'jamon cocido', 'jamon de pavo'], basePrice: 160, baseUnit: 'lb', category: 'Carnes y Aves' },
  { keywords: ['tocino', 'bacon', 'tochineta', 'panceta'], basePrice: 240, baseUnit: 'lb', category: 'Carnes y Aves' },
  { keywords: ['queso cheddar', 'cheddar', 'queso amarillo'], basePrice: 220, baseUnit: 'lb', category: 'Lácteos y Huevos' },
  { keywords: ['queso gouda', 'gouda', 'queso holandes'], basePrice: 240, baseUnit: 'lb', category: 'Lácteos y Huevos' },
  { keywords: ['queso blanco', 'queso de freir', 'queso de freír', 'queso criollo', 'queso geo'], basePrice: 195, baseUnit: 'lb', category: 'Lácteos y Huevos' },
  { keywords: ['queso de hoja', 'queso hoja'], basePrice: 180, baseUnit: 'lb', category: 'Lácteos y Huevos' },
  { keywords: ['queso mozzarella', 'mozzarella'], basePrice: 230, baseUnit: 'lb', category: 'Lácteos y Huevos' },
  { keywords: ['queso crema', 'cream cheese', 'philadelphia'], basePrice: 145, baseUnit: 'unidad', category: 'Lácteos y Huevos' },

  // --- LÁCTEOS Y HUEVOS ---
  { keywords: ['leche', 'leche rica', 'leche uht', 'listamilk', 'dos pinos', 'parmalat', 'leche entera', 'leche descremada', 'leche semidescremada', 'leche semidesnatada'], basePrice: 78, baseUnit: 'litro', category: 'Lácteos y Huevos' },
  { keywords: ['leche evaporada', 'carnation', 'rica evaporada'], basePrice: 70, baseUnit: 'lata', category: 'Lácteos y Huevos' },
  { keywords: ['leche condensada', 'nestle', 'condensada'], basePrice: 85, baseUnit: 'lata', category: 'Lácteos y Huevos' },
  { keywords: ['huevo', 'huevos', 'carton de huevos', 'docena de huevos'], basePrice: 9, baseUnit: 'unidad', category: 'Lácteos y Huevos' },
  { keywords: ['mantequilla', 'mantequilla rica', 'mantequilla sosa', 'margarina', 'dorina'], basePrice: 95, baseUnit: 'unidad', category: 'Lácteos y Huevos' },
  { keywords: ['yogur', 'yogurt', 'yoka', 'yogur bravo', 'yogurt griego'], basePrice: 65, baseUnit: 'unidad', category: 'Lácteos y Huevos' },
  { keywords: ['crema de leche', 'crema para cocinar'], basePrice: 110, baseUnit: 'unidad', category: 'Lácteos y Huevos' },

  // --- VÍVERES Y TUBÉRCULOS ---
  { keywords: ['platano', 'plátano', 'platano verde', 'plátano verde', 'platano barahonero'], basePrice: 20, baseUnit: 'unidad', category: 'Frutas y Verduras' },
  { keywords: ['platano maduro', 'plátano maduro', 'maduro'], basePrice: 20, baseUnit: 'unidad', category: 'Frutas y Verduras' },
  { keywords: ['guineo', 'guineos', 'guineo verde', 'guineo maduro', 'banana'], basePrice: 7, baseUnit: 'unidad', category: 'Frutas y Verduras' },
  { keywords: ['yuca'], basePrice: 30, baseUnit: 'lb', category: 'Frutas y Verduras' },
  { keywords: ['papa', 'papas', 'papa blanca'], basePrice: 40, baseUnit: 'lb', category: 'Frutas y Verduras' },
  { keywords: ['batata'], basePrice: 32, baseUnit: 'lb', category: 'Frutas y Verduras' },
  { keywords: ['yautia', 'yautía', 'name', 'ñame'], basePrice: 68, baseUnit: 'lb', category: 'Frutas y Verduras' },

  // --- FRUTAS Y VEGETALES ---
  { keywords: ['aguacate', 'aguacates'], basePrice: 55, baseUnit: 'unidad', category: 'Frutas y Verduras' },
  { keywords: ['cebolla', 'cebolla roja', 'cebolla blanca', 'cebollas'], basePrice: 55, baseUnit: 'lb', category: 'Frutas y Verduras' },
  { keywords: ['ajo', 'ajo importado', 'cabeza de ajo', 'pasta de ajo'], basePrice: 140, baseUnit: 'lb', category: 'Frutas y Verduras' },
  { keywords: ['tomate', 'tomates', 'tomate barcelo', 'tomate barceló', 'tomate bugalu', 'tomate ensalada'], basePrice: 42, baseUnit: 'lb', category: 'Frutas y Verduras' },
  { keywords: ['aji', 'ají', 'aji cubanela', 'ají cubanela', 'aji dulce'], basePrice: 55, baseUnit: 'lb', category: 'Frutas y Verduras' },
  { keywords: ['pimiento', 'pimientos', 'pimiento morron', 'pimiento morrón', 'morron', 'morrón'], basePrice: 85, baseUnit: 'lb', category: 'Frutas y Verduras' },
  { keywords: ['zanahoria', 'zanahorias'], basePrice: 35, baseUnit: 'lb', category: 'Frutas y Verduras' },
  { keywords: ['lechuga', 'lechuga repollada', 'lechuga romana', 'repollo'], basePrice: 50, baseUnit: 'unidad', category: 'Frutas y Verduras' },
  { keywords: ['limon', 'limón', 'limones', 'limon persa'], basePrice: 12, baseUnit: 'unidad', category: 'Frutas y Verduras' },
  { keywords: ['cilantro', 'cilantrico', 'verdura', 'verduras', 'recao', 'apio'], basePrice: 25, baseUnit: 'paquete', category: 'Frutas y Verduras' },
  { keywords: ['manzana', 'manzanas', 'manzana roja', 'manzana verde'], basePrice: 30, baseUnit: 'unidad', category: 'Frutas y Verduras' },
  { keywords: ['uvas', 'uva', 'uvas sin semilla'], basePrice: 195, baseUnit: 'lb', category: 'Frutas y Verduras' },
  { keywords: ['naranja', 'naranjas', 'naranja de jugo'], basePrice: 12, baseUnit: 'unidad', category: 'Frutas y Verduras' },
  { keywords: ['pina', 'piña'], basePrice: 80, baseUnit: 'unidad', category: 'Frutas y Verduras' },
  { keywords: ['sandia', 'sandía'], basePrice: 150, baseUnit: 'unidad', category: 'Frutas y Verduras' },
  { keywords: ['lechoza', 'papaya'], basePrice: 65, baseUnit: 'unidad', category: 'Frutas y Verduras' },
  { keywords: ['pepino', 'pepinos'], basePrice: 25, baseUnit: 'lb', category: 'Frutas y Verduras' },
  { keywords: ['berenjena', 'berenjenas'], basePrice: 28, baseUnit: 'lb', category: 'Frutas y Verduras' },
  { keywords: ['auyama', 'calabaza'], basePrice: 32, baseUnit: 'lb', category: 'Frutas y Verduras' },
  { keywords: ['brocoli', 'brócoli', 'coliflor'], basePrice: 75, baseUnit: 'lb', category: 'Frutas y Verduras' },

  // --- GRANOS, ARROZ Y DESPENSA ---
  { keywords: ['arroz', 'arroz selecto', 'pimco', 'campos', 'la garza', 'arroz marca jumbo', 'arroz bravo', 'arroz premium'], basePrice: 50, baseUnit: 'lb', category: 'Despensa y Granos' },
  { keywords: ['habichuela', 'habichuelas', 'habichuelas rojas', 'habichuelas negras', 'habichuela pinta', 'habichuelas jacomelo', 'frijoles'], basePrice: 58, baseUnit: 'lb', category: 'Despensa y Granos' },
  { keywords: ['guandules', 'gandules', 'guandules verdes', 'guandules con coco'], basePrice: 85, baseUnit: 'lata', category: 'Despensa y Granos' },
  { keywords: ['aceite', 'aceite crisol', 'crisol', 'la joya', 'mazola', 'aceite de soya', 'aceite vegetal'], basePrice: 120, baseUnit: 'litro', category: 'Despensa y Granos' },
  { keywords: ['aceite de oliva', 'oliva extra virgen', 'fígaro', 'figaro'], basePrice: 340, baseUnit: 'unidad', category: 'Despensa y Granos' },
  { keywords: ['espaguetis', 'espagueti', 'spaghetti', 'pastas', 'coditos', 'macarrones', 'milano', 'princesa'], basePrice: 42, baseUnit: 'paquete', category: 'Despensa y Granos' },
  { keywords: ['pasta de tomate', 'salsa de tomate', 'victorina', 'la famosa', 'goya'], basePrice: 42, baseUnit: 'lata', category: 'Despensa y Granos' },
  { keywords: ['harina', 'harina de trigo', 'blanquita'], basePrice: 40, baseUnit: 'lb', category: 'Despensa y Granos' },
  { keywords: ['harina de maiz', 'harina de maíz', 'mazorca'], basePrice: 35, baseUnit: 'lb', category: 'Despensa y Granos' },
  { keywords: ['azucar', 'azúcar', 'azucar crema', 'azúcar crema'], basePrice: 38, baseUnit: 'lb', category: 'Despensa y Granos' },
  { keywords: ['azucar blanca', 'azúcar blanca'], basePrice: 45, baseUnit: 'lb', category: 'Despensa y Granos' },
  { keywords: ['sal', 'sal molida', 'sal refisal'], basePrice: 20, baseUnit: 'paquete', category: 'Despensa y Granos' },
  { keywords: ['avena', 'avena quaker', 'avena en hojuelas'], basePrice: 68, baseUnit: 'paquete', category: 'Despensa y Granos' },
  { keywords: ['maiz', 'maíz', 'maiz dulce', 'maíz enlatado'], basePrice: 65, baseUnit: 'lata', category: 'Despensa y Granos' },
  { keywords: ['guisantes', 'petit pois'], basePrice: 60, baseUnit: 'lata', category: 'Despensa y Granos' },

  // --- PANADERÍA, GALLETAS Y DESAYUNO ---
  { keywords: ['pan de agua', 'pan sobao', 'pan criollo'], basePrice: 10, baseUnit: 'unidad', category: 'Panadería' },
  { keywords: ['pan de molde', 'pan bimbo', 'pan pepin', 'pan tostado', 'pan integral'], basePrice: 110, baseUnit: 'paquete', category: 'Panadería' },
  { keywords: ['galleta', 'galletas', 'galletas de soda', 'hatuey', 'guarina'], basePrice: 55, baseUnit: 'paquete', category: 'Panadería' },
  { keywords: ['dino', 'galletas dulces', 'galletas dino', 'oreo'], basePrice: 65, baseUnit: 'paquete', category: 'Snacks' },
  { keywords: ['cereal', 'corn flakes', 'zucaritas', 'chococrispis'], basePrice: 165, baseUnit: 'paquete', category: 'Despensa y Granos' },

  // --- BEBIDAS Y CAFÉ ---
  { keywords: ['cafe', 'café', 'cafe santo domingo', 'café santo domingo', 'cafe pilon', 'café molido'], basePrice: 220, baseUnit: 'paquete', category: 'Bebidas' },
  { keywords: ['agua', 'agua embotellada', 'botellon de agua', 'dasani', 'planeta azul', 'cristal'], basePrice: 60, baseUnit: 'unidad', category: 'Bebidas' },
  { keywords: ['jugo', 'jugos', 'jugo rica', 'santal', 'jugo de naranja', 'jugo de manzana'], basePrice: 85, baseUnit: 'litro', category: 'Bebidas' },
  { keywords: ['refresco', 'coca cola', 'coca-cola', 'red rock', 'country club', 'pepsi', 'sprite'], basePrice: 45, baseUnit: 'unidad', category: 'Bebidas' },
  { keywords: ['malta', 'malta india', 'malta morena'], basePrice: 38, baseUnit: 'unidad', category: 'Bebidas' },
  { keywords: ['te', 'té', 'infusion', 'manzanilla'], basePrice: 75, baseUnit: 'paquete', category: 'Bebidas' },

  // --- CONDIMENTOS, SALSAS Y SAZONES ---
  { keywords: ['sazon', 'sazón', 'sazon liquido', 'sazón líquido', 'ranchero', 'baldom', 'maggi'], basePrice: 65, baseUnit: 'unidad', category: 'Despensa y Granos' },
  { keywords: ['sopita', 'sopitas', 'caldo de pollo', 'cubitos maggi', 'sopita doña gallina', 'dona gallina'], basePrice: 50, baseUnit: 'paquete', category: 'Despensa y Granos' },
  { keywords: ['adobo', 'adobo goya'], basePrice: 55, baseUnit: 'unidad', category: 'Despensa y Granos' },
  { keywords: ['oregano', 'orégano', 'oregano molido'], basePrice: 40, baseUnit: 'paquete', category: 'Despensa y Granos' },
  { keywords: ['vinagre', 'vinagre blanco'], basePrice: 45, baseUnit: 'unidad', category: 'Despensa y Granos' },
  { keywords: ['mayonesa', 'mayonesa kraft', 'baldom mayonesa'], basePrice: 110, baseUnit: 'unidad', category: 'Despensa y Granos' },
  { keywords: ['ketchup', 'catchup'], basePrice: 75, baseUnit: 'unidad', category: 'Despensa y Granos' },
  { keywords: ['mostaza'], basePrice: 60, baseUnit: 'unidad', category: 'Despensa y Granos' },
  { keywords: ['pimienta', 'pimienta negra'], basePrice: 45, baseUnit: 'paquete', category: 'Despensa y Granos' },

  // --- CONGELADOS Y SNACKS ---
  { keywords: ['papas congeladas', 'papas fritas congeladas'], basePrice: 160, baseUnit: 'paquete', category: 'Congelados' },
  { keywords: ['nuggets', 'nuggets de pollo'], basePrice: 190, baseUnit: 'paquete', category: 'Congelados' },
  { keywords: ['vegetales mixtos congelados', 'vegetales congelados'], basePrice: 125, baseUnit: 'paquete', category: 'Congelados' },
  { keywords: ['helado', 'helado bon', 'helado nestle'], basePrice: 250, baseUnit: 'unidad', category: 'Congelados' },
  { keywords: ['platanitos', 'chicharron', 'chicharrón', 'papitas', 'lays', "lay's", 'doritos'], basePrice: 50, baseUnit: 'paquete', category: 'Snacks' },
];

// 2. Heurística de Fallback por Categoría Departamental (cuando el ítem exacto no está listado)
export const DEPARTMENT_FALLBACK_PRICE_PER_UNIT: Record<string, { price: number; unit: string }> = {
  'Carnes y Aves': { price: 180, unit: 'lb' },
  'Pescados y Mariscos': { price: 230, unit: 'lb' },
  'Lácteos y Huevos': { price: 85, unit: 'unidad' },
  'Frutas y Verduras': { price: 45, unit: 'lb' },
  'Despensa y Granos': { price: 60, unit: 'unidad' },
  'Panadería': { price: 45, unit: 'paquete' },
  'Bebidas': { price: 65, unit: 'litro' },
  'Snacks': { price: 55, unit: 'paquete' },
  'Congelados': { price: 150, unit: 'paquete' },
  'Varios': { price: 75, unit: 'unidad' },
};

/**
 * Normaliza una cadena para búsqueda fonética y sintáctica
 */
function cleanText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Quitar tildes
    .replace(/[^a-z0-9\s]/g, ' ')
    .trim();
}

/**
 * Convierte cantidades a la unidad base del catálogo dominicano
 * Relación estándar en RD: 1 kg ≈ 2.20462 libras
 */
function convertQuantity(quantity: number, fromUnit: string, toUnit: 'lb' | 'kg' | 'litro' | 'unidad' | 'lata' | 'paquete'): number {
  const normUnit = fromUnit.toLowerCase().trim();

  // Si las unidades coinciden
  if (normUnit === toUnit) return quantity;

  // Si la base es libra (lb)
  if (toUnit === 'lb') {
    if (normUnit === 'kg') return quantity * 2.20462;
    if (normUnit === 'g') return (quantity / 1000) * 2.20462;
    if (normUnit === 'unidad') return quantity; // Asume 1 lb por unidad promedio si aplica
  }

  // Si la base es kg
  if (toUnit === 'kg') {
    if (normUnit === 'g') return quantity / 1000;
    if (normUnit === 'lb') return quantity / 2.20462;
  }

  // Si la base es litro
  if (toUnit === 'litro') {
    if (normUnit === 'ml') return quantity / 1000;
    if (normUnit === 'unidad') return quantity;
  }

  // Si la base es unidad, lata o paquete, usar cantidad directa
  return quantity > 0 ? quantity : 1;
}

/**
 * Estima de manera determinista el precio total en Pesos Dominicanos (RD$)
 * de cualquier producto de supermercado (La Sirena, Jumbo, Bravo, Nacional, Marca Jumbo).
 */
export function estimateDominicanPrice(
  productName: string,
  quantity: number = 1,
  unit: string = 'unidad',
  category?: string
): number {
  const cleanName = cleanText(productName);
  const words = cleanName.split(/\s+/).filter((w) => w.length > 2);

  // 1. Buscar coincidencia en el catálogo extendido
  let bestMatch: DominicanProductPrice | null = null;
  let maxMatchedChars = 0;

  for (const item of DOMINICAN_SUPERMARKET_CATALOG) {
    for (const keyword of item.keywords) {
      const cleanKeyword = cleanText(keyword);
      // Coincidencia exacta o contenida
      if (cleanName.includes(cleanKeyword) || cleanKeyword.includes(cleanName)) {
        if (cleanKeyword.length > maxMatchedChars) {
          maxMatchedChars = cleanKeyword.length;
          bestMatch = item;
        }
      }
    }
  }

  // Coincidencia por tokens de palabras si no hubo match por frase
  if (!bestMatch && words.length > 0) {
    for (const item of DOMINICAN_SUPERMARKET_CATALOG) {
      const matchScore = item.keywords.some((kw) => {
        const kwWords = cleanText(kw).split(/\s+/);
        return kwWords.some((kwWord) => words.includes(kwWord));
      });
      if (matchScore) {
        bestMatch = item;
        break;
      }
    }
  }

  let finalPrice = 0;

  if (bestMatch) {
    const convertedQty = convertQuantity(quantity, unit, bestMatch.baseUnit);
    finalPrice = bestMatch.basePrice * convertedQty;
  } else {
    // 2. Heurística de fallback por departamento si el producto no coincide con ningún ítem específico
    const cat = category || 'Varios';
    const fallback = DEPARTMENT_FALLBACK_PRICE_PER_UNIT[cat] || DEPARTMENT_FALLBACK_PRICE_PER_UNIT['Varios'];
    const safeQty = quantity > 0 ? quantity : 1;

    if (unit === 'kg') {
      finalPrice = fallback.price * 2.2 * safeQty;
    } else if (unit === 'g') {
      finalPrice = (fallback.price * 2.2 * safeQty) / 1000;
    } else if (unit === 'ml') {
      finalPrice = (fallback.price * safeQty) / 1000;
    } else {
      finalPrice = fallback.price * safeQty;
    }
  }

  // Redondear a 2 decimales para precisión contable
  return Math.round(finalPrice * 100) / 100;
}
