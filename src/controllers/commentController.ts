import express, { Request, Response, NextFunction } from "express";
import { prismaClient } from "../../server";
import { ErrorCode, HttpException } from "../exception/root";
import { ZodError } from "zod";
import { CommentSchema } from "../schema/comment";





  export const createComment = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      CommentSchema.parse(req.body);
    } catch (err: any) {
      if (err instanceof ZodError)
        return next(
          new HttpException(ErrorCode.INVALID_DATA_400, 400, err.errors)
        );
      return next(
        new HttpException(ErrorCode.GENERAL_EXCEPTION_500, 100, err.message)
      );
    }
    try {
      const { content } = req.body;
      
      if (!content) {
        return next(new HttpException(ErrorCode.INVALID_DATA_400, 400, "Comment content is required"));
      }
      
      const post = await prismaClient.post.findFirst({
        where: { id: +req.params.postId },
      });
      
      if (!post) {
        return next(new HttpException(ErrorCode.NOT_FOUND_404, 404, "Post not found"));
      }
      
      const newComment = await prismaClient.comment.create({
        data: {
          content,
          post: {
            connect: { id: post.id },
          },
          user: {
            connect: { id: (req as any).user.id },
          },
        },
        include: {
          user: true,
          post: true,
        },
      });
      
      res.json(newComment);
    } catch (err: any) {
      return next(
        new HttpException(ErrorCode.GENERAL_EXCEPTION_500, 100, err.message)
      );
    }
  };
  export const deleteComment = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const commentId = +req.params.commentId; // Get commentId from the URL

    // Find the comment to delete
    const comment = await prismaClient.comment.findUnique({
      where: { id: commentId },
    });

    // If comment not found
    if (!comment) {
      return next(new HttpException(ErrorCode.NOT_FOUND_404, 404, "Comment not found"));
    }

    // Delete the comment
    await prismaClient.comment.delete({
      where: { id: commentId },
    });

    res.json({ message: "Comment deleted successfully" });
  } catch (err: any) {
    return next(new HttpException(ErrorCode.GENERAL_EXCEPTION_500, 500, err.message));
  }
};
