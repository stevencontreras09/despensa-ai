import { GoogleGenAI } from '@google/genai';

let geminiClientInstance: GoogleGenAI | null = null;

export function getGeminiClient(): GoogleGenAI {
  if (!geminiClientInstance) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey.includes('placeholder')) {
      console.warn('GEMINI_API_KEY no está configurada o es un placeholder.');
    }
    geminiClientInstance = new GoogleGenAI({
      apiKey: apiKey || 'dummy-key',
    });
  }
  return geminiClientInstance;
}

export const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-3.7-flash';

function isOverloadedOrRateLimited(err: any): boolean {
  const msg = (err?.message || '').toLowerCase();
  const status = String(err?.status || err?.code || '');
  return (
    status === '503' ||
    status === '429' ||
    status === 'UNAVAILABLE' ||
    status === 'RESOURCE_EXHAUSTED' ||
    msg.includes('503') ||
    msg.includes('high demand') ||
    msg.includes('unavailable') ||
    msg.includes('resource_exhausted') ||
    msg.includes('rate limit') ||
    msg.includes('quota')
  );
}

export async function generateWithFallback(params: {
  contents: any;
  config: any;
  preferredModel?: string;
}) {
  const ai = getGeminiClient();
  const primaryModel = params.preferredModel || GEMINI_MODEL;

  // Lista de modelos resilientes en orden de prioridad
  const candidateModels = [
    primaryModel,
    'gemini-2.5-flash',
    'gemini-2.0-flash',
  ].filter((m, idx, arr) => arr.indexOf(m) === idx);

  let lastError: any = null;

  for (const model of candidateModels) {
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: params.contents,
          config: params.config,
        });
        return response;
      } catch (err: any) {
        lastError = err;
        console.warn(`[Gemini] Intento ${attempt} con modelo "${model}" falló:`, err.message || err);

        if (isOverloadedOrRateLimited(err)) {
          // Breve pausa exponencial antes de reintentar
          await new Promise((resolve) => setTimeout(resolve, 800 * attempt));
        } else {
          // Si no es un error de sobrecarga (ej: formato inválido), pasar al siguiente
          break;
        }
      }
    }
    console.log(`[Gemini] Modelo "${model}" con alta demanda. Probando siguiente modelo de respaldo...`);
  }

  // Extraer mensaje limpio en caso de fallo total
  let friendlyMessage = 'El servicio de IA está experimentando alta demanda. Por favor intenta de nuevo en unos segundos.';
  if (lastError?.message) {
    try {
      const parsed = JSON.parse(lastError.message);
      if (parsed?.error?.message) {
        friendlyMessage = parsed.error.message;
      }
    } catch {
      friendlyMessage = lastError.message;
    }
  }

  throw new Error(friendlyMessage);
}
