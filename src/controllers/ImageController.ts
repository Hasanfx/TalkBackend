import express, { Request, Response, NextFunction } from "express";
import { prismaClient } from "../../server";
import { HttpException, ErrorCode } from "../exception/root";

export const getImg = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Get type and id from URL parameters (not query parameters)
    const type = req.params.type; // expecting "profile" or "post"
    const id = Number(req.params.id);

    if (!type || isNaN(id)) {
      res.status(400).json({ error: "Missing or invalid 'type' or 'id' parameter." });
      return;
    }

    let imgPath: string | null = null;

    if (type === "profile") {
      const user = await prismaClient.user.findUnique({
        where: { id },
        select: { profileImg: true },
      });
      if (!user || !user.profileImg) {
        res.status(404).json({ error: "Profile image not found!" });
        return;
      }
      imgPath = user.profileImg;
    } else if (type === "post") {
      const post = await prismaClient.post.findUnique({
        where: { id },
        select: { postImg: true },
      });
      if (!post || !post.postImg) {
        res.status(404).json({ error: "Post image not found!" });
        return;
      }
      imgPath = post.postImg;
    } else {
      res.status(400).json({ error: "Invalid type. Must be 'profile' or 'post'." });
      return;
    }

    // Return the image path as JSON
    res.json({ imgPath });
  } catch (err: any) {
    next(new HttpException(ErrorCode.GENERAL_EXCEPTION_500, 500, err.message));
  }
};
