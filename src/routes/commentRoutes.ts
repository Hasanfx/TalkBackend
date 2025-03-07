import { Router } from "express";
import { AuthMiddleware } from "../middlewares/auth";
import { ErrorHandler } from "../schema/errorHandler";
import {
  createComment,deleteComment
} from "../controllers/CommentController"; // Updated controller names
import { commentOwner } from "../middlewares/ownerComment"; // Updated middleware name

const commentRoutes = Router({ mergeParams: true });



commentRoutes.post(
  "/:postId", 
  [AuthMiddleware],
  ErrorHandler(createComment)
);

commentRoutes.delete(
  "/:commentId", 
  [AuthMiddleware ,commentOwner],
  ErrorHandler(deleteComment)
);


export default commentRoutes; // Renamed to commentRoutes for consistency
