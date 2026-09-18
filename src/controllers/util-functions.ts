import jwt from 'jsonwebtoken';
import crypto from 'node:crypto';
import bcrypt from 'bcrypt';
import { ACCESS_TOKEN_EXPIRY, getRefreshTokenExpiry } from '../Configs/auth-configs.js';
import type { PoolClient } from "pg";
import type { Response } from 'express';
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




export function useCSRF() {
    return {
        createCSRFToken() {
            const random = crypto.randomBytes(32).toString('hex');
            const CSRF_TOKEN =
                crypto.createHmac('sha256', process.env.JWT_SECRET!) // load a special formula and a code to encode the data/string
                    .update(random) // insert the data to start creation
                    .digest('hex');// convert back to hex string for usage
            return `${random}.${CSRF_TOKEN}`;
        },
        validateCSRFToken(CSRF_TOKEN: string) {
            if (!CSRF_TOKEN || typeof CSRF_TOKEN !== 'string') return false;
            const separated = CSRF_TOKEN.split('.');
            if (separated.length !== 2) return false
            const [random, signature] = separated;
            if (!random || !signature) return false;// just because typescript doesnt trust/read the below function this line had to be added
            if (isNullorUndefined(random, signature)) return false;

            const expectedSignature = crypto.createHmac('sha256', process.env.JWT_SECRET!).
                update(random).
                digest('hex');
            if (signature.length !== expectedSignature.length) return false;
            // This resolves in equal time in case the both signatures arent equal character
            /*
             WHY? its important to make the test keep running even if the early values dont match
             so the response returns in same time preventing the guessmethod like guessing one character
             if its right then the response returned in time is diffrent from when returned if guess didnt land
             although its unlikely this happens im putting it in just for security
            */
            return crypto.timingSafeEqual(// compares both the strings/signatures
                Buffer.from(signature), Buffer.from(expectedSignature) // converts back to bytes
            )
        }
    }
}

export function sendCookies(res: Response, sessionId: string, refreshToken: string) {
    const { createCSRFToken } = useCSRF();
    res.cookie('csrf-token', createCSRFToken(), {
        httpOnly: false,
        secure: true,
        sameSite: 'none',
        path: '/auth'
    });
    res.cookie('refresh-session',
        JSON.stringify({ sessionId: sessionId, refreshToken: refreshToken }),
        {
            httpOnly: true,
            secure: true,
            sameSite: 'none',
            expires: getRefreshTokenExpiry(),
            path: '/auth'
        })
}