import { Request, Response, NextFunction } from "express";
import { prismaClient } from "../../server";
import { ErrorCode, HttpException } from "../exception/root";

export const PostOwner = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if ((req  as any).user.role === "ADMIN") return next();
  try {
    const PostOwner = await prismaClient.post.findFirstOrThrow({
      where: { authorId: +req.params.userId },
    });
    if (PostOwner.authorId === Number((req as any).user.id)) return next();

    return next(new HttpException(ErrorCode.UNAUTHORIZED_ACCESS_401, 401));
  } catch (err) {
    return next(new HttpException(ErrorCode.NOT_FOUND_404, 404));
  }
};
