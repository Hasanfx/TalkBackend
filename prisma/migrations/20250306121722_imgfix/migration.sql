-- AlterTable
ALTER TABLE "Post" ALTER COLUMN "postImg" DROP NOT NULL,
ALTER COLUMN "postImg" DROP DEFAULT;

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "profileImg" DROP NOT NULL,
ALTER COLUMN "profileImg" DROP DEFAULT;
