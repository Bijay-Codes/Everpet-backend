import type { Request, Response } from "express";
import pool from "../../db/pool.js";
import { createToken, isNullorUndefined, sendCookies, sendErrorResponse, useCsrf } from "../util-functions.js";
import bcrypt from 'bcrypt';
import { getRefreshTokenExpiry } from "../../Configs/auth-configs.js";
import type { ServerResponse } from "../../response-formats/auth-format.js";

export default async function refresh(req: Request, res: Response) {
    const { validateCsrfToken } = useCsrf();
    let { userId } = req.body;
    let authHeader = req.headers.authorization;
    const JsonCookies = req.cookies['refresh-session'];

    let sessionId: string = '';
    let oldRefreshToken: string = '';
    try {
        const cookieObject = JSON.parse(JsonCookies);
        sessionId = cookieObject.sessionId;
        oldRefreshToken = cookieObject.refreshToken;
    } catch {
        return sendErrorResponse(res, 400, 'Incomplete or currupted cookies provided');
    };



    if (!authHeader || authHeader.split(' ').length !== 2) return sendErrorResponse(res, 400, 'No Authorization in header or malformed Authorization provided');
    const csrfToken = authHeader.split(' ')[1];
    if (!csrfToken) return sendErrorResponse(res, 400, 'Csrf token must be a string');
    if (isNullorUndefined(sessionId, userId, oldRefreshToken, csrfToken)) return sendErrorResponse(res, 400, 'Incomplete or nullish values provided in necessary feilds');

    if (!validateCsrfToken(sessionId, csrfToken)) return sendErrorResponse(res, 403, 'CSRF token mismatch');


    sessionId = sessionId.trim();
    userId = userId.trim();
    oldRefreshToken = oldRefreshToken.trim();

    try {
        const userInfo = await pool.query('SELECT id,username,email FROM users WHERE id=$1;', [userId]);
        if (!userInfo.rows[0]) return sendErrorResponse(res, 401, 'Create an account to access this route');
        const { id, username, email } = userInfo.rows[0];


        const sessionInfo = await pool.query('SELECT id,token_hash,expires_at FROM refresh_tokens WHERE user_id=$1 AND id=$2;', [userId, sessionId]);
        if (!sessionInfo.rows[0]) return sendErrorResponse(res, 404, 'No sessions exist please login with your account to proceed')

        const session = sessionInfo.rows[0];

        if (new Date(session.expires_at) < new Date()) {
            return sendErrorResponse(res, 401, 'Session expired please login again');
        };

        const isValidRefreshToken = await bcrypt.compare(oldRefreshToken, session.token_hash);
        if (!isValidRefreshToken) return sendErrorResponse(res, 401, 'The RefreshToken provided seems to have been expired or wrong');

        const { accessToken, refreshToken, refreshTokenHash } = await createToken(userId);
        const newExpiryTime = getRefreshTokenExpiry();
        await pool.query('UPDATE refresh_tokens SET token_hash=$1, expires_at=$2 WHERE id=$3 AND user_id=$4;', [refreshTokenHash, newExpiryTime, session.id, userId]);

        sendCookies(res, sessionId, refreshToken, id);
        const resObj: ServerResponse = {
            isSuccess: true,
            data: {
                userId: id,
                username: username,
                email: email,
                accessToken: accessToken,
                csrfToken: csrfToken
            }
        }

        return res.status(200).json({ res: resObj });
    } catch (err) {
        return sendErrorResponse(res);
    }
}


