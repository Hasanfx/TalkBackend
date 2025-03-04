import { Router } from "express";
import { AuthMiddleware } from "../middlewares/auth";
import { ErrorHandler } from "../schema/errorHandler";
import {
  createPost,
  deletePost,
  updatePost,
} from "../controllers/PostController"; // Updated controller names
import { PostOwner } from "../middlewares/ownerPost"; // Updated middleware name

const postRoutes = Router({ mergeParams: true }); // Renamed for consistency



// Route to create a new post
postRoutes.post(
  "/add", 
  [AuthMiddleware , PostOwner],
  ErrorHandler(createPost)
);

// Route to update a post
postRoutes.put(
  "/:postId", 
  [AuthMiddleware, PostOwner], 
  ErrorHandler(updatePost)
);

// Route to delete a post
postRoutes.delete(
  "/:postId",
  [AuthMiddleware, PostOwner], 
  ErrorHandler(deletePost)
);




export default postRoutes; // Renamed to postRoutes for consistency
