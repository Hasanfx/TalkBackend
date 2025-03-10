import { Request, Response, NextFunction } from "express";
import { prismaClient } from "../../server";
import { ErrorCode, HttpException } from "../exception/root";
import bcrypt from "bcryptjs";
import { generateAccessToken, generateRefreshToken } from "../utils/tokenUtils";

export const register = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // 1️⃣ Extract form fields
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return next(
        new HttpException(
          ErrorCode.INVALID_DATA_400,
          400,
          "All fields are required"
        )
      );
    }

    // 2️⃣ Check if user already exists
    const existingUser = await prismaClient.user.findFirst({
      where: { email },
    });
    if (existingUser) {
      return next(
        new HttpException(
          ErrorCode.ALREADY_EXIST_403,
          403,
          "User already exists"
        )
      );
    }

    // 4️⃣ Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 5️⃣ Create new user
    const newUser = await prismaClient.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
      },
    });

    return res.status(201).json(newUser);
  } catch (err: any) {
    return next(
      new HttpException(ErrorCode.GENERAL_EXCEPTION_500, 500, err.message)
    );
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

export const me = async (req: Request, res: Response, next: NextFunction) => {
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
