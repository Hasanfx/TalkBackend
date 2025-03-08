import express, { Request, Response, NextFunction } from "express";
import { prismaClient } from "../../server";
import { HttpException, ErrorCode } from "../exception/root";

export const getImg = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Get type and id from query parameters
    const type = req.query.type as string; // expecting "profile" or "post"
    const id = Number(req.query.id);

    if (!type || isNaN(id)) {
      return res.status(400).json({ error: "Missing or invalid 'type' or 'id' parameter." });
    }

    let imgPath: string | null = null;

    if (type === "profile") {
      const user = await prismaClient.user.findUnique({
        where: { id },
        select: { profileImg: true },
      });
      if (!user || !user.profileImg) {
        return res.status(404).json({ error: "Profile image not found!" });
      }
      imgPath = user.profileImg;
    } else if (type === "post") {
      const post = await prismaClient.post.findUnique({
        where: { id },
        select: { postImg: true },
      });
      if (!post || !post.postImg) {
        return res.status(404).json({ error: "Post image not found!" });
      }
      imgPath = post.postImg;
    } else {
      return res.status(400).json({ error: "Invalid type. Must be 'profile' or 'post'." });
    }

    // Return the image path as JSON
    res.json({ imgPath });
  } catch (err: any) {
    next(new HttpException(ErrorCode.GENERAL_EXCEPTION_500, 500, err.message));
  }
};
