import { db } from '../db/client';
import { users } from '../db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { generateToken } from '../lib/jwt';
import { UserSchema } from '@peekpick/shared/src/validators/user';

export async function registerUser({ email, password, name }: any) {
    const existingUser = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (existingUser.length > 0) {
        throw new Error('Email already registered');
    }

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    const [newUser] = await db.insert(users).values({
        email,
        password_hash,
        name,
        auth_provider: 'email',
    }).returning();

    const token = generateToken({ id: newUser.id }, '30d'); // simplified for MVP

    return { user: UserSchema.parse(newUser), token };
}

export async function loginUser({ email, password }: any) {
    const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);

    if (!user || !user.password_hash) {
        throw new Error('Invalid email or password');
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
        throw new Error('Invalid email or password');
    }

    const token = generateToken({ id: user.id }, '30d');

    return { user: UserSchema.parse(user), token };
}
