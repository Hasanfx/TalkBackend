import { Router } from "express";
import { AuthMiddleware } from "../middlewares/auth";
import { login, logout, me, register } from "../controllers/AuthController";
import { ErrorHandler } from "../schema/errorHandler";
import { FileMiddleware } from "../middlewares/mutler.config";


const authRoutes = Router();

authRoutes.post("/signup", FileMiddleware, ErrorHandler(register));
authRoutes.post("/login", ErrorHandler(login));
authRoutes.get("/me", [AuthMiddleware], ErrorHandler(me));
authRoutes.get("/logout", [AuthMiddleware], ErrorHandler(logout));

export default authRoutes;
