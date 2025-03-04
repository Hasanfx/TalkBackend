import { Request, Response, NextFunction } from "express";
import { ErrorCode, HttpException } from "../exception/root";
import { verifyRefreshToken } from "../utils/tokenUtils";

export const refreshToken = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const token = req.cookies.refreshToken;
  if (!token) next(new HttpException(ErrorCode.FAILED_REFRESH_TOKEN_403, 403));

  verifyRefreshToken(token, res)
};
