import pool from "../../db/pool.js";
import type { Request, Response } from "express";
import { getRefreshTokenExpiry } from "../../Configs/auth-configs.js";
import { createToken } from "../../util.js";
import type { AuthResponse } from "../../response-formats/auth-format.js";


export default async function login(req: Request, res: Response) {
    let { identifier, password } = req.body;
    identifier = identifier.trim();
    password = password.trim();
    if (!identifier || !password) return res.status(400).json({ err: 'Identifier or password not provided : provide either email or username as identifier and a valid password' });

    const poolClient = await pool.connect();
    try {
        await poolClient.query('BEGIN;')
        const resData = await poolClient.query('SELECT id,username,email,password_hash FROM users WHERE (username=$1 OR email=$1);', [identifier]);
        const userInfo = resData.rows[0];
        if (!userInfo) return res.status(404).json({ err: 'Wrong identifier or password : identifier can be either email or username' });
        const { accessToken, refreshToken, refreshTokenHash } = await createToken(userInfo.id);
        await poolClient.query('DELETE FROM refresh_tokens where user_id=$1;', [userInfo.id]);
        await poolClient.query('INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, $3);', [userInfo.id, refreshTokenHash, getRefreshTokenExpiry()]);

        const resObj: AuthResponse = {
            userId: userInfo.id,
            username: userInfo.username,
            email: userInfo.email,
            accessToken: accessToken,
            refreshToken: refreshToken
        }

        res.status(201).json({ res: resObj });
        await poolClient.query('COMMIT;');

    } catch (err) {
        poolClient.query('ROLLBACK;')
        return res.status(500).json({ err: 'Server error, please try again later' });
    } finally {
        poolClient.release();
    }
}


/*

What could Login route controller do?

lets see

Auth:
does it need auth? nope it doesnt need auth 

Method:
it should be a post method

Things it must do well... 
1. Get the users details like username, email and password from request body / frontend or direct api request

Substeps:


!Give the frontend the raw access token and refresh token for usage but store only encrypted token

2. Check wether the user exists or not
    


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
