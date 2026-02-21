import { FastifyInstance } from 'fastify';
import { db } from '../db/client';
import { users, userPreferences } from '../db/schema';
import { eq } from 'drizzle-orm';
import { authenticate } from '../middleware/auth';

export default async function userRoutes(fastify: FastifyInstance) {
    // Get current user profile
    fastify.get('/me', { preHandler: [authenticate] }, async (request, reply) => {
        const userId = (request as any).user.id;
        const [user] = await db.select().from(users).where(eq(users.id, userId));

        if (!user) {
            return reply.code(404).send({ error: 'User not found' });
        }

        const [preferences] = await db.select().from(userPreferences).where(eq(userPreferences.user_id, userId));
        return { ...user, preferences };
    });

    // Update preferences (Onboarding Step)
    fastify.put('/me/preferences', { preHandler: [authenticate] }, async (request, reply) => {
        const userId = (request as any).user.id;
        const body: any = request.body;

        const [existingPref] = await db.select().from(userPreferences).where(eq(userPreferences.user_id, userId));

        if (existingPref) {
            const [updated] = await db.update(userPreferences).set({
                have_categories: body.have_categories || existingPref.have_categories,
                want_categories: body.want_categories || existingPref.want_categories,
                condition_pref: body.condition_pref || existingPref.condition_pref,
                trade_style: body.trade_style || existingPref.trade_style,
                updated_at: new Date()
            }).where(eq(userPreferences.user_id, userId)).returning();
            return updated;
        } else {
            const [inserted] = await db.insert(userPreferences).values({
                user_id: userId,
                have_categories: body.have_categories || [],
                want_categories: body.want_categories || [],
                condition_pref: body.condition_pref || ['any'],
                trade_style: body.trade_style || ['one_for_one', 'open_to_offers']
            }).returning();
            return inserted;
        }
    });
}
