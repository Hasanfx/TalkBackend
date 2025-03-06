import { z } from "zod";
import path from "path";

export const UserSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  role: z.enum(["ADMIN", "USER"]).default("USER"),
  password: z.string().min(6),
  profileImg:z.string().default(path.join(process.cwd(),"placeHolder.webp"))
});
