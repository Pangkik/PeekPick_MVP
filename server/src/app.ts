import Fastify from 'fastify';
import cors from '@fastify/cors';
import multipart from '@fastify/multipart';
import rateLimit from '@fastify/rate-limit';
import { Server } from 'socket.io';

// Routes
import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import itemRoutes from './routes/items';
import swipeRoutes from './routes/swipe';
import matchRoutes from './routes/matches';
import messageRoutes from './routes/messages';
import wishlistRoutes from './routes/wishlist';

import { setupChatSocket } from './websocket/chat.handler';

const app = Fastify({ logger: true });

// Setup Socket.IO
const io = new Server(app.server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST']
    }
});
setupChatSocket(io);

app.register(cors, { origin: '*' });

app.register(multipart, {
    limits: {
        fileSize: 1024 * 1024 * 5, // 5MB limit
    }
});

app.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute'
});

// Register REST Routes
app.register(authRoutes, { prefix: '/api/auth' });
app.register(userRoutes, { prefix: '/api/users' });
app.register(itemRoutes, { prefix: '/api/items' });
app.register(swipeRoutes, { prefix: '/api/swipe' });
app.register(matchRoutes, { prefix: '/api/matches' });
app.register(messageRoutes, { prefix: '/api/messages' });
app.register(wishlistRoutes, { prefix: '/api/wishlist' });

app.get('/health', async () => {
    return { status: 'ok', timestamp: new Date().toISOString() };
});

const start = async () => {
    try {
        await app.listen({ port: parseInt(process.env.PORT || '8080', 10), host: '0.0.0.0' });
        console.log(`Server running at http://localhost:${process.env.PORT || 8080}`);
    } catch (err) {
        app.log.error(err);
        process.exit(1);
    }
};

start();
