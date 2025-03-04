import { Router } from "express";
import authRoutes from "./authRoutes";
import userRoutes from "./userRoutes";
import { ErrorHandler } from "../schema/errorHandler";
import { refreshToken } from "../controllers/TokenController";

const rootRouter = Router();

rootRouter.use("/auth", authRoutes);
rootRouter.use("/user", userRoutes);
rootRouter.post("/refresh", ErrorHandler(refreshToken));

export default rootRouter;
