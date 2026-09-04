import { z } from 'zod';
import { VALID_UNITS } from '@/types/inventory';

export const inventoryItemSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido').max(100),
  storage_location_id: z.string().uuid('ID de ubicación inválido'),
  category_id: z.string().uuid().nullable().optional(),
  quantity: z.number().min(0.01, 'La cantidad debe ser mayor a 0'),
  unit: z.enum(VALID_UNITS as [string, ...string[]]),
  purchase_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato YYYY-MM-DD requerido'),
  expiration_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato YYYY-MM-DD requerido'),
  estimated_cost: z.number().min(0).nullable().optional(),
});

export const batchInventoryItemSchema = z.object({
  items: z.array(inventoryItemSchema).min(1, 'Debe incluir al menos 1 producto'),
});

export const updateInventoryItemSchema = inventoryItemSchema.partial().extend({
  status: z.enum(['active', 'consumed', 'wasted']).optional(),
});

export type InventoryItemInput = z.infer<typeof inventoryItemSchema>;
export type BatchInventoryItemInput = z.infer<typeof batchInventoryItemSchema>;
export type UpdateInventoryItemInput = z.infer<typeof updateInventoryItemSchema>;
