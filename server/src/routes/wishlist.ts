import { FastifyInstance } from 'fastify';
import { db } from '../db/client';
import { wishlistRequests, wishlistResponses, users } from '../db/schema';
import { eq, desc, and } from 'drizzle-orm';
import { authenticate } from '../middleware/auth';

export default async function wishlistRoutes(fastify: FastifyInstance) {

    // List all active requests
    fastify.get('/', async (request, reply) => {
        // MVP: Just returning all active. Phase 2: filter by PostGIS radius
        const requests = await db.select({
            id: wishlistRequests.id,
            description: wishlistRequests.description,
            category: wishlistRequests.category,
            created_at: wishlistRequests.created_at,
            user_name: users.name,
            user_avatar: users.avatar_url,
            user_rating: users.avg_rating
        })
            .from(wishlistRequests)
            .innerJoin(users, eq(users.id, wishlistRequests.user_id))
            .where(eq(wishlistRequests.status, 'active'))
            .orderBy(desc(wishlistRequests.created_at));

        return requests;
    });

    // Post a new request
    fastify.post('/', { preHandler: [authenticate] }, async (request, reply) => {
        const userId = (request as any).user.id;
        const { description, category, photo_url } = request.body as any;

        const [newReq] = await db.insert(wishlistRequests).values({
            user_id: userId,
            description,
            category,
            photo_url
        }).returning();

        return reply.status(201).send(newReq);
    });

    // Respond "I have this!"
    fastify.post('/:id/respond', { preHandler: [authenticate] }, async (request, reply) => {
        const { id } = request.params as { id: string };
        const { item_id, message } = request.body as any;
        const userId = (request as any).user.id;

        const [response] = await db.insert(wishlistResponses).values({
            request_id: id,
            responder_id: userId,
            item_id,
            message
        }).returning();

        return reply.status(201).send(response);
    });
}
