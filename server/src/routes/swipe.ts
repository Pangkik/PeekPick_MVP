import { FastifyInstance } from 'fastify';
import { db } from '../db/client';
import { items, swipes } from '../db/schema';
import { eq, ne } from 'drizzle-orm';
import { authenticate } from '../middleware/auth';
import { recordSwipe } from '../services/swipe.service';

export default async function swipeRoutes(fastify: FastifyInstance) {

    // Get Swipe Stack for User
    fastify.get('/stack', { preHandler: [authenticate] }, async (request, reply) => {
        const userId = (request as any).user.id;
        // MVP Stack: Show any active items that do NOT belong to the swiping user
        // and that the user hasn't swiped on yet.

        // First, get what user has already swiped
        const pastSwipes = await db.select({ item_id: swipes.item_id })
            .from(swipes)
            .where(eq(swipes.swiper_id, userId));
        const swipedItemIds = pastSwipes.map(s => s.item_id);

        // Fetch up to 50 unseen items
        const feed = await db.select()
            .from(items)
            .where(ne(items.user_id, userId))
            .limit(50);

        // Filter out already swiped (In Phase 2, this is done via SQL NOT IN)
        const unseenFeed = feed.filter(item => !swipedItemIds.includes(item.id));

        return unseenFeed;
    });

    // Post Swipe
    fastify.post('/', { preHandler: [authenticate] }, async (request, reply) => {
        const userId = (request as any).user.id;
        const { item_id, direction } = request.body as { item_id: string, direction: 'right' | 'left' | 'super' };

        try {
            const result = await recordSwipe(userId, item_id, direction);
            return reply.send(result); // Returns { matched: boolean, match?: MatchObj }
        } catch (err: any) {
            return reply.status(400).send({ error: err.message });
        }
    });
}
