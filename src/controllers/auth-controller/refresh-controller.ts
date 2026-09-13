import type { Request, Response } from "express";
import pool from "../../db/pool.js";
import { createToken, isNullorUndefined, useCSRF } from "../util-functions.js";
import bcrypt from 'bcrypt';
import { getRefreshTokenExpiry } from "../../Configs/auth-configs.js";

export default async function refresh(req: Request, res: Response) {
    let { userId } = req.body;


    const JsonCookies = req.cookies['refresh-session'];
    let sessionId: string = '';
    let oldRefreshToken: string = '';

    try {
        const cookieObject = JSON.parse(JsonCookies);
        sessionId = cookieObject.sessionId;
        oldRefreshToken = cookieObject.refreshToken;
    } catch {
        return res.status(400).json({ err: 'Invalid data from cookies' });
    };


    if (isNullorUndefined(sessionId, userId, oldRefreshToken)) return res.status(400).json({ err: 'Incomplete feilds provided required: userId,sessionId and refreshToken' });

    sessionId = sessionId.trim();
    userId = userId.trim();
    oldRefreshToken = oldRefreshToken.trim();

    try {
        const { createCSRFToken } = useCSRF();
        const userInfo = await pool.query('SELECT id FROM users WHERE id=$1;', [userId]);
        if (!userInfo.rows[0]) return res.status(401).json({ err: 'Create an account to access this route' });

        const sessionInfo = await pool.query('SELECT id,token_hash,expires_at FROM refresh_tokens WHERE user_id=$1 AND id=$2;', [userId, sessionId]);
        if (!sessionInfo.rows[0]) return res.status(404).json({ err: 'No sessions exist please login with your account to proceed' });

        const session = sessionInfo.rows[0];

        if (new Date(session.expires_at) < new Date()) {
            return res.status(401).json({ err: 'Session expired please login again' });
        };

        const isValidRefreshToken = await bcrypt.compare(oldRefreshToken, session.token_hash);
        if (!isValidRefreshToken) return res.status(401).json({ err: 'The RefreshToken provided seems to have been expired' });

        const { accessToken, refreshToken, refreshTokenHash } = await createToken(userId);
        const newExpiryTime = getRefreshTokenExpiry();
        await pool.query('UPDATE refresh_tokens SET token_hash=$1, expires_at=$2 WHERE id=$3 AND user_id=$4;', [refreshTokenHash, newExpiryTime, session.id, userId]);

        const csrfToken = createCSRFToken();
        res.cookie('csrf-token', csrfToken, {
            httpOnly: false,
            secure: true,
            sameSite: 'none',
            path: '/auth/refresh'
        });

        res.cookie('refresh-session', JSON.stringify(
            { refreshToken: refreshToken, sessionId: sessionId }),
            {
                httpOnly: true,
                secure: true,
                sameSite: 'none',
                path: '/auth/refresh',
                expires: newExpiryTime
            });

        const resObj = {
            userId: userId,
            accessToken: accessToken,
        }


        return res.status(200).json({ res: resObj });
    } catch (err) {
        console.error(err)
        return res.status(500).json({ err: 'Something went wrong try again later' });
    }
}


