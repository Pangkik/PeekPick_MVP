import { pgTable, uuid, varchar, text, timestamp, boolean, decimal, integer, AnyPgColumn } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
    id: uuid("id").defaultRandom().primaryKey(),
    email: varchar("email", { length: 255 }).unique(),
    phone: varchar("phone", { length: 20 }).unique(),
    password_hash: varchar("password_hash", { length: 255 }),
    name: varchar("name", { length: 100 }).notNull(),
    avatar_url: varchar("avatar_url", { length: 500 }),
    bio: varchar("bio", { length: 160 }),
    city: varchar("city", { length: 100 }),
    region: varchar("region", { length: 100 }),
    country: varchar("country", { length: 50 }).default('PH'),
    trade_radius_km: integer("trade_radius_km").default(10),
    reputation_score: decimal("reputation_score", { precision: 3, scale: 2 }).default("0.00"),
    avg_rating: decimal("avg_rating", { precision: 3, scale: 2 }).default("0.00"),
    total_trades: integer("total_trades").default(0),
    is_verified: boolean("is_verified").default(false),
    account_type: varchar("account_type", { length: 20 }).default('individual'),
    auth_provider: varchar("auth_provider", { length: 20 }).default('email'),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const userPreferences = pgTable("user_preferences", {
    id: uuid("id").defaultRandom().primaryKey(),
    user_id: uuid("user_id").references(() => users.id, { onDelete: 'cascade' }),
    have_categories: text("have_categories").array().notNull(),
    want_categories: text("want_categories").array().notNull(),
    condition_pref: text("condition_pref").array().default(['any']),
    trade_style: text("trade_style").array().default(['one_for_one', 'open_to_offers']),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const items = pgTable("items", {
    id: uuid("id").defaultRandom().primaryKey(),
    user_id: uuid("user_id").references(() => users.id, { onDelete: 'cascade' }),
    title: varchar("title", { length: 80 }).notNull(),
    description: varchar("description", { length: 500 }),
    category: varchar("category", { length: 50 }).notNull(),
    subcategory: varchar("subcategory", { length: 50 }),
    condition: varchar("condition", { length: 20 }).notNull(),
    photos: text("photos").array().notNull(),
    thumbnails: text("thumbnails").array(),
    tags: text("tags").array(),
    status: varchar("status", { length: 20 }).default('active'),
    right_swipe_count: integer("right_swipe_count").default(0),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const swipes = pgTable("swipes", {
    id: uuid("id").defaultRandom().primaryKey(),
    swiper_id: uuid("swiper_id").references(() => users.id, { onDelete: 'cascade' }),
    item_id: uuid("item_id").references(() => items.id, { onDelete: 'cascade' }),
    item_owner_id: uuid("item_owner_id").references(() => users.id),
    direction: varchar("direction", { length: 10 }).notNull(),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const matches = pgTable("matches", {
    id: uuid("id").defaultRandom().primaryKey(),
    user_a_id: uuid("user_a_id").references(() => users.id),
    user_b_id: uuid("user_b_id").references(() => users.id),
    item_a_id: uuid("item_a_id").references(() => items.id),
    item_b_id: uuid("item_b_id").references(() => items.id),
    status: varchar("status", { length: 20 }).default('matched'),
    meetup_date: timestamp("meetup_date", { withTimezone: true }),
    meetup_location: varchar("meetup_location", { length: 500 }),
    cancelled_by: uuid("cancelled_by").references(() => users.id),
    cancel_reason: varchar("cancel_reason", { length: 50 }),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const messages = pgTable("messages", {
    id: uuid("id").defaultRandom().primaryKey(),
    match_id: uuid("match_id").references(() => matches.id, { onDelete: 'cascade' }),
    sender_id: uuid("sender_id").references(() => users.id),
    content: text("content").notNull(),
    type: varchar("type", { length: 20 }).default('text'),
    is_read: boolean("is_read").default(false),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const reviews = pgTable("reviews", {
    id: uuid("id").defaultRandom().primaryKey(),
    match_id: uuid("match_id").references(() => matches.id),
    reviewer_id: uuid("reviewer_id").references(() => users.id),
    reviewee_id: uuid("reviewee_id").references(() => users.id),
    rating: integer("rating").notNull(),
    comment: varchar("comment", { length: 300 }).notNull(),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const wishlistRequests = pgTable("wishlist_requests", {
    id: uuid("id").defaultRandom().primaryKey(),
    user_id: uuid("user_id").references(() => users.id, { onDelete: 'cascade' }),
    description: varchar("description", { length: 300 }).notNull(),
    category: varchar("category", { length: 50 }).notNull(),
    photo_url: varchar("photo_url", { length: 500 }),
    status: varchar("status", { length: 20 }).default('active'),
    expires_at: timestamp("expires_at", { withTimezone: true }),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const wishlistResponses = pgTable("wishlist_responses", {
    id: uuid("id").defaultRandom().primaryKey(),
    request_id: uuid("request_id").references(() => wishlistRequests.id, { onDelete: 'cascade' }),
    responder_id: uuid("responder_id").references(() => users.id),
    item_id: uuid("item_id").references(() => items.id),
    message: varchar("message", { length: 200 }),
    status: varchar("status", { length: 20 }).default('pending'),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
});
