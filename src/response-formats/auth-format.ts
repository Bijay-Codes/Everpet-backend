interface AuthResponse {
    userId: string;
    username: string;
    email: string;
    accessToken: string;
    csrfToken: string;
};

export type ServerResponse = { isSuccess: boolean, data: SuccessResponse | null, err?: ErrorResponse }
type SuccessResponse = AuthResponse;
type ErrorResponse = { message: string, code: number, details: string | object }
