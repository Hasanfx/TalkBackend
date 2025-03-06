import express, { Request, Response, NextFunction } from "express";
import { prismaClient } from "../../server";
import fs from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import multer from "multer";

const storage = multer.memoryStorage(); // Store in memory for processing
const upload = multer({ storage });

export const uploadProfileImg = async (req: any, res: Response, next: NextFunction) => {
  try {
    upload.single("file")(req, res, async (err: any) => {
      if (err) return next(err);

      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded!" });
      }

      const userId = req.body.userId;
      if (!userId) {
        return res.status(400).json({ error: "User ID is required!" });
      }

      const user = await prismaClient.user.findUnique({ where: { id: userId } });
      if (!user) {
        return res.status(404).json({ error: "User not found!" });
      }

      const uploadDir = path.join(process.cwd(), "uploads");
      if (!existsSync(uploadDir)) await fs.mkdir(uploadDir, { recursive: true });

      const fileType = req.file.originalname.split(".").pop();
      const fileName = `user-${userId}.${fileType}`;
      const filePath = `/uploads/${fileName}`;

      await fs.writeFile(path.join(uploadDir, fileName), req.file.buffer);

      await prismaClient.user.update({
        where: { id: userId },
        data: { profileImg: filePath },
      });

      res.json({ message: "Profile image uploaded successfully!", profileImg: filePath });
    });
  } catch (err: any) {
    next(err);
  }
};
