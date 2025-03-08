import { Request, Response, NextFunction } from "express";
import { ErrorCode, HttpException } from "../exception/root";

export const ErrorHandler = (method: Function) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await method(req, res, next);
    } catch (err: any) {
      let exception;
      
      if (err instanceof HttpException) exception = err;
      else {
        exception = new HttpException(
          ErrorCode.GENERAL_EXCEPTION_500,
          100,
          err.message
        );
      }
      return next(exception);
    }
  };
};
