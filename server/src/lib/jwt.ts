import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'supersecret_peekpick_key_for_dev_only';

export const generateToken = (payload: object, expiresIn: string = '15m') => {
    return jwt.sign(payload, JWT_SECRET, { expiresIn });
};

export const verifyToken = (token: string) => {
    return jwt.verify(token, JWT_SECRET);
};
