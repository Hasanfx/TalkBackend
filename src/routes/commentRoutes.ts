import { Router } from "express";
import { AuthMiddleware } from "../middlewares/auth";
import { ErrorHandler } from "../schema/errorHandler";
import {
  getPostComments,
  createComment,
} from "../controllers/commentController"; // Updated controller names
import { commentOwner } from "../middlewares/ownerComment"; // Updated middleware name

const commentRoutes = Router({ mergeParams: true });

commentRoutes.get(
  "/:postId", 
  [AuthMiddleware , ],
  ErrorHandler(getPostComments)
);


commentRoutes.post(
  "/:postId", 
  [AuthMiddleware],
  ErrorHandler(createComment)
);


export default commentRoutes; // Renamed to commentRoutes for consistency
