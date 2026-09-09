import type { AuthResponse } from "../../response-formats/auth-format.js";
import type { Request, Response } from "express";
import type { PoolClient } from "pg";
import { createToken } from "../util-functions.js";
import { insertRefreshToken } from "../util-functions.js";
import pool from "../../db/pool.js";
import bcrypt from 'bcrypt';


export default async function register(req: Request, res: Response) {
    let { username, email, password } = req.body;

    if (!username || !email || !password) return res.status(400).json(
        {
            err: 'Incomplte user infomation provided, required format: {username:string,email:string,password:string'
        });

    username = username.trim();
    email = email.trim().toLowerCase();
    password = password.trim();

    // Validation: missing data after trim because empty spaces can pass first check the second one is there to catch those
    if (!username || !email || !password) return res.status(400).json(
        {
            err: 'Incomplte user infomation provided, required format: {username:string,email:string,password:string'
        });

    // Validation: correct length
    if (username.length > 30) return res.status(400).json(
        {
            err: 'The Username must be under 30 characters'
        });
    if (email.length > 255) return res.status(400).json(
        {
            err: 'The email must be under 255 characters'
        }
    );

    // Validation duplicate data
    const existing = await pool.query(
        'SELECT username, email FROM users WHERE username = $1 OR email = $2',
        [username, email]
    ).then(res => res.rows);

    if (existing.length > 0) {
        return res.status(409).json({ err: 'An account with these details may already exist' });
    }

    const poolClient = await pool.connect();
    try {
        await poolClient.query('BEGIN;');

        const passwordHashed = await bcrypt.hash(password, 10);
        const userInfo = await insertUser(poolClient, passwordHashed, username, email);

        const { accessToken, refreshToken, refreshTokenHash } = await createToken(userInfo.id);


        const sessionId = await insertRefreshToken(poolClient, userInfo.id, refreshTokenHash);

        const resObj: AuthResponse = {
            userId: userInfo.id,
            username: userInfo.username,
            email: userInfo.email,
            accessToken: accessToken,
            refreshToken: refreshToken,
            sessionId: sessionId
        };
        await poolClient.query('COMMIT;');
        return res.status(201).json({ res: resObj });

    } catch (err) {
        await poolClient.query('ROLLBACK;');
        // console.error(err);
        return res.status(500).json({ err: 'Something went wrong try again later' });
    } finally {
        poolClient.release();
    }
}

async function insertUser(insertClient: PoolClient, passwordHashed: string, username: string, email: string) {
    const data = await insertClient.query('INSERT INTO users (username,email,password_hash) VALUES ($1,$2,$3) RETURNING id,username,email;',
        [username, email, passwordHashed]
    );
    return data.rows[0];
}


/*

What could register route controller do?

lets see

Auth:
does it need auth? nope it doesnt need auth 

Method:
it should be a post method

Things it must do well... 
1. Get the users details like username, email and password from request body / frontend or direct api request

Substeps:
a. make a new accesstoken which is by signing their userID with jwt so we save the time on trying to get userID separately
b. make a new refresh token to be given to frontend / request initiator for refreshing access token in future
c. make a password hash to store in database

!Give the frontend the raw access token and refresh token for usage but store only encrypted token

2. Insert into database the new user info in users table and the refresh_tokens table
( users table is for storing users data )
(refresh_tokens is a table where i store session data like refreshtokens given to users so i can revoke it later for some reasons)
    


! Important things to make sure
1. Not send the password nor store raw password in database
2. IF the first querry to table (users) which is insert user info succeeds but the second one doesnt (refresh_token) then both query should be invalid
3. Write unit tests not just eyeball the response

Validation:

1. Check if the data is even given by user if not return early reject request

2. Check if the data given is in the format needed
    a. Email should be valid | char limit applied (approx 300 chars) so we can avoid users storing garbage in database
    b. Password should be strong in itself but not enforce it too much basic enforcement like must contain 1 symbol and 8 char long will do | char limit applied (20)
    c. username should not exist in database already | char limit applied (30)
    ! these are data we get from users so we cant trust them as it is
if any of these fail return early reject request

3. Check if the user already exist in table with either same email or name if so reject the request return early

4. Make sure to check both the queries succed before returning a success response
   (use Begin commit and rollback of psql)
   (use same connection for both queries not raw pool.querry)

Queries:
to users table:
INSERT INTO users (username,email,password_hash) VALUES ($1,$2,$3) RETURNING user_id,username,email;

to refresh_tokens table:
INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, $3);


Response:
{
userID: ...
username: ...
email: ...
accessToken: ...
refreshToken: ...
}
! Tokens attached separately when sending response

*/
