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
