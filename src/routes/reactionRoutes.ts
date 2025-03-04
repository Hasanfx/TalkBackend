import { Router } from "express";
import { AuthMiddleware } from "../middlewares/auth";
import { ErrorHandler } from "../schema/errorHandler";
import {
  createOrUpdateReaction,
  deleteReaction,
} from "../controllers/reactionController"; // Updated controller names

const reactionRoutes = Router({ mergeParams: true }); // Renamed for consistency


reactionRoutes.post(
  "/:postId/reactions", // Reacting to a post
  [AuthMiddleware],
  ErrorHandler(createOrUpdateReaction)
);

// Route to remove a reaction from a post
reactionRoutes.delete(
  "/:postId/reactions", // Removing reaction from a post
  [AuthMiddleware],
  ErrorHandler(deleteReaction)
);

export default reactionRoutes; // Renamed to postRoutes for consistency
