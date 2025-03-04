import { Router } from "express";
import authRoutes from "./authRoutes";
import userRoutes from "./userRoutes";
import { ErrorHandler } from "../schema/errorHandler";
import { refreshToken } from "../controllers/TokenController";
import postRoutes from "./postRoutes";
import commentRoutes from "./commentRoutes";
import reactionRoutes from "./reactionRoutes";

const rootRouter = Router();

rootRouter.use("/auth", authRoutes);
rootRouter.use("/user", userRoutes);
rootRouter.use("/post",postRoutes);
rootRouter.use("/comment",commentRoutes);
rootRouter.use("/reaction",reactionRoutes);

rootRouter.post("/refresh", ErrorHandler(refreshToken));

export default rootRouter;
