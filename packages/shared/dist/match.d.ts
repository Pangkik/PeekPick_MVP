import { z } from 'zod';
export declare const SwipeDirectionSchema: z.ZodEnum<["right", "left", "super"]>;
export declare const SwipeSchema: z.ZodObject<{
    id: z.ZodString;
    swiper_id: z.ZodString;
    item_id: z.ZodString;
    item_owner_id: z.ZodString;
    direction: z.ZodEnum<["right", "left", "super"]>;
    created_at: z.ZodDate;
}, "strip", z.ZodTypeAny, {
    id: string;
    created_at: Date;
    swiper_id: string;
    item_id: string;
    item_owner_id: string;
    direction: "right" | "left" | "super";
}, {
    id: string;
    created_at: Date;
    swiper_id: string;
    item_id: string;
    item_owner_id: string;
    direction: "right" | "left" | "super";
}>;
export declare const MatchStatusSchema: z.ZodEnum<["matched", "negotiating", "agreed", "meetup_scheduled", "completed", "cancelled", "reviewed"]>;
export declare const MatchSchema: z.ZodObject<{
    id: z.ZodString;
    user_a_id: z.ZodString;
    user_b_id: z.ZodString;
    item_a_id: z.ZodString;
    item_b_id: z.ZodString;
    status: z.ZodEnum<["matched", "negotiating", "agreed", "meetup_scheduled", "completed", "cancelled", "reviewed"]>;
    meetup_date: z.ZodOptional<z.ZodDate>;
    meetup_location: z.ZodOptional<z.ZodString>;
    cancelled_by: z.ZodOptional<z.ZodString>;
    cancel_reason: z.ZodOptional<z.ZodString>;
    created_at: z.ZodDate;
    updated_at: z.ZodDate;
}, "strip", z.ZodTypeAny, {
    id: string;
    created_at: Date;
    updated_at: Date;
    status: "matched" | "negotiating" | "agreed" | "meetup_scheduled" | "completed" | "cancelled" | "reviewed";
    user_a_id: string;
    user_b_id: string;
    item_a_id: string;
    item_b_id: string;
    meetup_date?: Date | undefined;
    meetup_location?: string | undefined;
    cancelled_by?: string | undefined;
    cancel_reason?: string | undefined;
}, {
    id: string;
    created_at: Date;
    updated_at: Date;
    status: "matched" | "negotiating" | "agreed" | "meetup_scheduled" | "completed" | "cancelled" | "reviewed";
    user_a_id: string;
    user_b_id: string;
    item_a_id: string;
    item_b_id: string;
    meetup_date?: Date | undefined;
    meetup_location?: string | undefined;
    cancelled_by?: string | undefined;
    cancel_reason?: string | undefined;
}>;
export type SwipeDirection = z.infer<typeof SwipeDirectionSchema>;
export type Swipe = z.infer<typeof SwipeSchema>;
export type MatchStatus = z.infer<typeof MatchStatusSchema>;
export type Match = z.infer<typeof MatchSchema>;
