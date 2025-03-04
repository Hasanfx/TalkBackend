import { Request, Response, NextFunction } from "express";
import { ErrorCode, HttpException } from "../exception/root";

export const AdminMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if ((req as any).user.role !== "ADMIN")
    return next(new HttpException(ErrorCode.UNAUTHORIZED_ACCESS_401, 401));

  return next();
};
