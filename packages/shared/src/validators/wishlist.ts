import { z } from 'zod';

export const WishlistStatusSchema = z.enum(['active', 'fulfilled', 'expired']);

export const WishlistRequestSchema = z.object({
    id: z.string().uuid(),
    user_id: z.string().uuid(),
    description: z.string().min(5).max(300),
    category: z.string().min(1).max(50),
    photo_url: z.string().url().optional(),
    status: WishlistStatusSchema.default('active'),
    expires_at: z.date(),
    created_at: z.date()
});

export const WishlistResponseSchema = z.object({
    id: z.string().uuid(),
    request_id: z.string().uuid(),
    responder_id: z.string().uuid(),
    item_id: z.string().uuid(),
    message: z.string().max(200).optional(),
    status: z.enum(['pending', 'accepted', 'declined']).default('pending'),
    created_at: z.date()
});

export type WishlistStatus = z.infer<typeof WishlistStatusSchema>;
export type WishlistRequest = z.infer<typeof WishlistRequestSchema>;
export type WishlistResponse = z.infer<typeof WishlistResponseSchema>;
