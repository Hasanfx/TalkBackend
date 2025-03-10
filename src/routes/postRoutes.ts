import { Router } from "express";
import { AuthMiddleware } from "../middlewares/auth";
import { ErrorHandler } from "../schema/errorHandler";
import {
  createPost,
  deletePost,
  updatePost,
  getAllPosts,
  getPostById,
} from "../controllers/PostController";
import { PostOwner } from "../middlewares/ownerPost";

const postRoutes = Router({ mergeParams: true }); // Renamed for consistency

postRoutes.get("/", ErrorHandler(getAllPosts));

postRoutes.get("/:id", ErrorHandler(getPostById), getPostById);

postRoutes.post("/add", [AuthMiddleware], ErrorHandler(createPost));



export default postRoutes; // Renamed to postRoutes for consistency
