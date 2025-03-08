import { Request, Response, NextFunction } from "express";
import multer from "multer";

export const FileMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.log("🟢 FileMiddleware Start");

  multer({ storage: multer.memoryStorage() }).single("file")(
    req,
    res,
    (err) => {
      if (err) {
        console.error("🔴 Multer Error:", err);
        return res.status(400).json({ error: "File upload failed" });
      }
      console.log("🟢 FileMiddleware Passed. File:", req.file);
      console.log("🟢 Body Data:", req.body);
      next();
    }
  );
};
