import jwt from 'jsonwebtoken';
import crypto from 'node:crypto';
import bcrypt from 'bcrypt';
import { ACCESS_TOKEN_EXPIRY } from './Configs/auth-configs.js';


export function formatAsRows(data: object): [string, string, unknown[]] {
    const columns = Object.keys(data);
    const rows = Object.values(data);
    const columnsQuerry = columns.join(', ');
    const rowsQuerry = rows.map((_, i) => `$${i + 1}`).join(', ');
    return [columnsQuerry, rowsQuerry, rows];
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
