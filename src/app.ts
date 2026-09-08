import './loadEnv.js';

import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth-routes.js';
import petRoutes from './routes/pets-routes.js';
const everpet = express();// initializing
everpet.use(cors({ origin: process.env.FRONTEND_URL }));// allows us to trust our frontend url so we can connect to it only no one else can connect
everpet.use(express.json());
// all the request received are parsed already, for direct use from here - whereever this milddleware is called


everpet.use('/auth', authRoutes);// login and signup

everpet.use('/petstore', petRoutes);// all pet related routes

everpet.get('/', (req, res) => {
    res.send("you are NOT! Welcome to Everpet backend server and absolutely dont go to /help for any guidance on using this API. GET OUT!!");
});

everpet.get('/help', (req, res) => {
    res.send('I told you not to ask for help!, anyways there are 2 paths currently being listened \n /pets to get the total pet data (get request) \n /postpet as the name suggests it is used to post a pet')
});

export default everpet;