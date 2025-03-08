import { Request, Response, NextFunction } from "express";
import { prismaClient } from "../../server";
import { ErrorCode, HttpException } from "../exception/root";

export const PostOwner = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Allow admins to access without post ownership check
  if ((req as any).user.role === "ADMIN") return next();
  
  try {
    // Get post by ID and check if the current user is the author
    const post = await prismaClient.post.findUnique({
      where: { id: +req.params.id }, // Use post ID, not userId
    });

    if (!post) {
      return next(new HttpException(ErrorCode.NOT_FOUND_404, 404, "Post not found"));
    }


    // Check if the current user is the post author
    if (post.authorId === (req as any).user.id) {
      return next();
    }

    return next(new HttpException(ErrorCode.UNAUTHORIZED_ACCESS_401, 401, "You are not the author of this post"));
  } catch (err) {
    return next(new HttpException(ErrorCode.NOT_FOUND_404, 404, "Post not found"));
  }
};
