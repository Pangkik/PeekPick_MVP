"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserPreferencesSchema = exports.UserSchema = void 0;
const zod_1 = require("zod");
exports.UserSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    email: zod_1.z.string().email().optional(),
    phone: zod_1.z.string().optional(),
    name: zod_1.z.string().min(1).max(100),
    avatar_url: zod_1.z.string().url().optional(),
    bio: zod_1.z.string().max(160).optional(),
    city: zod_1.z.string().max(100).optional(),
    region: zod_1.z.string().max(100).optional(),
    country: zod_1.z.string().max(50).default('PH'),
    trade_radius_km: zod_1.z.number().int().min(1).max(100).default(10),
    avg_rating: zod_1.z.number().min(0).max(5).default(0.0),
    total_trades: zod_1.z.number().int().min(0).default(0),
    auth_provider: zod_1.z.enum(['email', 'phone', 'google', 'facebook']).default('email'),
    created_at: zod_1.z.date(),
    updated_at: zod_1.z.date(),
});
exports.UserPreferencesSchema = zod_1.z.object({
    have_categories: zod_1.z.array(zod_1.z.string()).min(3, "Select at least 3 categories you have"),
    want_categories: zod_1.z.array(zod_1.z.string()).min(3, "Select at least 3 categories you want"),
    condition_pref: zod_1.z.array(zod_1.z.enum(['brand_new', 'like_new', 'gently_used', 'well_loved', 'any'])).default(['any']),
    trade_style: zod_1.z.array(zod_1.z.enum(['one_for_one', 'bundle', 'open_to_offers'])).default(['one_for_one', 'open_to_offers'])
});
