import { db } from '../db/client';
import { swipes, matches, items } from '../db/schema';
import { eq, and } from 'drizzle-orm';

export async function recordSwipe(swiper_id: string, item_id: string, direction: 'right' | 'left' | 'super') {
    // 1. Fetch item owner
    const [swipedItem] = await db.select({ owner_id: items.user_id }).from(items).where(eq(items.id, item_id));
    if (!swipedItem) throw new Error('Item not found');

    const item_owner_id = swipedItem.owner_id;

    // 2. Insert Swipe Record
    await db.insert(swipes).values({
        swiper_id,
        item_id,
        item_owner_id,
        direction
    });

    // 3. Match Logic (Only if swipe is right or super)
    if (direction === 'right' || direction === 'super') {
        // Check if the item_owner has ALREADY swiped right/super on ANY item owned by swiper_id
        const existingReciprocalSwipe = await db.select()
            .from(swipes)
            .where(
                and(
                    eq(swipes.swiper_id, item_owner_id),
                    eq(swipes.item_owner_id, swiper_id),
                    // For MVP, if they liked ANY of our items, we match.
                    // We can't guarantee they liked *this* specific item yet, but a mutual interest exists.
                    // Phase 2 will trace exact item-to-item intersections.
                    // For now we just pick the first item of ours they liked.
                )
            ).limit(1);

        const matchExists = existingReciprocalSwipe.filter(s => s.direction === 'right' || s.direction === 'super');

        if (matchExists.length > 0) {
            const reciprocalSwipe = matchExists[0];

            // Mutual interest! Create a trade match.
            const [newMatch] = await db.insert(matches).values({
                user_a_id: swiper_id,
                user_b_id: item_owner_id,
                item_a_id: item_id,          // Swiper wants this item
                item_b_id: reciprocalSwipe.item_id, // Owner wanted this item from swiper
                status: 'matched'
            }).returning();

            return { matched: true, match: newMatch };
        }
    }

    return { matched: false };
}
