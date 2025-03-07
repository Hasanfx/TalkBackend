import multer from "multer";

// Configure memory storage (file stays in memory as Buffer)
const storage = multer.memoryStorage();


// Create middleware instance
export const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});
export const FileMiddleware=upload.single('file')
