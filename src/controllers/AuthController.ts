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
<<<<<<< HEAD
    console.log("🟢 Received form-data:", req.body);

    // 1️⃣ Extract form fields
    const { name, email, password } = req.body;
    console.log(req.body)
    if (!name || !email || !password) {
      console.error("🔴 Missing required fields");
      return next(new HttpException(ErrorCode.INVALID_DATA_400, 400, "All fields are required"));
=======
    // Validate user input
    try {
      UserSchema.parse(req.body);
    } catch (err: any) {
      if (err instanceof ZodError) {
        console.error("Validation failed:", err.errors);
        return next(new HttpException(ErrorCode.INVALID_DATA_400, 400, err.errors));
      }
      return next(new HttpException(ErrorCode.GENERAL_EXCEPTION_500, 500, err.message));
>>>>>>> 438669a22b768563e01e3b906036cb9b07e51f66
    }

    // 2️⃣ Check if user already exists
    const existingUser = await prismaClient.user.findFirst({ where: { email } });
    if (existingUser) {
<<<<<<< HEAD
      console.warn("⚠️ User already exists:", email);
      return next(new HttpException(ErrorCode.ALREADY_EXIST_403, 403, "User already exists"));
=======
      return next(new HttpException(ErrorCode.ALREADY_EXIST_403, 403));
>>>>>>> 438669a22b768563e01e3b906036cb9b07e51f66
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

<<<<<<< HEAD
    console.log("✅ User created successfully:", newUser);
    return res.status(201).json(newUser);
=======
    res.json(newUser);
>>>>>>> 438669a22b768563e01e3b906036cb9b07e51f66
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
