import jwt from "jsonwebtoken";
import { ErrorCode, HttpException } from "../exception/root";
import { Response } from "express";

export const generateAccessToken = (id: number): string => {
  return jwt.sign(
    {
      userId: id,
    },
    process.env.JWT_SECRET!,
    {
      expiresIn: Number(process.env.ACCESS_TOKEN_EXPIRY) || "15m",
    }
  );
};

export const generateRefreshToken = (id: number): string => {
  const refreshToken = jwt.sign(
    {
      userId: id,
    },
    process.env.JWT_SECRET!,
    {
      expiresIn: Number(process.env.REFRESH_TOKEN_EXPIRY) || "7d",
    }
  );
  return refreshToken;
};

export const verifyAccessToken = (token: string): any => {
  return jwt.verify(token!, process.env.JWT_SECRET!, (err, user) => {
    if (err) throw new HttpException(ErrorCode.UNAUTHORIZED_ACCESS_401, 401);
    return user;
  }) as any;
};

export const verifyRefreshToken = (token: string, res: Response) => {
  jwt.verify(token!, process.env.JWT_SECRET!, (err, user) => {
    if (err) throw new HttpException(ErrorCode.FAILED_REFRESH_TOKEN_403, 403);
    const newAccessToken = generateAccessToken(
      (user as { userId: number }).userId
    );
    res.json({ accessToken: newAccessToken });
  });
};
