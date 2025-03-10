import { Router } from "express";
import { AdminMiddleware } from "../middlewares/admin";
import { GetUserById } from "../controllers/UserController";
import { AuthMiddleware } from "../middlewares/auth";
import { ErrorHandler } from "../schema/errorHandler";

const userRoutes = Router();

userRoutes.get("/:userId", [AuthMiddleware], ErrorHandler(GetUserById));

export default userRoutes;
