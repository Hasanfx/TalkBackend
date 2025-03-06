import express, { Request, Response, NextFunction } from "express";
import fs from "fs/promises";
import { ErrorCode, HttpException } from "../exception/root";
import path from "path";
import multer from "multer";
import { prismaClient } from "../../server";



export const getUserImg = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = Number(req.params.userId);
  
      const user = await prismaClient.user.findUnique({
        where: { id: userId },
        select: { profileImg: true },
      });
  
      if (!user || !user.profileImg) {
        return res.status(404).json({ error: "Profile image not found!" });
      }
  
      res.sendFile(user.profileImg);
    } catch (err: any) {
      next(new HttpException(ErrorCode.GENERAL_EXCEPTION_100, 100, err.message));
    }
  };
  