import { Type } from '@google/genai';
import { getGeminiClient, GEMINI_MODEL, generateWithFallback } from './client';
import { RescueRecipe, RescueRecipesResponse } from '@/types/ai';

export const rescueRecipeJsonSchema = {
  type: Type.OBJECT,
  properties: {
    recipes: {
      type: Type.ARRAY,
      description: 'Lista de recetas anti-desperdicio optimizadas para aprovechar alimentos a punto de caducar.',
      items: {
        type: Type.OBJECT,
        properties: {
          id: {
            type: Type.STRING,
            description: 'Identificador único de la receta (ej: recipe_1, recipe_2).',
          },
          title: {
            type: Type.STRING,
            description: 'Nombre apetitoso y claro del plato (ej: Salteado Rápido de Salmón con Arroz y Verduras).',
          },
          description: {
            type: Type.STRING,
            description: 'Breve explicación de 1-2 frases sobre el plato y por qué ayuda a evitar el desperdicio.',
          },
          prep_time_minutes: {
            type: Type.INTEGER,
            description: 'Tiempo total de preparación y cocinado en minutos.',
          },
          difficulty: {
            type: Type.STRING,
            enum: ['Fácil', 'Intermedio', 'Avanzado'],
            description: 'Nivel de dificultad culinaria.',
          },
          rescue_score: {
            type: Type.STRING,
            description: 'Puntuación de rescate que refleja qué tan efectiva es la receta para agotar los alimentos críticos (ej: "95%", "Crítico", "Alto").',
          },
          used_inventory_items: {
            type: Type.ARRAY,
            description: 'Ingredientes tomados directamente del inventario disponible con sus IDs exactos.',
            items: {
              type: Type.OBJECT,
              properties: {
                item_id: {
                  type: Type.STRING,
                  description: 'UUID del item en el inventario actual.',
                },
                name: {
                  type: Type.STRING,
                  description: 'Nombre del ingrediente usado.',
                },
                used_quantity: {
                  type: Type.NUMBER,
                  description: 'Cantidad a descontar del inventario.',
                },
                unit: {
                  type: Type.STRING,
                  description: 'Unidad de medida (ej: kg, litro, unidad, g).',
                },
              },
              required: ['item_id', 'name', 'used_quantity', 'unit'],
            },
          },
          pantry_staples_used: {
            type: Type.ARRAY,
            description: 'Básicos de cocina asumidos en el hogar (ej: sal, aceite de oliva, pimienta, agua, ajo).',
            items: { type: Type.STRING },
          },
          missing_ingredients: {
            type: Type.ARRAY,
            description: 'Ingredientes adicionales opcionales o necesarios que no están en la despensa.',
            items: { type: Type.STRING },
          },
          steps: {
            type: Type.ARRAY,
            description: 'Instrucciones paso a paso numeradas y concisas para la elaboración.',
            items: { type: Type.STRING },
          },
        },
        required: [
          'id',
          'title',
          'description',
          'prep_time_minutes',
          'difficulty',
          'rescue_score',
          'used_inventory_items',
          'pantry_staples_used',
          'missing_ingredients',
          'steps',
        ],
      },
    },
  },
  required: ['recipes'],
};

const SYSTEM_INSTRUCTION = `Eres un chef experto en cocina de aprovechamiento (Zero-Waste cooking) y nutrición de DespensaAI.
Tu objetivo primordial es crear recetas deliciosas y prácticas que AGOTEN O RESCATEN los ingredientes que están más próximos a caducar (con días restantes menores o iguales a 2 días, semáforo rojo o amarillo).

Reglas estrictas:
1. Prioriza de forma agresiva los alimentos en riesgo crítico (los primeros de la lista provista).
2. Debes incluir en used_inventory_items el item_id EXACTO proporcionado para cada ingrediente del inventario.
3. Especifica used_quantity realista (no mayor a la cantidad disponible).
4. Separa claramente los básicos de despensa generales (sal, pimienta, aceite, agua) en pantry_staples_used.
5. Si falta algún ingrediente común para redondear el plato, agrégalo a missing_ingredients.
6. Asigna un rescue_score elevado (ej: "95% Crítico", "85% Alto") si agota los ítems más urgentes.
7. Los pasos (steps) deben ser breves, prácticos y listos para cocinar en casa.`;

export async function generateRescueRecipesWithGemini(options: {
  inventoryItems: Array<{
    id: string;
    name: string;
    quantity: number;
    unit: string;
    expiration_date: string;
    days_remaining: number;
    traffic_light: string;
  }>;
  maxPrepTimeMinutes?: number;
  dietaryPreferences?: string;
}): Promise<RescueRecipesResponse> {
  const apiKey = process.env.GEMINI_API_KEY;

  // Fallback de demostración realista si no hay GEMINI_API_KEY configurada
  if (!apiKey || apiKey.includes('placeholder')) {
    const urgentItems = options.inventoryItems.filter((i) => i.days_remaining <= 5);
    const primaryItem = urgentItems[0] || options.inventoryItems[0] || {
      id: '00000000-0000-0000-0000-000000000001',
      name: 'Salmón Fresco',
      quantity: 0.4,
      unit: 'kg',
    };
    const secondaryItem = urgentItems[1] || options.inventoryItems[1] || {
      id: '00000000-0000-0000-0000-000000000002',
      name: 'Arroz Redondo',
      quantity: 1,
      unit: 'paquete',
    };

    return {
      recipes: [
        {
          id: 'rescue_recipe_1',
          title: `Salteado Expreso de ${primaryItem.name} con ${secondaryItem.name}`,
          description: `Una receta rápida y deliciosa diseñada para rescatar ${primaryItem.name} antes de que caduque.`,
          prep_time_minutes: Math.min(25, options.maxPrepTimeMinutes || 25),
          difficulty: 'Fácil',
          rescue_score: '95% Crítico',
          used_inventory_items: [
            {
              item_id: primaryItem.id,
              name: primaryItem.name,
              used_quantity: Number(primaryItem.quantity),
              unit: primaryItem.unit,
            },
            {
              item_id: secondaryItem.id,
              name: secondaryItem.name,
              used_quantity: Math.min(Number(secondaryItem.quantity), 0.5),
              unit: secondaryItem.unit,
            },
          ],
          pantry_staples_used: ['Aceite de oliva', 'Sal', 'Pimienta negra', 'Diente de ajo'],
          missing_ingredients: ['Salsa de soja (opcional)'],
          steps: [
            `Cortar ${primaryItem.name} en dados y salpimentar al gusto.`,
            `En una sartén caliente con aceite de oliva, dorar el ajo y saltear ${primaryItem.name} durante 4-5 minutos.`,
            `Incorporar ${secondaryItem.name} previamente cocido y saltear todo junto a fuego vivo por 2 minutos.`,
            'Servir de inmediato caliente y disfrutar.',
          ],
        },
      ],
    };
  }

  const ai = getGeminiClient();

  const inventorySummary = options.inventoryItems
    .map(
      (i) =>
        `- ID: ${i.id} | Nombre: ${i.name} | Cantidad: ${i.quantity} ${i.unit} | Vence en: ${i.days_remaining} días (Semáforo: ${i.traffic_light})`
    )
    .join('\n');

  const userPrompt = `Aquí tienes el inventario actual de la despensa ordenado por urgencia de caducidad:\n${inventorySummary}\n\n` +
    (options.maxPrepTimeMinutes ? `Tiempo máximo de preparación: ${options.maxPrepTimeMinutes} minutos.\n` : '') +
    (options.dietaryPreferences ? `Preferencias dietéticas: ${options.dietaryPreferences}.\n` : '') +
    'Por favor genera entre 1 y 3 recetas de rescate anti-desperdicio con salida estructurada JSON.';

  const response = await generateWithFallback({
    contents: [{ text: userPrompt }],
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      responseMimeType: 'application/json',
      responseJsonSchema: rescueRecipeJsonSchema,
      temperature: 0.3,
    },
  });

  if (!response.text) {
    throw new Error('Gemini no generó respuesta de recetas');
  }

  return JSON.parse(response.text) as RescueRecipesResponse;
}
