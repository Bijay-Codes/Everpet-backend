import './loadEnv.js';

import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth-routes.js';
import petRoutes from './routes/pets-routes.js';
import helmet from 'helmet';
import cookieParser from "cookie-parser";
import { requireOrigin } from './middleware/require-origin.js';
import { globalLimiter } from './middleware/rate-limiters.js';

if (!process.env.FRONTEND_URL) {
    throw new Error('FRONTEND_URL environment variable is not set');
}
const everpet = express();// initializing

everpet.set('trust proxy', 1);
everpet.use(helmet());
everpet.use(cors({ origin: process.env.FRONTEND_URL, credentials: true })); // allows us to trust our frontend url so we can connect to it only no one else can connect

everpet.use(globalLimiter);// Limiter__ Throttling behavior 
everpet.use(requireOrigin);

everpet.use(cookieParser());

everpet.use(express.json()); // all the request received are parsed already, for direct use from here - whereever this milddleware is called


everpet.use('/auth', authRoutes);// login and signup
everpet.use('/petstore', petRoutes);// all pet related routes

everpet.get('/', (req, res) => {
    res.send("you are NOT! Welcome to Everpet backend server and absolutely dont go to /help for any guidance on using this API. GET OUT!!");
});

everpet.get('/help', (req, res) => {
    res.send('I told you not to ask for help!, anyways... welcome i guess - currently im working on authentication bzztt bzzttt you cant hear me now go do your work');
});

export default everpet;