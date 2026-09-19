// import type { Request, Response, NextFunction } from 'express'
// import { useCsrf } from "../controllers/util-functions.js";

// export function requireCsrf(req: Request, res: Response, next: NextFunction) {

//     // const allCookies = req.cookies['set-cookie'];
//     const csrfCookie = req.cookies['csrf-token']
//     const csrfHeader = req.headers["x-csrf-token"];
//     if (!csrfCookie || !csrfHeader) {
//         return res.status(401).json({ error: "Missing CSRF token" });
//     }

//     if (csrfCookie !== csrfHeader) {
//         return res.status(402).json({ error: "CSRF tokens do not match" });
//     }

//     if (!useCsrf().validateCsrfToken(csrfCookie)) {
//         return res.status(403).json({ error: "Invalid CSRF token" });
//     }
//     next();
// }