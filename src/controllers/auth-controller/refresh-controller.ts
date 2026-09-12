import type { Request, Response } from "express";
import pool from "../../db/pool.js";
import { createToken } from "../util-functions.js";
import bcrypt from 'bcrypt';

export default async function refresh(req: Request, res: Response) {
    let { sessionId, userId, refreshToken } = req.body;
    if (!sessionId || !userId || !refreshToken) return res.status(400).json({ err: 'Incomplete feilds provided required: userId,sessionId and refreshToken' });
    sessionId = sessionId.trim();
    userId = userId.trim();
    const previousRefreshToken = refreshToken.trim();

    if (!sessionId || !userId || !previousRefreshToken) return res.status(400).json({ err: 'Incomplete feilds provided required: userId,sessionId and refreshToken' });

    try {
        const userInfo = await pool.query('SELECT id FROM users WHERE id=$1;', [userId]);
        if (!userInfo.rows[0]) return res.status(401).json({ err: 'Create an account to access this route' });

        const sessionInfo = await pool.query('SELECT id,token_hash,expires_at FROM refresh_tokens WHERE user_id=$1 AND id=$2', [userId, sessionId]);
        if (!sessionInfo.rows[0]) return res.status(404).json({ err: 'No sessions exist please login with your account to proceed' });
        const session = sessionInfo.rows[0];

        if (new Date(session.expires_at) < new Date()) {
            return res.status(401).json({ err: 'Session expired please login again' });
        }

        const isValidRefreshToken = await bcrypt.compare(previousRefreshToken, session.token_hash);
        if (!isValidRefreshToken) return res.status(401).json({ err: 'The refreshToken provided seems to have been expired' });

        const { accessToken, refreshToken, refreshTokenHash } = await createToken(userId);
        await pool.query('UPDATE refresh_tokens SET token_hash=$1 WHERE id=$2 AND user_id=$3', [refreshTokenHash, session.id, userId]);

        const resObj = {
            userId: userId,
            accessToken: accessToken,
            refreshToken: refreshToken,
            sessionId: session.id
        }
        return res.status(200).json({ res: resObj });

    } catch (err) {
        return res.status(500).json({ err: 'Something went wrong try again later' });
    }
}


