import { z } from "zod";

export const UserSchema = z.object({
  name: z.string(),
  email: z.string().email(),
  role: z.enum(["ADMIN", "USER"]).default("USER"),
  password: z.string().min(8),
});
