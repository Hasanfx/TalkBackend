import { Request, Response, NextFunction } from "express";
import { HttpException } from "../exception/root";

export const errorMiddleware = (
  error: HttpException,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  res.status(error.statusCode).json({
    message: error.message,
    errorCode: error.errorCode,
    details: error.details,
  });
};
