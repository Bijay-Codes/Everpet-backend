import { Router } from "express";
import login from "../controllers/auth-controller/login-controller.js";
import register from "../controllers/auth-controller/register-controller.js";
import refresh from "../controllers/auth-controller/refresh-controller.js";

const authRoutes = Router();

authRoutes.post('/register', register);
authRoutes.post('/login', login);
authRoutes.post('/refresh', refresh);

export default authRoutes;