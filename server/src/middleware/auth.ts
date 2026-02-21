import { FastifyReply, FastifyRequest } from 'fastify';
import { verifyToken } from '../lib/jwt';

export async function authenticate(request: FastifyRequest, reply: FastifyReply) {
    try {
        const authHeader = request.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return reply.code(401).send({ error: 'Unauthorized: Missing or invalid token' });
        }

        const token = authHeader.split(' ')[1];
        const decoded = verifyToken(token) as { id: string };

        // Attach user id to the request for subsequent handlers
        (request as any).user = { id: decoded.id };
    } catch (error) {
        return reply.code(401).send({ error: 'Unauthorized: Invalid or expired token' });
    }
}
