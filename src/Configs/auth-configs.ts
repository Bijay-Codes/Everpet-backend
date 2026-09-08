export const ACCESS_TOKEN_EXPIRY = "50m";
const REFRESH_TOKEN_EXPIRY_MS = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds (can change like only 15 days if we wish to)
export function getRefreshTokenExpiry(): Date {
    return new Date(Date.now() + REFRESH_TOKEN_EXPIRY_MS);
}