import { FastifyInstance } from 'fastify';
import { db } from '../db/client';
import { messages, matches } from '../db/schema';
import { eq, and } from 'drizzle-orm';
import { authenticate } from '../middleware/auth';

export default async function messageRoutes(fastify: FastifyInstance) {

    // Get chat history for a match
    fastify.get('/match/:matchId', { preHandler: [authenticate] }, async (request, reply) => {
        const { matchId } = request.params as { matchId: string };
        const userId = (request as any).user.id;

        // Verify user is part of the match
        const [match] = await db.select().from(matches).where(eq(matches.id, matchId));
        if (!match || (match.user_a_id !== userId && match.user_b_id !== userId)) {
            return reply.code(403).send({ error: 'Forbidden' });
        }

        const history = await db.select().from(messages).where(eq(messages.match_id, matchId)).orderBy(messages.created_at);
        return history;
    });

    // Post new REST message (Socket.IO will also handle this in real-time)
    fastify.post('/match/:matchId', { preHandler: [authenticate] }, async (request, reply) => {
        const { matchId } = request.params as { matchId: string };
        const { content, type } = request.body as { content: string, type?: string };
        const userId = (request as any).user.id;

        const [msg] = await db.insert(messages).values({
            match_id: matchId,
            sender_id: userId,
            content,
            type: type || 'text'
        }).returning();

        return reply.status(201).send(msg);
    });
}
