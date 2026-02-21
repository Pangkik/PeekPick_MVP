"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateItemInputSchema = exports.ItemSchema = exports.ItemConditionSchema = void 0;
const zod_1 = require("zod");
exports.ItemConditionSchema = zod_1.z.enum(['brand_new', 'like_new', 'gently_used', 'well_loved']);
exports.ItemSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    user_id: zod_1.z.string().uuid(),
    title: zod_1.z.string().min(5).max(80),
    description: zod_1.z.string().max(500).optional(),
    category: zod_1.z.string().min(1).max(50),
    subcategory: zod_1.z.string().max(50).optional(),
    condition: exports.ItemConditionSchema,
    photos: zod_1.z.array(zod_1.z.string().url()).min(1).max(5),
    tags: zod_1.z.array(zod_1.z.string()).max(5).default([]),
    status: zod_1.z.enum(['active', 'paused', 'traded', 'removed']).default('active'),
    created_at: zod_1.z.date(),
    updated_at: zod_1.z.date()
});
exports.CreateItemInputSchema = exports.ItemSchema.omit({
    id: true,
    user_id: true,
    status: true,
    created_at: true,
    updated_at: true
});
