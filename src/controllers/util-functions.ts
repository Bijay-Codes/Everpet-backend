import jwt from 'jsonwebtoken';
import crypto from 'node:crypto';
import bcrypt from 'bcrypt';
import { ACCESS_TOKEN_EXPIRY, getRefreshTokenExpiry } from '../Configs/auth-configs.js';
import type { PoolClient } from "pg";
import type { Response } from 'express';
import type { ServerResponse } from '../response-formats/auth-format.js';
export async function insertRefreshToken(insertClient: PoolClient, userId: string, tokenHash: string) {
    const sessionInfo = await insertClient.query('INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, $3) RETURNING id;',
        [userId, tokenHash, getRefreshTokenExpiry()]
    );
    return sessionInfo.rows[0].id;
}

export async function createToken(userId: string) {
    // needs userId,
    const accessToken = jwt.sign({ userID: userId }, process.env.JWT_SECRET!, { expiresIn: ACCESS_TOKEN_EXPIRY });
    const refreshToken = crypto.randomBytes(40).toString('hex');
    const refreshTokenHash = await bcrypt.hash(refreshToken, 10);
    return {
        accessToken: accessToken,
        refreshToken: refreshToken,
        refreshTokenHash: refreshTokenHash
    };
}

export function formatAsRows(data: object) {
    const allKeys = Object.keys(data);
    const allValues = Object.values(data);
    let formatedRows = allKeys.join(', ');
    let formatedValues = allValues.join(', ')

    return {
        formatedRows: formatedRows,
        formatedValues: formatedValues
    }
}

export function isValidInitialData(petData: { name: string, age: number, species: string }) {
    if (petData.name && petData.name.length <= 40) {
        if (petData.species) {
            return true;
        } else {
            return false
        }
    } else {
        return false;
    }
}

export function isNullorUndefined(...args: string[]) {
    return args.some(arg => {
        if (!arg || arg === undefined || arg === null) return true;
        if (typeof arg !== 'string') return true;
        const trimmed = arg.trim();
        if (trimmed === '') return true;
    })
}

export function useCsrf() {
    return {
        createCsrfToken(sessionId: string) {
            return crypto.createHmac('sha256', process.env.CSRF_SECRET!).update(sessionId).digest('hex');
        },
        validateCsrfToken(sessionId: string, csrfToken: string) {
            if (typeof sessionId !== 'string' || typeof csrfToken !== 'string') return false;

            const newTokenForValidation =
                crypto.createHmac('sha256', process.env.CSRF_SECRET!)
                    .update(sessionId)
                    .digest('hex');
            const givenToken = Buffer.from(csrfToken);
            const expectedToken = Buffer.from(newTokenForValidation);
            if (expectedToken.length !== givenToken.length) return false;
            return crypto.timingSafeEqual(givenToken, expectedToken);
        }
    }
}


export function sendCookies(res: Response, sessionId: string, refreshToken: string, userId: string) {
    const isTest = process.env.NODE_ENV === 'test'
    res.cookie('refresh-session',
        JSON.stringify({ sessionId: sessionId, userId: userId, refreshToken: refreshToken }),
        {
            httpOnly: true,
            secure: !isTest,
            partitioned: !isTest,
            sameSite: isTest ? 'lax' : 'none',
            expires: getRefreshTokenExpiry(),
            path: '/auth'
        })
}

export function sendErrorResponse(res: Response, status: number = 500, message: string = 'Server error', details: object | string = 'Something went wrong, please try again later') {
    const resObj: ServerResponse = {
        isSuccess: false,
        data: null,
        err: {
            message: message,
            code: status,
            details: details
        }
    }
    return res.status(status).json({ res: resObj });
}