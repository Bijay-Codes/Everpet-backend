import { Router } from "express";
import login from "../controllers/auth-controller/login-controller.js";
import register from "../controllers/auth-controller/register-controller.js";
import refresh from "../controllers/auth-controller/refresh-controller.js";
import { refreshLimiter, authLimiter } from "../app.js";
const authRoutes = Router();

authRoutes.post('/register', authLimiter, register);
authRoutes.post('/login', authLimiter, login);
authRoutes.post('/refresh', refreshLimiter, refresh);

export default authRoutes;