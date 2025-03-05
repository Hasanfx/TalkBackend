import { z } from "zod";

export const PostSchema = z.object({
  content: z.string().min(1),
  title:z.string().min(1)
});
