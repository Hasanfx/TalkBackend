import { z } from "zod";

export const PostSchema = z.object({
  content: z.string(),
  title:z.string()
});
