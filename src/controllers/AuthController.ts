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
      console.log("User input validated:", req.body);
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
      console.log("User already exists with email:", email);
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

    console.log("User created:", newUser);
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
  console.log("Login attempt for email:", email);

  const user = await prismaClient.user.findFirst({ where: { email } });

  if (!user) {
    console.log("User not found with email:", email);
    return next(new HttpException(ErrorCode.NOT_FOUND_404, 404));
  }

  console.log('attempting to check password')
  const passwordMatch = await bcrypt.compare(password, user!.password);
  if (!passwordMatch) {
    console.log("Incorrect password for email:", email);
    return next(
      new HttpException(
        ErrorCode.INVALID_DATA_400,
        400,
        "Password not correct, try again!"
      )
    );
  }
  console.log('checked to check password')

  const accessToken = generateAccessToken(user.id);
  const refreshToken = generateRefreshToken(user.id);

  console.log("Tokens generated for user:", user.id);

  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: false, // Use true for production
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  console.log("Refresh token set in cookie");

  res.json({ user, accessToken });
};

export const me = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.log("Fetching user from request:", (req as any).user);
  res.json((req as any).user);
};

export const logout = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.log("Logging out user:", (req as any).user);
  
  res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: true, // Use true for production
    sameSite: "lax",
  });

  console.log("Refresh token cleared from cookies");

  res.json((req as any).user);
};
