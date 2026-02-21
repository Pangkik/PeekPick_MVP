import { z } from 'zod';
export declare const WishlistStatusSchema: z.ZodEnum<["active", "fulfilled", "expired"]>;
export declare const WishlistRequestSchema: z.ZodObject<{
    id: z.ZodString;
    user_id: z.ZodString;
    description: z.ZodString;
    category: z.ZodString;
    photo_url: z.ZodOptional<z.ZodString>;
    status: z.ZodDefault<z.ZodEnum<["active", "fulfilled", "expired"]>>;
    expires_at: z.ZodDate;
    created_at: z.ZodDate;
}, "strip", z.ZodTypeAny, {
    id: string;
    created_at: Date;
    status: "active" | "fulfilled" | "expired";
    user_id: string;
    description: string;
    category: string;
    expires_at: Date;
    photo_url?: string | undefined;
}, {
    id: string;
    created_at: Date;
    user_id: string;
    description: string;
    category: string;
    expires_at: Date;
    status?: "active" | "fulfilled" | "expired" | undefined;
    photo_url?: string | undefined;
}>;
export declare const WishlistResponseSchema: z.ZodObject<{
    id: z.ZodString;
    request_id: z.ZodString;
    responder_id: z.ZodString;
    item_id: z.ZodString;
    message: z.ZodOptional<z.ZodString>;
    status: z.ZodDefault<z.ZodEnum<["pending", "accepted", "declined"]>>;
    created_at: z.ZodDate;
}, "strip", z.ZodTypeAny, {
    id: string;
    created_at: Date;
    status: "pending" | "accepted" | "declined";
    item_id: string;
    request_id: string;
    responder_id: string;
    message?: string | undefined;
}, {
    id: string;
    created_at: Date;
    item_id: string;
    request_id: string;
    responder_id: string;
    message?: string | undefined;
    status?: "pending" | "accepted" | "declined" | undefined;
}>;
export type WishlistStatus = z.infer<typeof WishlistStatusSchema>;
export type WishlistRequest = z.infer<typeof WishlistRequestSchema>;
export type WishlistResponse = z.infer<typeof WishlistResponseSchema>;
