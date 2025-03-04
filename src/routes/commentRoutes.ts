import { Router } from "express";
import { AuthMiddleware } from "../middlewares/auth";
import { ErrorHandler } from "../schema/errorHandler";
import {
  getPostComments,
  createComment,
} from "../controllers/commentController"; // Updated controller names
import { commentOwner } from "../middlewares/ownerComment"; // Updated middleware name

const postRoutes = Router({ mergeParams: true });

postRoutes.get(
  "/:postId/comments", 
  [AuthMiddleware],
  ErrorHandler(getPostComments)
);


postRoutes.post(
  "/:postId/comments", 
  [AuthMiddleware],
  ErrorHandler(createComment)
);


export default postRoutes; // Renamed to postRoutes for consistency
