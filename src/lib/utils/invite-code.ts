/**
 * Genera un código de invitación aleatorio de exactamente 12 caracteres alfanuméricos en mayúsculas.
 * Se utilizan caracteres legibles para evitar confusiones (omite O, 0, I, 1).
 */
const CHARSET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export function generateInviteCode(length = 12): string {
  let result = '';
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * CHARSET.length);
    result += CHARSET[randomIndex];
  }
  return result;
}

/**
 * Valida si un string cumple el formato de código de invitación (12 caracteres alfanuméricos).
 */
export function isValidInviteCode(code: string): boolean {
  if (!code || typeof code !== 'string') return false;
  const clean = code.trim().toUpperCase();
  return /^[A-Z0-9]{12}$/.test(clean);
}

/**
 * Normaliza un código de invitación a mayúsculas sin espacios ni guiones.
 */
export function normalizeInviteCode(code: string): string {
  return code.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
}
