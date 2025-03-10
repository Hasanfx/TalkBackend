import { Request, Response, NextFunction } from "express";
import { prismaClient } from "../../server";
import { ErrorCode, HttpException } from "../exception/root";

export const GetUserById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = await prismaClient.user.findFirstOrThrow({
      where: { id: +req.params.userId },
    });
    res.json(user);
  } catch (err) {
    return next(new HttpException(ErrorCode.NOT_FOUND_404, 404));
  }
};
