import type { Request, Response, NextFunction } from "express";
// these are just the type of the data i am giving in the middleware so the typescript doesnt yell at me
import jwt from "jsonwebtoken";
// jwt is just the name that we use for convinece,
// it can be thought of like a bundle of functions like jwt.sign,jwt.verify and other functions. importing it is important

export interface AuthRequest extends Request {
    userID?: string;
};
export function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
    const header = req.headers.authorization;
    let accessToken: string | undefined;
    // ensure header is a string before using string methods so TypeScript can narrow the type
    if (!header?.includes('Bearer')) {
        return res.status(401).send('No acess token provided in header');
    } else {
        accessToken = header.split(' ')[1];
    }
    if (!accessToken) return res.status(401).send('Malformed authorizatioon header');
    //  we needed to verify that access token is a string at two places because the jwt.decode only accepts string as prarmeter

    // the flow now should be we decode the token given by frontend (jwt.verify decodes + verifies if its the correct token or not)
    // then it check if its valid if it is we let the users request pass and attach the decoded userID in request
    // if we find that the token is not valid (tempered or expired or whatever reason) we return an error
    try {
        if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET is not set')
        const decoded = jwt.verify(accessToken, process.env.JWT_SECRET) as { userID: string };
        req.userID = decoded.userID;
        next();
        // i could stop the typescript to stop yelling that .env secret could be string | undefined,
        // it feels good now its shutup we use a ! to shut if up
        //  -but i used an if statement to block it, it felt more natuaral and we get a response if JWT_SECRET is actually undefined
    } catch {
        return res.status(401).json({ err: 'Invalid or expired token' });
    }
}
// this is a checking middleware that checks if the user can access the routes or not