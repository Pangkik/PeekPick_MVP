import { z } from 'zod';

export const ItemConditionSchema = z.enum(['brand_new', 'like_new', 'gently_used', 'well_loved']);

export const ItemSchema = z.object({
    id: z.string().uuid(),
    user_id: z.string().uuid(),
    title: z.string().min(5).max(80),
    description: z.string().max(500).optional(),
    category: z.string().min(1).max(50),
    subcategory: z.string().max(50).optional(),
    condition: ItemConditionSchema,
    photos: z.array(z.string().url()).min(1).max(5),
    tags: z.array(z.string()).max(5).default([]),
    status: z.enum(['active', 'paused', 'traded', 'removed']).default('active'),
    created_at: z.date(),
    updated_at: z.date()
});

export const CreateItemInputSchema = ItemSchema.omit({
    id: true,
    user_id: true,
    status: true,
    created_at: true,
    updated_at: true
});

export type ItemCondition = z.infer<typeof ItemConditionSchema>;
export type Item = z.infer<typeof ItemSchema>;
export type CreateItemInput = z.infer<typeof CreateItemInputSchema>;
