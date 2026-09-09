import { expect } from "vitest";

export function validRegisterPayload(overrides = {}) {
    return {
        username: 'testuser',
        email: 'test@example.com',
        password: 'Abc12345!',
        ...overrides,
    };
}

export function validLoginPayload(overrides = {}) {
    return {
        identifier: 'testuser',
        password: 'Abc12345!',
        ...overrides,
    };
}

export function isAuthFormat(res: any) {
    expect(res.body.res).toHaveProperty('userId');
    expect(res.body.res).toHaveProperty('username');
    expect(res.body.res).toHaveProperty('email');
    expect(res.body.res).toHaveProperty('accessToken');
    expect(res.body.res).toHaveProperty('refreshToken');
    expect(res.body.res).toHaveProperty('sessionId');
}