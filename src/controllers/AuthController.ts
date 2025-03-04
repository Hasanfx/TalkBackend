import express, { Request, Response, NextFunction } from "express";
import { UserSchema } from "../schema/users";
import { prismaClient } from "../../server";
import { ErrorCode, HttpException } from "../exception/root";
import { ZodError } from "zod";
import bcrypt from "bcryptjs";
import { generateAccessToken, generateRefreshToken } from "../utils/tokenUtils";

export const register = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    UserSchema.parse(req.body); // Validate user input
    console.log("User input validated:", req.body);
  } catch (err) {
    if (err instanceof ZodError) {
      console.error("Validation failed:", err.errors);
      return next(
        new HttpException(ErrorCode.INVALID_DATA_400, 400, err.errors)
      );
    }
  }

  const { name, email, password } = req.body;
  console.log("Registering user with email:", email);

  const user = await prismaClient.user.findFirst({ where: { email } });

  if (user) {
    console.log("User already exists with email:", email);
    return next(new HttpException(ErrorCode.ALREADY_EXIST_403, 403));
  }

  const newUser = await prismaClient.user.create({
    data: {
      name,
      email,
      password: await bcrypt.hash(password, 10),
    },
  });

  console.log("User created:", newUser);
  res.json(newUser);
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
