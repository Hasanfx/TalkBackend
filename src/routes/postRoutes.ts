import { Router } from "express";
import { AuthMiddleware } from "../middlewares/auth";
import { ErrorHandler } from "../schema/errorHandler";
import {
  createPost,
  deletePost,
  updatePost,
  getAllPosts,
  getPostById
} from "../controllers/PostController"; 
import { PostOwner } from "../middlewares/ownerPost"; 
import {FileMiddleware } from "../middlewares/mutler.config";

const postRoutes = Router({ mergeParams: true }); // Renamed for consistency

postRoutes.get(
  "/", 
  ErrorHandler(getAllPosts)
);





postRoutes.get(
  "/:id", 
  ErrorHandler(getPostById),getPostById
);
// Route to create a new post
postRoutes.post(
  "/add", 
  [AuthMiddleware],FileMiddleware,
  ErrorHandler(createPost)
);


// Route to update a post
postRoutes.put(
  "/:id", 
  [AuthMiddleware, PostOwner],FileMiddleware,
  ErrorHandler(updatePost)
);

// Route to delete a post
postRoutes.delete(
  "/:id",
  [AuthMiddleware, PostOwner], 
  ErrorHandler(deletePost)
);




export default postRoutes; // Renamed to postRoutes for consistency
