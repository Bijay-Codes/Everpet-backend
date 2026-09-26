import type { ServerResponse } from "../../response-formats/auth-format.js";
import type { Request, Response } from "express";
import { insertRefreshToken, sendCookies, sendErrorResponse, isNullorUndefined, useCsrf } from "../util-functions.js";
import { createToken } from "../util-functions.js";
import pool from "../../db/pool.js";
import bcrypt from 'bcrypt'

export default async function login(req: Request, res: Response) {
    let { identifier, password } = req.body;

    const isInvalid = isNullorUndefined(identifier, password);
    if (isInvalid) return sendErrorResponse(res, 400, 'Identifier or password not provided', 'provide either email or username as identifier and a valid password');

    password = password.trim();
    identifier = identifier.trim();
    const { createCsrfToken } = useCsrf();
    const poolClient = await pool.connect();
    try {

        const resData = await poolClient.query('SELECT id,username,email,password_hash FROM users WHERE (username=$1 OR email=$1);', [identifier]);

        const userInfo = resData.rows[0];
        if (!userInfo) return sendErrorResponse(res, 404, 'Wrong password or identifier', 'identifier can be either email or username');

        const isValidPassword = await bcrypt.compare(password, userInfo.password_hash);
        if (!isValidPassword) return sendErrorResponse(res, 404, 'Wrong password or identifier', 'identifier can be either email or username');

        await poolClient.query('BEGIN;');
        const { accessToken, refreshToken, refreshTokenHash } = await createToken(userInfo.id);

        const sessionId = await insertRefreshToken(poolClient, userInfo.id, refreshTokenHash);

        const resObj: ServerResponse = {
            isSuccess: true,
            data: {
                userId: userInfo.id,
                username: userInfo.username,
                email: userInfo.email,
                accessToken: accessToken,
                csrfToken: createCsrfToken(sessionId)
            }
        };

        await poolClient.query('COMMIT;');

        sendCookies(res, sessionId, refreshToken, userInfo.id);

        // ! Reminder set up either an cron or route to clear previous expired sessions
        return res.status(200).json({ res: resObj });

    } catch (err) {
        await poolClient.query('ROLLBACK;');
        return sendErrorResponse(res);
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
1. Get the users details like username OR email and password.
username or email treated as identifier  from request body / frontend or direct api request

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
refreshToken: ...
accessToken: ...
}
! Tokens attached separately when sending response

*/
