import express, { Request, Response, NextFunction } from "express";
import multer from "multer";
import { prismaClient } from "../../server";
import { ZodError } from "zod";
import { ErrorCode, HttpException } from "../exception/root";
import { PostSchema } from "../schema/post";
import { handleImageUpload } from "../services/uploadImg";

const storage = multer.memoryStorage();
const upload = multer({ storage });

export const createPost = async (req: Request, res: Response, next: NextFunction) => {
  try {
    console.log("🟢 Received body:", req.body);
    console.log("🟢 Received file:", req.file);

    // ✅ Ensure request body isn't empty
    if (!req.body || Object.keys(req.body).length === 0) {
      return next(new HttpException(ErrorCode.INVALID_DATA_400, 400, "Request body is empty"));
    }

    // ✅ Process file upload
    const filePath = req.file ? await handleImageUpload(req, "posts") : null;

    // ✅ Convert `user` to number
    const userId = Number(req.body.user);
    if (!userId || isNaN(userId)) {
      return next(new HttpException(ErrorCode.INVALID_DATA_400, 400, "Invalid user ID"));
    }

    // ✅ Validate content
    const content = req.body.content?.trim();
    if (!content) {
      return next(new HttpException(ErrorCode.INVALID_DATA_400, 400, "Content is required"));
    }

    // ✅ Validate with Zod
    try {
      PostSchema.parse({ content });
    } catch (err: any) {
      if (err instanceof ZodError) {
        return next(new HttpException(ErrorCode.INVALID_DATA_400, 400, err.errors));
      }
      return next(new HttpException(ErrorCode.GENERAL_EXCEPTION_500, 500, err.message));
    }

    // ✅ Create new post
    const newPost = await prismaClient.post.create({
      data: {
        content,
        postImg: filePath,
        author: { connect: { id: userId } },
      },
    });

    res.status(201).json(newPost);
  } catch (err: any) {
    console.error("🔴 Error occurred:", err);
    return next(new HttpException(ErrorCode.GENERAL_EXCEPTION_500, 500, err.message));
  }
};


// ✅ Apply multer middleware for handling form-data uploads
export const postRouter = express.Router();
postRouter.post("/add", upload.single("image"), createPost);




export const updatePost = async (req: any, res: Response, next: NextFunction) => {
  try {
    PostSchema.parse(req.body);
  } catch (err: any) {
    if (err instanceof ZodError) {
      return next(new HttpException(ErrorCode.INVALID_DATA_400, 400, err.errors));
    }
    return next(new HttpException(ErrorCode.GENERAL_EXCEPTION_500, 100, err.message));
  }

  try {
    const post = await prismaClient.post.findFirst({
      where: { id: Number(req.params.id) },
    });

    if (!post) return next(new HttpException(ErrorCode.NOT_FOUND_404, 404));

    const filePath = req.file ? await handleImageUpload(req, "posts") : post.postImg;

    const updatedPost = await prismaClient.post.update({
      where: { id: post.id },
      data: {
        content: req.body.content,
        postImg: filePath,
      },
    });

    res.json(updatedPost);
  } catch (err: any) {
    return next(new HttpException(ErrorCode.GENERAL_EXCEPTION_500, 404, err.message));
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
                name: true, // Get user details for the comment author
                profileImg: true, // Include profileImg for the comment author
              },
            },
          },
          orderBy: { createdAt: "asc" }, // Sorting comments from oldest to newest
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
      new HttpException(ErrorCode.GENERAL_EXCEPTION_500, 100, err.message)
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
    return next(new HttpException(ErrorCode.GENERAL_EXCEPTION_500, 100, err.message));
  }
};

