import express, { Request, Response, NextFunction } from "express";
import { prismaClient } from "../../server";
import { ZodError } from "zod";
import { ErrorCode, HttpException } from "../exception/root";
import { PostSchema } from "../schema/post";
import multer from "multer";
import path from "path";
import fs from "fs/promises";
import { existsSync } from "fs";

const storage = multer.memoryStorage();
const upload = multer({ storage });

export const createPost = async (req: any, res: Response, next: NextFunction) => {
  try {
    upload.single("file")(req, res, async (err: any) => {
      if (err) return next(err);

      try {
        PostSchema.parse(req.body);
      } catch (err: any) {
        if (err instanceof ZodError) {
          return next(new HttpException(ErrorCode.INVALID_DATA_400, 400, err.errors));
        }
        return next(new HttpException(ErrorCode.GENERAL_EXCEPTION_100, 100, err.message));
      }

      try {
        let postImg = undefined; // Will be undefined if no image is uploaded

        if (req.file) {
          const uploadDir = path.join(process.cwd(), "uploads/posts");
          if (!existsSync(uploadDir)) await fs.mkdir(uploadDir, { recursive: true });

          const fileType = req.file.originalname.split(".").pop();
          const fileName = `post-${Date.now()}.${fileType}`;
          postImg = `/uploads/posts/${fileName}`;

          await fs.writeFile(path.join(uploadDir, fileName), req.file.buffer);
        }

        const newPost = await prismaClient.post.create({
          data: {
            title: req.body.title || "New Post",
            content: req.body.content,
            postImg, // If undefined, Prisma will use the default value
            author: {
              connect: { id: Number(req.user.id) },
            },
          },
          include: {
            author: true,
          },
        });

        res.json(newPost);
      } catch (err: any) {
        return next(new HttpException(ErrorCode.GENERAL_EXCEPTION_100, 100, err.message));
      }
    });
  } catch (err: any) {
    return next(new HttpException(ErrorCode.GENERAL_EXCEPTION_100, 100, err.message));
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
      where: { id: Number(req.params.id) },
    });
    console.log(req.params.id)
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
      where: { id: Number(req.params.id) },
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
export const getAllPosts = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const posts = await prismaClient.post.findMany({
      include: {
        author: {
          select: {
            id: true,
            name: true, // Assuming your user model has a 'name' field
          },
        },
        reactions: {
          select: {
            type: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc", // Sorting posts from newest to oldest
      },
    });

    // Map posts to include reaction count
    const formattedPosts = posts.map((post) => ({
      ...post,
      reactionCount: post.reactions.length,
    }));

    res.json(formattedPosts);
  } catch (err: any) {
    return next(
      new HttpException(ErrorCode.GENERAL_EXCEPTION_100, 100, err.message)
    );
  }
};

export const getPostById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const post = await prismaClient.post.findUnique({
      where: { id: Number(req.params.id) },
      include: {
        author: {
          select: {
            id: true,
            name: true, // Assuming your user model has a 'name' field
            profileImg: true, // Include profileImg if necessary
          },
        },
        reactions: {
          select: {
            type: true,
            userId: true, // Include userId for reactions if needed
          },
        },
        comments: {
          select: {
            id: true,
            content: true,
            createdAt: true,
            updatedAt: true,
            userId: true,
            user: {
              select: {
                id: true,
                name: true, // Get user details for the comment author
                profileImg: true, // Include profileImg for the comment author
              },
            },
          },
          orderBy: { createdAt: "asc" }, // Sorting comments from oldest to newest
        },
      },
    });

    if (!post)
      return next(new HttpException(ErrorCode.NOT_FOUND_404, 404, "Post not found"));

    res.json({
      ...post,
      reactionCount: post.reactions.length, // Add reaction count
      commentCount: post.comments.length,  // Add comment count
    });
  } catch (err: any) {
    return next(new HttpException(ErrorCode.GENERAL_EXCEPTION_100, 100, err.message));
  }
};

