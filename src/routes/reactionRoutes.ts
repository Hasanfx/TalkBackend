import { Router } from "express";
import { AuthMiddleware } from "../middlewares/auth";
import { ErrorHandler } from "../schema/errorHandler";
import {
  createOrUpdateReaction,
  deleteReaction,
  getReactions
} from "../controllers/ReactionController"; // Updated controller names

const reactionRoutes = Router({ mergeParams: true }); // Renamed for consistency


reactionRoutes.post(
  "/:postId", // Reacting to a post
  [AuthMiddleware],
  ErrorHandler(createOrUpdateReaction)
);

// Route to remove a reaction from a post
reactionRoutes.delete(
  "/:postId", // Removing reaction from a post
  [AuthMiddleware],
  ErrorHandler(deleteReaction)
);
reactionRoutes.get(
  "/:postId", // Getting reactions for a post
  ErrorHandler(getReactions)
);

export default reactionRoutes; // Renamed to postRoutes for consistency
