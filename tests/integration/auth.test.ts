import everpet from "../../src/app.js";
import { describe, test, expect } from "vitest";
import request from 'supertest';
import validRegisterPayload from "../helpers/factories.js";


describe('POST: auth/register ', () => {
    // ! TODO test edge case that is wether the commit and rollback in register controller works
    /*  IF the api inserted userinfo in users table
        but the second insert to refresh_tokens table failed the data inserted in users table must also be removed
        before throwing error
    */
    test('Valid registeration returns 201 and correct format', async () => {
        const res = await request(everpet).post('/auth/register').send(validRegisterPayload());
        expect(res.status).toBe(201);
        expect(res.body.res).toHaveProperty('userId');
        expect(res.body.res).toHaveProperty('username');
        expect(res.body.res).toHaveProperty('email');
        expect(res.body.res).toHaveProperty('accessToken');
        expect(res.body.res).toHaveProperty('refreshToken');
    });

    test('Inserting empty userinfo returns 400', async () => {
        const res = await request(everpet).post('/auth/register').send(validRegisterPayload({
            username: '   ',
            email: '   ',
            password: '   mypassword'
        }));
        expect(res.status).toBe(400);
    })

    test('Inserting used email and username returns 409', async () => {
        await request(everpet).post('/auth/register').send(validRegisterPayload());
        const res2 = await request(everpet).post('/auth/register').send(validRegisterPayload());
        expect(res2.status).toBe(409);
    });
})