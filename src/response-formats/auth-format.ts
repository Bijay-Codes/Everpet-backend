export interface AuthResponse {
    userId: string;
    username: string;
    email: string;
    accessToken: string;
    refreshToken: string;
    sessionId: string;
};
export type UserInfo = {
    user_id: string;
    username: string;
    email: string;
}
