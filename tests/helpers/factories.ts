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

    expect(res.body.res.isSuccess).toBeTruthy();
    expect(res.body.res.data).toHaveProperty('userId');
    expect(res.body.res.data).toHaveProperty('username');
    expect(res.body.res.data).toHaveProperty('email');
    expect(res.body.res.data).toHaveProperty('accessToken');
    expect(res.body.res.data).toHaveProperty('csrfToken');
}

export function getCookieObj(cookieHeader: string[] | string | undefined, name: string) {
    if (!cookieHeader) return null;
    const rawCookie = (Array.isArray(cookieHeader) ? cookieHeader : [cookieHeader])
        .find(c => c.startsWith(`${name}=`));
    if (!rawCookie) return undefined;
    const separatedValuesCookie = rawCookie.split(';')[0];
    if (!separatedValuesCookie) return undefined;
    const strippedSign = separatedValuesCookie.slice(separatedValuesCookie.indexOf('=') + 1);
    return {
        parsedCookieValue: decodeURIComponent(strippedSign),
        rawCookie: rawCookie
    }
}