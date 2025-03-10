import { z } from "zod";

// Simple regex to check if the string ends with an image extension
const imageRegex = /\.(jpg|jpeg|png|webp|svg)$/i;

export const UserSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  role: z.enum(["ADMIN", "USER"]).default("USER"),
  password: z.string().min(6),
});
