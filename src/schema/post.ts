import { z } from "zod";
import path from "path";

const imageRegex = /\.(jpg|jpeg|png|webp|svg)$/i;

export const PostSchema = z.object({
  content: z.string().min(1)})
