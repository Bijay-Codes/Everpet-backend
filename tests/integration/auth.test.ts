import everpet from "../../src/app.js";
import { describe, test, expect } from "vitest";
import request from 'supertest';


import { getCookieObj, isAuthFormat, validLoginPayload, validRegisterPayload } from "../helpers/factories.js";

describe('POST : auth/register', () => {
    // ! TODO test edge case that is wether the commit and rollback in register controller works
    /*  IF the api inserted userinfo in users table
        but the second insert to refresh_tokens table failed the data inserted in users table must also be removed
        before throwing error
    */
    test('Valid registeration returns 201 and data in correct format', async () => {
        const everpetAgent = request.agent(everpet);
        const res = await everpetAgent.post('/auth/register').send(validRegisterPayload());
        expect(res.status).toBe(201);
        isAuthFormat(res);
    });

    test('Providing invalid userinfo returns 400', async () => {
        const everpetAgent = request.agent(everpet);
        const res = await everpetAgent.post('/auth/register').send(validRegisterPayload({
            username: '   ',
            email: '   ',
            password: '   mypassword'
        }));
        const res2 = await everpetAgent.post('/auth/register').send(validRegisterPayload(
            { username: null, email: null, password: 'we  want null' }
        ));

        expect(res2.status).toBe(400);
        expect(res.status).toBe(400);
    })

    test('Providing used email and username returns 409', async () => {
        const everpetAgent = request.agent(everpet);
        await everpetAgent.post('/auth/register').send(validRegisterPayload());
        const res2 = await everpetAgent.post('/auth/register').send(validRegisterPayload());
        expect(res2.status).toBe(409);
    });
    test('Valid cookies get attached with correct attributes on register', async () => {
        const everpetAgent = request.agent(everpet);
        const newUser = await everpetAgent.post('/auth/register').send(validRegisterPayload());


        const csrfCookie = getCookieObj(newUser.headers['set-cookie'], 'csrf-token')?.rawCookie;
        const refreshSessionCookieObj = getCookieObj(newUser.headers['set-cookie'], 'refresh-session');

        expect(refreshSessionCookieObj).toBeDefined();


        const { parsedCookieValue, rawCookie } = refreshSessionCookieObj!;
        const refreshSessionCookie = rawCookie;
        expect(() => { JSON.parse(parsedCookieValue); }).not.toThrow();


        expect(csrfCookie).toBeDefined();
        expect(csrfCookie).not.toContain('HttpOnly');
        expect(csrfCookie).toContain('Path');
        expect(csrfCookie).toContain('Secure');

        expect(refreshSessionCookie).toBeDefined();
        expect(refreshSessionCookie).toContain('HttpOnly');
        expect(refreshSessionCookie).toContain('Path');
        expect(refreshSessionCookie).toContain('Expires');
        expect(refreshSessionCookie).toContain('Secure');
    }, 15000);
});


describe('POST : auth/login', () => {
    test('Existing user can login with correct credentials', async () => {
        const everpetAgent = request.agent(everpet);
        await everpetAgent.post('/auth/register').send(validRegisterPayload({ username: 'tasty-test', email: 'test@test.com' }));

        const res = await everpetAgent.post('/auth/login').send(validLoginPayload({ identifier: 'test@test.com' }));
        const res2 = await everpetAgent.post('/auth/login').send(validLoginPayload({ identifier: 'tasty-test' }));

        expect(res.status).toBe(200);
        expect(res2.status).toBe(200);
        isAuthFormat(res);
        isAuthFormat(res2);
    }, 15000);

    test('Providing wrong password and no users found returns 404', async () => {
        const everpetAgent = request.agent(everpet);
        const res = await everpetAgent.post('/auth/login').send(validLoginPayload());
        await everpetAgent.post('/auth/register').send(validRegisterPayload());
        const res2 = await everpetAgent.post('/auth/login').send(validLoginPayload({ password: 'Wrongpassword-getloggedinpls' }));
        expect(res.status).toBe(404);
        expect(res2.status).toBe(404);
    })

    test('Providing invalid userinfo returns 400', async () => {
        const everpetAgent = request.agent(everpet);
        const res = await everpetAgent.post('/auth/login').send(validLoginPayload({
            identifier: null, password: 'itwontgetleaked-RIGHT?'
        }));
        const res2 = await everpetAgent.post('/auth/register').send(validLoginPayload(
            { identifier: '         ', password: undefined }
        ));

        expect(res.status).toBe(400);
        expect(res2.status).toBe(400);
    });
    test('Valid cookies get attached with correct attributes on register', async () => {
        const everpetAgent = request.agent(everpet);
        const newUser = await everpetAgent.post('/auth/register').send(validRegisterPayload());


        const csrfCookie = getCookieObj(newUser.headers['set-cookie'], 'csrf-token')?.rawCookie;
        const refreshSessionCookieObj = getCookieObj(newUser.headers['set-cookie'], 'refresh-session');

        expect(refreshSessionCookieObj).toBeDefined();


        const { parsedCookieValue, rawCookie } = refreshSessionCookieObj!;
        const refreshSessionCookie = rawCookie;
        expect(() => { JSON.parse(parsedCookieValue); }).not.toThrow();


        expect(csrfCookie).toBeDefined();
        expect(csrfCookie).not.toContain('HttpOnly');
        expect(csrfCookie).toContain('Path');
        expect(csrfCookie).toContain('Secure');

        expect(refreshSessionCookie).toBeDefined();
        expect(refreshSessionCookie).toContain('HttpOnly');
        expect(refreshSessionCookie).toContain('Path');
        expect(refreshSessionCookie).toContain('Expires');
        expect(refreshSessionCookie).toContain('Secure');
    }, 15000);
})



// describe('Post : auth/refresh', () => {

//     test('Valid user can get a new access token and refresh token is updated as planned', async () => {
//         const everpetAgent = request.agent(everpet);
//         const newUser = await everpetAgent.post('/auth/register').send(validRegisterPayload());
//         const { userId } = newUser.body.res;

//         const csrfToken = everpetAgent.jar.getCookie('csrf-token', '/auth/refresh');
//         const res = await everpetAgent.post('/auth/refresh').send({ userId });

//         // expect(refreshToken).not.toBe(res.body.res.refreshToken);
//         expect(res.status).toBe(200);
//     }, 15000);


//     test('Providing invalid data in request rejects the requests', async () => {
//         const everpetAgent = request.agent(everpet);
//         const res = await everpetAgent.post('/auth/refresh').send({ sessionId: '  ', userId: undefined, refreshToken: null });
//         const res2 = await everpetAgent.post('/auth/refresh').send({ sessionId: ' Im not even logged in', userId: ' Idk my userid', refreshToken: '  ' });

//         expect(res.status).toBe(400);
//         expect(res2.status).toBe(400);
//     });


//     test('Providing invalid Refreshtoken in request rejects the requests', async () => {
//         const everpetAgent = request.agent(everpet);
//         const newUser = await everpetAgent.post('/auth/register').send(validRegisterPayload());
//         const { userId, sessionId } = newUser.body.res;
//         const res = await everpetAgent.post('/auth/refresh').send({ sessionId, userId, refreshToken: 'wrongone' });

//         expect(res.status).toBe(401);
//     });

//     test('Refresh already used RefresToken cant be used anymore', async () => {
//         const everpetAgent = request.agent(everpet);
//         const newUser = await everpetAgent.post('/auth/register').send(validRegisterPayload());
//         const { userId, sessionId, refreshToken } = newUser.body.res;
//         const res1 = await everpetAgent.post('/auth/refresh').send({ sessionId, userId, refreshToken });

//         const res2 = await everpetAgent.post('/auth/refresh').send({ sessionId, userId, refreshToken });
//         expect(refreshToken).not.toBe(res1.body.res.refreshToken);
//         expect(res1.status).toBe(200);
//         expect(res2.status).toBe(401);
//     }, 15000);

// });

