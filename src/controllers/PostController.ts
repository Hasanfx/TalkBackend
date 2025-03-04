import express, { Request, Response, NextFunction } from "express";
import { prismaClient } from "../../server";
import { ZodError } from "zod";
import { ErrorCode, HttpException } from "../exception/root";
import { PostSchema } from "../schema/message";

export const createPost = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    PostSchema.parse(req.body);
  } catch (err: any) {
    if (err instanceof ZodError)
      return next(
        new HttpException(ErrorCode.INVALID_DATA_400, 400, err.errors)
      );
    return next(
      new HttpException(ErrorCode.GENERAL_EXCEPTION_100, 100, err.message)
    );
  }

  try {
    const newMessage = await prismaClient.post.create({
      data: {
        title: req.body.title || "New Post",
        content: req.body.content,
        author: {
          connect: { id: Number((req as any).user.id) },
        },
      },
      include: {
        author: true,
      },
    });
    res.json(newMessage);
  } catch (err: any) {
    return next(
      new HttpException(ErrorCode.GENERAL_EXCEPTION_100, 100, err.message)
    );
  }
};

export const updatePost = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {

  try {
    PostSchema.parse(req.body);
  } catch (err: any) {
    if (err instanceof ZodError)
      return next(
        new HttpException(ErrorCode.INVALID_DATA_400, 400, err.errors)
      );
    return next(
      new HttpException(ErrorCode.GENERAL_EXCEPTION_100, 100, err.message)
    );
  }

  try {
    const message = await prismaClient.post.findFirst({
      where: { id: +req.params.messageId },
    });
    if (!message) return next(new HttpException(ErrorCode.NOT_FOUND_404, 404));

    // // Check if the user is the author of the post
    // if (message.authorId !== req.user.id) {
    //   return next(new HttpException(ErrorCode.UNAUTHORIZED_401, 401));
    // }

    const updatedMessage = await prismaClient.post.update({
      where: { id: message.id },
      data: req.body,
    });

    res.json(updatedMessage);
  } catch (err: any) {
    return next(
      new HttpException(ErrorCode.GENERAL_EXCEPTION_100, 404, err.message)
    );
  }
};

export const deletePost = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const message = await prismaClient.post.findFirst({
      where: { id: +req.params.messageId },
    });
    
    if (!message) return next(new HttpException(ErrorCode.NOT_FOUND_404, 404));
    
    // // Check if the user is the author of the post
    // if (message.authorId !== req.user.id) {
    //   return next(new HttpException(ErrorCode.UNAUTHORIZED_401, 401));
    // }
    
    const deletedMessage = await prismaClient.post.delete({
      where: { id: message.id },
    });
    res.json(deletedMessage);
  } catch (err) {
    return next(new HttpException(ErrorCode.NOT_FOUND_404, 404));
  }
};
