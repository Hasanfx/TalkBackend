import express, { Request, Response, NextFunction } from "express";
import { prismaClient } from "../../server";
import { ZodError } from "zod";
import { ErrorCode, HttpException } from "../exception/root";

// New function to add a reaction to a post
export const createOrUpdateReaction = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { type } = req.body;
      
      if (!type) {
        return next(new HttpException(ErrorCode.INVALID_DATA_400, 400, "Reaction type is required"));
      }
      
      const post = await prismaClient.post.findFirst({
        where: { id: +req.params.postId },
      });
      
      if (!post) {
        return next(new HttpException(ErrorCode.NOT_FOUND_404, 404, "Post not found"));
      }
      
      // Check if the user has already reacted to this post
      const existingReaction = await prismaClient.reaction.findFirst({
        where: {
          userId: (req as any).user.id,
          postId: post.id,
        },
      });
      
      let reaction;
      
      if (existingReaction) {
        // Update the existing reaction
        reaction = await prismaClient.reaction.update({
          where: {
            id: existingReaction.id,
          },
          data: {
            type,
          },
          include: {
            user: true,
            post: true,
          },
        });
      } else {
        // Create a new reaction
        reaction = await prismaClient.reaction.create({
          data: {
            type,
            user: {
              connect: { id: (req as any).user.id },
            },
            post: {
              connect: { id: post.id },
            },
          },
          include: {
            user: true,
            post: true,
          },
        });
      }
      
      res.json(reaction);
    } catch (err: any) {
      return next(
        new HttpException(ErrorCode.GENERAL_EXCEPTION_100, 100, err.message)
      );
    }
  };
  
  // New function to remove a reaction from a post
  export const deleteReaction = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const post = await prismaClient.post.findFirst({
        where: { id: +req.params.postId },
      });
      
      if (!post) {
        return next(new HttpException(ErrorCode.NOT_FOUND_404, 404, "Post not found"));
      }
      
      const reaction = await prismaClient.reaction.findFirst({
        where: {
          userId: (req as any).user.id,
          postId: post.id,
        },
      });
      
      if (!reaction) {
        return next(new HttpException(ErrorCode.NOT_FOUND_404, 404, "Reaction not found"));
      }
      
      const deletedReaction = await prismaClient.reaction.delete({
        where: {
          id: reaction.id,
        },
      });
      
      res.json(deletedReaction);
    } catch (err: any) {
      return next(
        new HttpException(ErrorCode.GENERAL_EXCEPTION_100, 100, err.message)
      );
    }
  };
  