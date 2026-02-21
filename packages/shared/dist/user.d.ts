import { z } from 'zod';
export declare const UserSchema: z.ZodObject<{
    id: z.ZodString;
    email: z.ZodOptional<z.ZodString>;
    phone: z.ZodOptional<z.ZodString>;
    name: z.ZodString;
    avatar_url: z.ZodOptional<z.ZodString>;
    bio: z.ZodOptional<z.ZodString>;
    city: z.ZodOptional<z.ZodString>;
    region: z.ZodOptional<z.ZodString>;
    country: z.ZodDefault<z.ZodString>;
    trade_radius_km: z.ZodDefault<z.ZodNumber>;
    avg_rating: z.ZodDefault<z.ZodNumber>;
    total_trades: z.ZodDefault<z.ZodNumber>;
    auth_provider: z.ZodDefault<z.ZodEnum<["email", "phone", "google", "facebook"]>>;
    created_at: z.ZodDate;
    updated_at: z.ZodDate;
}, "strip", z.ZodTypeAny, {
    id: string;
    name: string;
    country: string;
    trade_radius_km: number;
    avg_rating: number;
    total_trades: number;
    auth_provider: "email" | "phone" | "google" | "facebook";
    created_at: Date;
    updated_at: Date;
    email?: string | undefined;
    phone?: string | undefined;
    avatar_url?: string | undefined;
    bio?: string | undefined;
    city?: string | undefined;
    region?: string | undefined;
}, {
    id: string;
    name: string;
    created_at: Date;
    updated_at: Date;
    email?: string | undefined;
    phone?: string | undefined;
    avatar_url?: string | undefined;
    bio?: string | undefined;
    city?: string | undefined;
    region?: string | undefined;
    country?: string | undefined;
    trade_radius_km?: number | undefined;
    avg_rating?: number | undefined;
    total_trades?: number | undefined;
    auth_provider?: "email" | "phone" | "google" | "facebook" | undefined;
}>;
export declare const UserPreferencesSchema: z.ZodObject<{
    have_categories: z.ZodArray<z.ZodString, "many">;
    want_categories: z.ZodArray<z.ZodString, "many">;
    condition_pref: z.ZodDefault<z.ZodArray<z.ZodEnum<["brand_new", "like_new", "gently_used", "well_loved", "any"]>, "many">>;
    trade_style: z.ZodDefault<z.ZodArray<z.ZodEnum<["one_for_one", "bundle", "open_to_offers"]>, "many">>;
}, "strip", z.ZodTypeAny, {
    have_categories: string[];
    want_categories: string[];
    condition_pref: ("brand_new" | "like_new" | "gently_used" | "well_loved" | "any")[];
    trade_style: ("one_for_one" | "bundle" | "open_to_offers")[];
}, {
    have_categories: string[];
    want_categories: string[];
    condition_pref?: ("brand_new" | "like_new" | "gently_used" | "well_loved" | "any")[] | undefined;
    trade_style?: ("one_for_one" | "bundle" | "open_to_offers")[] | undefined;
}>;
export type User = z.infer<typeof UserSchema>;
export type UserPreferences = z.infer<typeof UserPreferencesSchema>;
