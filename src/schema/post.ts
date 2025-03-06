import { z } from "zod";
import path from "path";

export const PostSchema = z.object({
  content: z.string().min(1),
  title:z.string().min(1),
  profileImg:z.string().default(path.join(process.cwd(),"userImg.png"))
  
});
