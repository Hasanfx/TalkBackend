import express, { Request, Response, NextFunction } from "express";
import { UserSchema } from "../schema/users";
import { prismaClient } from "../../server";
import { ErrorCode, HttpException } from "../exception/root";
import { ZodError } from "zod";
import bcrypt from "bcryptjs";
import { generateAccessToken, generateRefreshToken } from "../utils/tokenUtils";
import multer from "multer";
import { handleImageUpload } from "../services/uploadImg";



export const register = async (req: any, res: Response, next: NextFunction) => {
  try {
    // Validate user input
    try {
      UserSchema.parse(req.body);
    } catch (err: any) {
      if (err instanceof ZodError) {
        console.error("Validation failed:", err.errors);
        return next(new HttpException(ErrorCode.INVALID_DATA_400, 400, err.errors));
      }
      return next(new HttpException(ErrorCode.GENERAL_EXCEPTION_500, 500, err.message));
    }

    const { name, email, password } = req.body;
    const existingUser = await prismaClient.user.findFirst({ where: { email } });
    if (existingUser) {
      return next(new HttpException(ErrorCode.ALREADY_EXIST_403, 403));
    }

    // Handle profile image upload via service
    const profileImg = await handleImageUpload(req, "profile");

    const newUser = await prismaClient.user.create({
      data: {
        name,
        email,
        password: await bcrypt.hash(password, 10),
        profileImg,
      },
    });

    res.json(newUser);
  } catch (err: any) {
    return next(new HttpException(ErrorCode.GENERAL_EXCEPTION_500, 500, err.message));
  }
};


export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { email, password } = req.body;

  const user = await prismaClient.user.findFirst({ where: { email } });

  if (!user) {
    return next(new HttpException(ErrorCode.NOT_FOUND_404, 404));
  }

  const passwordMatch = await bcrypt.compare(password, user!.password);
  if (!passwordMatch) {
    return next(
      new HttpException(
        ErrorCode.INVALID_DATA_400,
        400,
        "Password not correct, try again!"
      )
    );
  }

  const accessToken = generateAccessToken(user.id);
  const refreshToken = generateRefreshToken(user.id);


  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: false, // Use true for production
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });


  res.json({ user, accessToken });
};

export const me = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  res.json((req as any).user);
};

export const logout = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  
  res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: true, // Use true for production
    sameSite: "lax",
  });


  res.json((req as any).user);
};
