import { Server, Socket } from 'socket.io';
import { db } from '../db/client';
import { messages } from '../db/schema';
import { verifyToken } from '../lib/jwt';

export function setupChatSocket(io: Server) {
    io.on('connection', (socket: Socket) => {

        // Auth guard for sockets
        const token = socket.handshake.auth.token;
        if (!token) {
            socket.disconnect();
            return;
        }

        try {
            const decoded = verifyToken(token) as { id: string };
            (socket as any).userId = decoded.id;
        } catch {
            socket.disconnect();
            return;
        }

        // Join a match room
        socket.on('joinMatch', (matchId: string) => {
            socket.join(`match_${matchId}`);
        });

        // Handle incoming messages
        socket.on('sendMessage', async (data: { matchId: string, content: string, type?: string }) => {
            const userId = (socket as any).userId;

            const [msg] = await db.insert(messages).values({
                match_id: data.matchId,
                sender_id: userId,
                content: data.content,
                type: data.type || 'text',
            }).returning();

            // Emit to everyone in the room (including sender)
            io.to(`match_${data.matchId}`).emit('newMessage', msg);
        });
    });
}
