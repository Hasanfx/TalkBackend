import { z } from "zod";

export const ChatRoomSchema = z.object({
  name: z.string(),
  password: z.string().nullable(),
});
