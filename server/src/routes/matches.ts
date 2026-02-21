import { FastifyInstance } from 'fastify';
import { db } from '../db/client';
import { matches, messages, items, users } from '../db/schema';
import { eq, or } from 'drizzle-orm';
import { authenticate } from '../middleware/auth';

export default async function matchRoutes(fastify: FastifyInstance) {

    // Get all active matches for current user
    fastify.get('/', { preHandler: [authenticate] }, async (request, reply) => {
        const userId = (request as any).user.id;

        const userMatches = await db.select()
            .from(matches)
            .where(or(
                eq(matches.user_a_id, userId),
                eq(matches.user_b_id, userId)
            ));

        return userMatches;
    });

    // Get specific match detail
    fastify.get('/:id', { preHandler: [authenticate] }, async (request, reply) => {
        const { id } = request.params as { id: string };
        const [match] = await db.select().from(matches).where(eq(matches.id, id));

        if (!match) return reply.code(404).send({ error: 'Match not found' });
        return match;
    });

    // Update Trade Status
    fastify.put('/:id/status', { preHandler: [authenticate] }, async (request, reply) => {
        const { id } = request.params as { id: string };
        const { status } = request.body as { status: string };

        const [updated] = await db.update(matches)
            .set({ status, updated_at: new Date() })
            .where(eq(matches.id, id))
            .returning();

        return updated;
    });
}
