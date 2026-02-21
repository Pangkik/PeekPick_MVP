"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MatchSchema = exports.MatchStatusSchema = exports.SwipeSchema = exports.SwipeDirectionSchema = void 0;
const zod_1 = require("zod");
exports.SwipeDirectionSchema = zod_1.z.enum(['right', 'left', 'super']);
exports.SwipeSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    swiper_id: zod_1.z.string().uuid(),
    item_id: zod_1.z.string().uuid(),
    item_owner_id: zod_1.z.string().uuid(),
    direction: exports.SwipeDirectionSchema,
    created_at: zod_1.z.date()
});
exports.MatchStatusSchema = zod_1.z.enum([
    'matched',
    'negotiating',
    'agreed',
    'meetup_scheduled',
    'completed',
    'cancelled',
    'reviewed'
]);
exports.MatchSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    user_a_id: zod_1.z.string().uuid(),
    user_b_id: zod_1.z.string().uuid(),
    item_a_id: zod_1.z.string().uuid(),
    item_b_id: zod_1.z.string().uuid(),
    status: exports.MatchStatusSchema,
    meetup_date: zod_1.z.date().optional(),
    meetup_location: zod_1.z.string().optional(),
    cancelled_by: zod_1.z.string().uuid().optional(),
    cancel_reason: zod_1.z.string().optional(),
    created_at: zod_1.z.date(),
    updated_at: zod_1.z.date()
});
