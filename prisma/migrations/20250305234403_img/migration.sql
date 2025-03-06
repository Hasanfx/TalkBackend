-- AlterTable
ALTER TABLE "Post" ADD COLUMN     "postImg" TEXT NOT NULL DEFAULT '/uploads/placeHolder.webp';

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "profileImg" TEXT NOT NULL DEFAULT '/uploads/userImg.png';
