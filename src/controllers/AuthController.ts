import express, { Request, Response, NextFunction } from "express";
import { UserSchema } from "../schema/users";
import { prismaClient } from "../../server";
import { ErrorCode, HttpException } from "../exception/root";
import { ZodError } from "zod";
import bcrypt from "bcryptjs";
import { generateAccessToken, generateRefreshToken } from "../utils/tokenUtils";
import multer from "multer";
import { handleImageUpload } from "../services/uploadImg";



export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    console.log("🟢 Received form-data:", req.body);

    // 1️⃣ Extract form fields
    const { name, email, password } = req.body;
    console.log(req.body)
    if (!name || !email || !password) {
      console.error("🔴 Missing required fields");
      return next(new HttpException(ErrorCode.INVALID_DATA_400, 400, "All fields are required"));
    }

    // 2️⃣ Check if user already exists
    const existingUser = await prismaClient.user.findFirst({ where: { email } });
    if (existingUser) {
      console.warn("⚠️ User already exists:", email);
      return next(new HttpException(ErrorCode.ALREADY_EXIST_403, 403, "User already exists"));
    }

    // 3️⃣ Handle file upload (if available)
    let profileImg = null;
    if (req.file) {
      try {
        profileImg = await handleImageUpload(req, "profile");
        console.log("✅ Profile image uploaded:", profileImg);
      } catch (error) {
        console.error("❌ Error uploading profile image:", error);
        return next(new HttpException(ErrorCode.GENERAL_EXCEPTION_500, 500, "Failed to upload profile image"));
      }
    }

    // 4️⃣ Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 5️⃣ Create new user
    const newUser = await prismaClient.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        profileImg,
      },
    });

    console.log("✅ User created successfully:", newUser);
    return res.status(201).json(newUser);
  } catch (err: any) {
    console.error("🔴 Error in register function:", err);
    return next(new HttpException(ErrorCode.GENERAL_EXCEPTION_500, 500, err.message));
  }
};


// Define route



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
