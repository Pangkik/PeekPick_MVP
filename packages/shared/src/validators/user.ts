import { z } from 'zod';

export const UserSchema = z.object({
    id: z.string().uuid(),
    email: z.string().email().optional(),
    phone: z.string().optional(),
    name: z.string().min(1).max(100),
    avatar_url: z.string().url().optional(),
    bio: z.string().max(160).optional(),
    city: z.string().max(100).optional(),
    region: z.string().max(100).optional(),
    country: z.string().max(50).default('PH'),
    trade_radius_km: z.number().int().min(1).max(100).default(10),
    avg_rating: z.number().min(0).max(5).default(0.0),
    total_trades: z.number().int().min(0).default(0),
    auth_provider: z.enum(['email', 'phone', 'google', 'facebook']).default('email'),
    created_at: z.date(),
    updated_at: z.date(),
});

export const UserPreferencesSchema = z.object({
    have_categories: z.array(z.string()).min(3, "Select at least 3 categories you have"),
    want_categories: z.array(z.string()).min(3, "Select at least 3 categories you want"),
    condition_pref: z.array(z.enum(['brand_new', 'like_new', 'gently_used', 'well_loved', 'any'])).default(['any']),
    trade_style: z.array(z.enum(['one_for_one', 'bundle', 'open_to_offers'])).default(['one_for_one', 'open_to_offers'])
});

export type User = z.infer<typeof UserSchema>;
export type UserPreferences = z.infer<typeof UserPreferencesSchema>;
