import rateLimit from "express-rate-limit";
const isTestEnv = () => process.env.NODE_ENV === 'test';
export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5,
    message: { err: 'Too many attempts, please try again later' },
    standardHeaders: true,
    legacyHeaders: false,
    skip: isTestEnv
});

export const refreshLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 30,
    message: { err: 'Too many requests, please try again later' },
    standardHeaders: true,
    legacyHeaders: false,
    skip: isTestEnv
});

export const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 300, // !generous — NOT FIXED I WILL CHANGE LATER
    message: { err: 'Too many requests, please try again later' },
    standardHeaders: true,
    legacyHeaders: false,
});

