import express, { Express } from "express";
import { PrismaClient } from "@prisma/Client";
import rootRouter from "./src/routes/root";
import { errorMiddleware } from "./src/middlewares/error";
import cors from "cors";
import cookieParser from "cookie-parser";

// import rootRouter from "./src/routes";
// import { errorMiddleware } from "./src/middlewares/errors";

const app: Express = express();
const port = process.env.PORT || 4000;

app.use(express.json());
app.use(cors({ origin: process.env.FRONTEND_PATH, credentials: true }));
app.use(cookieParser());

app.use("/api", rootRouter);

export const prismaClient = new PrismaClient({
  log: ["query"],
});

app.use(errorMiddleware);

app.listen(port, () => {
  console.log("app listen to port " + port);
});
