import express, { Request, Response, NextFunction } from "express";
import { prismaClient } from "../../server";
import { ZodError } from "zod";
import { ErrorCode, HttpException } from "../exception/root";
import { PostSchema } from "../schema/message";



export const getPostComments = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const messages = await prismaClient.post.findMany({
        where: {
          id: +req.params.postId
        },
        include: {
          author: true,
          comments: {
            include: {
              user: true
            }
          },
          reactions: {
            include: {
              user: true
            }
          }
        },
      });
      res.json(messages);
    } catch (err) {
      return next(new HttpException(ErrorCode.NOT_FOUND_404, 404));
    }
  };
  
  export const createComment = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
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
            connect: { id: req.user.id },
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
        new HttpException(ErrorCode.GENERAL_EXCEPTION_100, 100, err.message)
      );
    }
  };