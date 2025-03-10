/*
  Warnings:

  - You are about to drop the column `postImg` on the `Post` table. All the data in the column will be lost.
  - You are about to drop the column `profileImg` on the `User` table. All the data in the column will be lost.
  - You are about to drop the `Reaction` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Reaction" DROP CONSTRAINT "Reaction_postId_fkey";

-- DropForeignKey
ALTER TABLE "Reaction" DROP CONSTRAINT "Reaction_userId_fkey";

-- AlterTable
ALTER TABLE "Post" DROP COLUMN "postImg";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "profileImg";

-- DropTable
DROP TABLE "Reaction";
