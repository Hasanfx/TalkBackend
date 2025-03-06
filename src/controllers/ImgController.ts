import express, { Request, Response, NextFunction } from "express";
import { prismaClient } from "../../server";
import { ZodError } from "zod";
import fs from "fs/promises";
import { existsSync } from "fs";
import { ErrorCode, HttpException } from "../exception/root";
import path from "path";
import multer from "multer";

const storage = multer.memoryStorage(); // Store in memory (optional: for processing before saving)
const upload = multer({ storage });

export const uploadImg = async (
  req: any,
  res: Response,
  next: NextFunction
) => {
  try {
    upload.single("file")(req, res, async (err: any) => {
      if (err) return next(err);

      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded!" });
      }

      const file = req.file;
      const email = req.body.email.replace("@", "_");
      const type = req.body.type;

      // Ensure upload directory exists
      const uploadDir = path.join(process.cwd(), `uploads/${type}s`);
      if (!existsSync(uploadDir))
        await fs.mkdir(uploadDir, { recursive: true });

      // Save file to disk
      const fileType = file.originalname.split(".");
      const fileName = `${type}-${email}.${fileType[fileType.length - 1]}`;
      const filePath = path.join(uploadDir, fileName);

      await fs.writeFile(filePath, file.buffer);

      res.json({ message: "File uploaded successfully!", path: filePath });
    });
  } catch (err: any) {
    next(new HttpException(ErrorCode.GENERAL_EXCEPTION_100, 100, err.message));
  }
};




// const matchedFile = files.filter((file) => {
//   file.includes(user);
//   if (matchedFile.length === 0)
//     new HttpException(ErrorCode.NOT_FOUND_404, 404, "Image not found!");
//   res.json(path.join(uploadDir, matchedFile[0]));
// });