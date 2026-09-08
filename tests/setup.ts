import { beforeEach, afterAll } from 'vitest';
import pool from '../src/db/pool.js';

beforeEach(async () => {
    if (process.env.NODE_ENV !== 'test') {
        throw new Error('Refusing to run tests: NODE_ENV is not "test"');
    }
    await pool.query(
        'TRUNCATE users, pets, refresh_tokens, ownership_history, foods RESTART IDENTITY CASCADE'
    );
});

afterAll(async () => {
    await pool.end();
});