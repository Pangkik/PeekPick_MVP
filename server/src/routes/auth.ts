import { FastifyInstance } from 'fastify';
import { registerUser, loginUser } from '../services/auth.service';

export default async function authRoutes(fastify: FastifyInstance) {
    fastify.post('/register', async (request, reply) => {
        try {
            const result = await registerUser(request.body);
            reply.status(201).send(result);
        } catch (err: any) {
            reply.status(400).send({ error: err.message });
        }
    });

    fastify.post('/login', async (request, reply) => {
        try {
            const result = await loginUser(request.body);
            reply.send(result);
        } catch (err: any) {
            reply.status(401).send({ error: err.message });
        }
    });
}
