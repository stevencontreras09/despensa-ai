import { z } from 'zod';
import { isValidInviteCode, normalizeInviteCode } from '@/lib/utils/invite-code';

export const createHouseholdSchema = z.object({
  name: z.string().min(2, 'El nombre del hogar debe tener al menos 2 caracteres').max(50, 'Máximo 50 caracteres'),
});

export const joinHouseholdSchema = z.object({
  invite_code: z
    .string()
    .transform(normalizeInviteCode)
    .refine(isValidInviteCode, {
      message: 'El código de invitación debe ser de exactamente 12 caracteres alfanuméricos',
    }),
});

export type CreateHouseholdInput = z.infer<typeof createHouseholdSchema>;
export type JoinHouseholdInput = z.infer<typeof joinHouseholdSchema>;
