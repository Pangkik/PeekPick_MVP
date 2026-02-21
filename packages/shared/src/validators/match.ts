import { z } from 'zod';

export const SwipeDirectionSchema = z.enum(['right', 'left', 'super']);

export const SwipeSchema = z.object({
    id: z.string().uuid(),
    swiper_id: z.string().uuid(),
    item_id: z.string().uuid(),
    item_owner_id: z.string().uuid(),
    direction: SwipeDirectionSchema,
    created_at: z.date()
});

export const MatchStatusSchema = z.enum([
    'matched',
    'negotiating',
    'agreed',
    'meetup_scheduled',
    'completed',
    'cancelled',
    'reviewed'
]);

export const MatchSchema = z.object({
    id: z.string().uuid(),
    user_a_id: z.string().uuid(),
    user_b_id: z.string().uuid(),
    item_a_id: z.string().uuid(),
    item_b_id: z.string().uuid(),
    status: MatchStatusSchema,
    meetup_date: z.date().optional(),
    meetup_location: z.string().optional(),
    cancelled_by: z.string().uuid().optional(),
    cancel_reason: z.string().optional(),
    created_at: z.date(),
    updated_at: z.date()
});

export type SwipeDirection = z.infer<typeof SwipeDirectionSchema>;
export type Swipe = z.infer<typeof SwipeSchema>;
export type MatchStatus = z.infer<typeof MatchStatusSchema>;
export type Match = z.infer<typeof MatchSchema>;
