# Circular Passport — Share Captions

Pre-filled captions for when a user shares their Circular Passport milestone. These are the app's built-in growth loop, so the rule is simple: the sharer has to look good, not PeekPick. No app-name-dropping beyond a natural mention, no hashtag stuffing, no "check out this app" energy.

Each caption should populate with the user's real numbers from their Passport — placeholders are marked `{{like this}}`. Keep them short enough to sit on top of a screenshot without crowding it.

---

## Milestone: First swap

> Just made my first swap on PeekPick. One less thing bought new, one less thing thrown out.

**Alt (shorter, for a Story/status):**
> First swap, done. Traded instead of bought.

---

## Milestone: 3 swaps

> 3 swaps in. Getting rid of stuff I don't need, getting stuff I actually want — no cash involved.

**Alt:**
> 3 for 3. Swapping is turning into a habit.

---

## Milestone: 10 swaps

> 10 swaps down. At this point, swapping is just how I get stuff now.

**Alt:**
> Double digits. 10 swaps and counting.

---

## Milestone: CO2 saved

> I've saved {{co2_kg}} kg of CO2 just by swapping instead of buying new. Small trades, real difference.

**Alt (paired with items-reused number, if the app tracks both):**
> {{items_reused}} items kept out of the trash, {{co2_kg}} kg of CO2 saved. Not bad for just swapping stuff I didn't need anymore.

---

## Design/copy notes for implementation

- Pull the real number from the user's account at share time — never show a placeholder or a rounded/inflated figure.
- Default to the plain caption; only show the "alt" version if the surface is character-limited (like a Story) or if giving the user a choice of two.
- Don't auto-insert a link or hashtag into the caption text itself — if a link needs to go anywhere, put it in the image/sticker, not the words, so the caption keeps sounding like the person, not an ad.
- If a user has both an items-reused count and a CO2 number at the same milestone, let them pick which one to lead with — some people care more about "stuff saved," others about the environmental number.

---

## How to use this

- These captions are meant to be wired into the app itself (pre-filled text box when a user hits "Share my Passport"), not posted by Rain as marketing copy.
- Hand this file to whoever builds the share feature — the `{{placeholders}}` mark exactly where real user data needs to be inserted.
- If new milestones get added later (25 swaps, 50 swaps, a waste-diverted milestone), follow the same pattern: short, first-person, numbers-forward, no app self-promotion baked into the sentence.
