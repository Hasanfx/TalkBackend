import path from "path";
import fs from "fs/promises";
import { existsSync } from "fs";
import multer from "multer";

const upload = multer({ storage: multer.memoryStorage() });

export const handleImageUpload = async (req: any, folder: string): Promise<string> => {
  const uploadDir = path.join(process.cwd(), `uploads/${folder}`);

  // Create directory if it doesn't exist
  if (!existsSync(uploadDir)) {
    await fs.mkdir(uploadDir, { recursive: true });
  }

  // Use placeholder if no file uploaded
  if (!req.file) {
    return  path.join(process.cwd(), `uploads/${folder}/placeHolder`)
    
  }

  // Generate unique filename
  const fileType = req.file.originalname.split('.').pop();
  const fileName = `${folder}-${Date.now()}.${fileType}`;
  const filePath = path.join(process.cwd(), `uploads/${folder}/${fileName}`);

  // Save file to disk
  await fs.writeFile(
    path.join(uploadDir, fileName),
    req.file.buffer
  );

  return filePath;
};