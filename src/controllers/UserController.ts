import { Request, Response, NextFunction } from "express";
import { prismaClient } from "../../server";
import { ErrorCode, HttpException } from "../exception/root";
import { UserSchema } from "../schema/users"; // Importing UserSchema for validation

export const GetUsers = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const users = await prismaClient.user.findMany();
  res.json(users);
};

export const GetUserById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = await prismaClient.user.findFirstOrThrow({
      where: { id: +req.params.userId },
    });
    res.json(user);
  } catch (err) {
    return next(new HttpException(ErrorCode.NOT_FOUND_404, 404));
  }
};

export const UpdateUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = await prismaClient.user.findFirst({
      where: { id: +req.params.userId },
    });
    if (!user) return next(new HttpException(ErrorCode.NOT_FOUND_404, 404));
    
    // Validate the updated user data against the UserSchema
    UserSchema.parse(req.body);

    if(req.body.role)
      req.body.role = req.body.role.toUpperCase();
      
    const updatedUser = await prismaClient.user.update({
      where: { id: user.id },
      data: req.body,
    });
    res.json(updatedUser);
  } catch (err: any) {
    return next(
      new HttpException(ErrorCode.GENERAL_EXCEPTION_100, 404, err.message)
    );
  }
};

