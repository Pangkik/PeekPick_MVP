"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WishlistResponseSchema = exports.WishlistRequestSchema = exports.WishlistStatusSchema = void 0;
const zod_1 = require("zod");
exports.WishlistStatusSchema = zod_1.z.enum(['active', 'fulfilled', 'expired']);
exports.WishlistRequestSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    user_id: zod_1.z.string().uuid(),
    description: zod_1.z.string().min(5).max(300),
    category: zod_1.z.string().min(1).max(50),
    photo_url: zod_1.z.string().url().optional(),
    status: exports.WishlistStatusSchema.default('active'),
    expires_at: zod_1.z.date(),
    created_at: zod_1.z.date()
});
exports.WishlistResponseSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    request_id: zod_1.z.string().uuid(),
    responder_id: zod_1.z.string().uuid(),
    item_id: zod_1.z.string().uuid(),
    message: zod_1.z.string().max(200).optional(),
    status: zod_1.z.enum(['pending', 'accepted', 'declined']).default('pending'),
    created_at: zod_1.z.date()
});
