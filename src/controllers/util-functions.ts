import jwt from 'jsonwebtoken';
import crypto from 'node:crypto';
import bcrypt from 'bcrypt';
import { ACCESS_TOKEN_EXPIRY, getRefreshTokenExpiry } from '../Configs/auth-configs.js';
import type { PoolClient } from "pg";

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
        }
    } else {
        return false;
    }
}

