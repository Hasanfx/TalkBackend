import { Router } from "express";
import { AdminMiddleware } from "../middlewares/admin";
import {
  GetUserById,
  GetUsers,
  UpdateUser,
} from "../controllers/UserController";
import { AuthMiddleware } from "../middlewares/auth";
import { ErrorHandler } from "../schema/errorHandler";
import { uploadImg } from "../controllers/ImgController";
import { getUserImg } from "../services/getImgs";

const userRoutes = Router();

userRoutes.get(
  "/",
  [AuthMiddleware, AdminMiddleware],
  ErrorHandler(GetUsers)
);
userRoutes.get(
  "/:userId",
  [AuthMiddleware, AdminMiddleware],
  ErrorHandler(GetUserById)
);

userRoutes.put(
  "/:userId",
  [AuthMiddleware],
  ErrorHandler(UpdateUser)
);
userRoutes.get(
  "/img/:userId",
  [AuthMiddleware],
  ErrorHandler(getUserImg)
);

userRoutes.put(
  "/img/:userId",
  [AuthMiddleware],
  ErrorHandler(uploadImg)
);

export default userRoutes;
