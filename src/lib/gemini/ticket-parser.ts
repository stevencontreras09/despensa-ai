import { Type } from '@google/genai';
import { getGeminiClient, GEMINI_MODEL, generateWithFallback } from './client';
import { TicketExtractionResponse } from '@/types/ai';

export const ticketExtractionJsonSchema = {
  type: Type.OBJECT,
  properties: {
    store_name: {
      type: Type.STRING,
      description: 'Nombre del supermercado o tienda detectado (ej: Mercadona, Carrefour, Lidl) o null si no se detecta.',
    },
    purchase_date: {
      type: Type.STRING,
      description: 'Fecha de la compra en formato YYYY-MM-DD. Si no aparece, usar null.',
    },
    currency: {
      type: Type.STRING,
      description: 'Símbolo o código de moneda (ej: EUR, USD).',
    },
    items: {
      type: Type.ARRAY,
      description: 'Lista de alimentos o bebidas comestibles detectados.',
      items: {
        type: Type.OBJECT,
        properties: {
          raw_name: {
            type: Type.STRING,
            description: 'Texto crudo tal como aparece en el ticket o en la transcripción de voz.',
          },
          normalized_name: {
            type: Type.STRING,
            description: 'Nombre limpio, legible y normalizado del alimento (ej: "Leche Entera 1L", "Plátanos", "Pechuga de Pollo").',
          },
          category: {
            type: Type.STRING,
            description: 'Categoría (ej: Frutas y Verduras, Lácteos y Huevos, Carnes y Aves, Pescados, Panadería, Despensa, Bebidas).',
          },
          storage_location: {
            type: Type.STRING,
            enum: ['Nevera', 'Congelador', 'Despensa Seca', 'Frutero'],
            description: 'Ubicación óptima de conservación para maximizar la frescura.',
          },
          quantity: {
            type: Type.NUMBER,
            description: 'Cantidad numérica comprada (ej: 1, 2, 0.5, 1.5).',
          },
          unit: {
            type: Type.STRING,
            enum: ['unidad', 'kg', 'g', 'litro', 'ml', 'paquete', 'lata'],
            description: 'Unidad de medida estandarizada.',
          },
          estimated_cost: {
            type: Type.NUMBER,
            description: 'Precio total del ítem en la moneda correspondiente o null si no está disponible.',
          },
          default_shelf_life_days: {
            type: Type.INTEGER,
            description: 'Vida útil estimada en días según la naturaleza del producto (ej: pescado 2, pollo 3, leche fresca 7, arroz 180).',
          },
        },
        required: [
          'raw_name',
          'normalized_name',
          'category',
          'storage_location',
          'quantity',
          'unit',
          'default_shelf_life_days',
        ],
      },
    },
  },
  required: ['items'],
};

const SYSTEM_INSTRUCTION = `Actúas como el módulo de ingesta inteligente de DespensaAI.
Tu misión es procesar imágenes de tickets de compra de supermercados o transcripciones de notas de voz de compras domésticas:
1. Extrae ÚNICAMENTE alimentos y bebidas comestibles. DESCARTA taxativamente productos de limpieza (lejía, detergente), papel higiénico, servilletas, cosméticos, bolsas plásticas y cualquier artículo no alimentario.
2. Normaliza abreviaturas y códigos de supermercado a nombres limpios y comprensibles en español.
3. Clasifica la ubicación óptima de almacenamiento ESTRICTAMENTE entre: 'Nevera', 'Congelador', 'Despensa Seca', 'Frutero'.
4. Infiere días de vida útil estimados (default_shelf_life_days) realistas según el producto:
   - Pescados y mariscos frescos: 2 días
   - Carnes y aves frescas: 3 días
   - Frutas y verduras de maduración rápida (plátanos, fresas, aguacates): 4-5 días
   - Lácteos y huevos: 7-10 días
   - Panadería fresca: 3-4 días
   - Conservas y despensa seca (arroz, pasta, legumbres): 180 días
   - Congelados: 90 días
5. Si no se detecta la fecha del ticket, asume la fecha actual para tus proyecciones.
6. Devuelve siempre un JSON estrictamente estructurado según el schema provisto.`;

export async function parseTicketWithGemini(options: {
  imageBuffer?: Buffer;
  mimeType?: string;
  text?: string;
}): Promise<TicketExtractionResponse> {
  const apiKey = process.env.GEMINI_API_KEY;

  // Si no hay API key real configurada, retornamos datos de demostración realistas
  if (!apiKey || apiKey.includes('placeholder')) {
    const today = new Date().toISOString().split('T')[0];
    return {
      store_name: 'Supermercado Demo',
      purchase_date: today,
      currency: 'EUR',
      items: [
        {
          raw_name: 'L.ENT.PASC.1L',
          normalized_name: 'Leche Entera 1L',
          category: 'Lácteos y Huevos',
          storage_location: 'Nevera',
          quantity: 2,
          unit: 'litro',
          estimated_cost: 2.10,
          default_shelf_life_days: 7,
        },
        {
          raw_name: 'PLATANO CANARIAS KG',
          normalized_name: 'Plátanos de Canarias',
          category: 'Frutas y Verduras',
          storage_location: 'Frutero',
          quantity: 1.2,
          unit: 'kg',
          estimated_cost: 2.45,
          default_shelf_life_days: 4,
        },
        {
          raw_name: 'PECHUGA POLLO FILETES',
          normalized_name: 'Pechuga de Pollo Fileteada',
          category: 'Carnes y Aves',
          storage_location: 'Nevera',
          quantity: 0.6,
          unit: 'kg',
          estimated_cost: 4.80,
          default_shelf_life_days: 2,
        },
        {
          raw_name: 'ARROZ REDONDO 1KG',
          normalized_name: 'Arroz Redondo 1kg',
          category: 'Despensa y Granos',
          storage_location: 'Despensa Seca',
          quantity: 1,
          unit: 'paquete',
          estimated_cost: 1.35,
          default_shelf_life_days: 180,
        },
        {
          raw_name: 'SALMON FRESCO LOMOS',
          normalized_name: 'Lomos de Salmón Fresco',
          category: 'Pescados y Mariscos',
          storage_location: 'Nevera',
          quantity: 0.4,
          unit: 'kg',
          estimated_cost: 6.50,
          default_shelf_life_days: 2,
        },
      ],
    };
  }

  const ai = getGeminiClient();

  const contents: any[] = [];

  if (options.imageBuffer && options.mimeType) {
    contents.push({
      inlineData: {
        data: options.imageBuffer.toString('base64'),
        mimeType: options.mimeType,
      },
    });
  }

  const todayStr = new Date().toISOString().split('T')[0];

  if (options.text) {
    contents.push({
      text: `Fecha actual de hoy: ${todayStr}.\nPor favor analiza esta lista/compra dictada o transcrita:\n"${options.text}"\nRecuerda que la fecha de compra debe ser hoy (${todayStr}) y las fechas de caducidad deben ser futuras a partir de hoy.`,
    });
  } else {
    contents.push({
      text: `Fecha actual de referencia: ${todayStr}.\nPor favor analiza este ticket de compra y extrae los alimentos comestibles según las instrucciones. Si el ticket no indica año o fecha explícita, usa como fecha de compra ${todayStr}.`,
    });
  }

  const dynamicInstruction = `${SYSTEM_INSTRUCTION}\n\nIMPORTANTE: La fecha actual del sistema es ${todayStr}. Usa siempre esta fecha (${todayStr}) como año y fecha base de referencia. Nunca devuelvas fechas de años anteriores como 2023 o 2024.`;

  const response = await generateWithFallback({
    contents,
    config: {
      systemInstruction: dynamicInstruction,
      responseMimeType: 'application/json',
      responseJsonSchema: ticketExtractionJsonSchema,
      temperature: 0.2,
    },
  });

  if (!response.text) {
    throw new Error('Gemini no devolvió texto en la respuesta');
  }

  const parsed = JSON.parse(response.text) as TicketExtractionResponse;
  return parsed;
}
