import { z } from 'zod';

export const rescueRecipesRequestSchema = z.object({
  expiring_within_days: z.number().int().min(1).max(30).default(5),
  max_prep_time_minutes: z.number().int().min(5).max(180).optional(),
  excluded_item_ids: z.array(z.string().uuid()).default([]),
  dietary_preferences: z.string().max(200).optional(),
});

export const deductRecipeRequestSchema = z.object({
  recipe_id: z.string().min(1, 'ID de receta requerido'),
  recipe_title: z.string().min(1, 'Título de receta requerido'),
  items: z.array(
    z.object({
      item_id: z.string().uuid('ID de item inválido'),
      used_quantity: z.number().positive('La cantidad a descontar debe ser mayor a 0'),
    })
  ).min(1, 'Debe incluir al menos un item para descontar'),
});

export type RescueRecipesRequest = z.infer<typeof rescueRecipesRequestSchema>;
export type DeductRecipeRequest = z.infer<typeof deductRecipeRequestSchema>;
