import { Router } from "express";
import login from "../controllers/auth-controller/login-controller.js";
import register from "../controllers/auth-controller/register-controller.js";
import pool from "../db/pool.js";
const authRoutes = Router();

authRoutes.post('/register', register);
authRoutes.post('/login', login);

// only for usage in development 
// !To be redacted before shipping
authRoutes.get('/all', (async (req, res) => {
    const data = await pool.query('SELECT * from users');
    const users = data.rows
    res.status(200).json({ users });
}))
// authRoutes.post('/refresh', refreshAccessToken);

export default authRoutes;