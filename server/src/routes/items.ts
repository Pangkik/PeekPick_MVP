import { FastifyInstance } from 'fastify';
import { db } from '../db/client';
import { items, users } from '../db/schema';
import { eq, desc } from 'drizzle-orm';
import { authenticate } from '../middleware/auth';

export default async function itemRoutes(fastify: FastifyInstance) {

    // Create Item (Guided First-Item Upload)
    fastify.post('/', { preHandler: [authenticate] }, async (request, reply) => {
        const userId = (request as any).user.id;
        const body: any = request.body;

        const [newItem] = await db.insert(items).values({
            user_id: userId,
            title: body.title,
            description: body.description,
            category: body.category,
            subcategory: body.subcategory,
            condition: body.condition,
            photos: body.photos || [],
            thumbnails: body.thumbnails || [],
            tags: body.tags || [],
        }).returning();

        return reply.code(201).send(newItem);
    });

    // Get single item detail
    fastify.get('/:id', async (request, reply) => {
        const { id } = request.params as { id: string };
        const [item] = await db.select().from(items).where(eq(items.id, id));

        if (!item) {
            return reply.code(404).send({ error: "Item not found" });
        }

        const [owner] = await db.select({ name: users.name, avg_rating: users.avg_rating, avatar_url: users.avatar_url }).from(users).where(eq(users.id, item.user_id));
        return { ...item, owner };
    });

    // Get user's items for Profile screen
    fastify.get('/user/:userId', async (request, reply) => {
        const { userId } = request.params as { userId: string };
        const userItems = await db.select().from(items).where(eq(items.user_id, userId)).orderBy(desc(items.created_at));
        return userItems;
    });

    // Update item status
    fastify.put('/:id/status', { preHandler: [authenticate] }, async (request, reply) => {
        const userId = (request as any).user.id;
        const { id } = request.params as { id: string };
        const { status } = request.body as { status: string };

        const [updated] = await db.update(items)
            .set({ status, updated_at: new Date() })
            .where(eq(items.id, id))
            .returning();

        return updated;
    });
}
