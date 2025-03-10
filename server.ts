import express, { Express } from "express";
import { PrismaClient } from "@prisma/client";
import rootRouter from "./src/routes/root";
import { errorMiddleware } from "./src/middlewares/error";
import cors from "cors";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import path from "path";
import dotenv from "dotenv";

// import rootRouter from "./src/routes";
// import { errorMiddleware } from "./src/middlewares/errors";
dotenv.config();

export const app: Express = express();
const port = process.env.PORT || 4000;

app.use(express.json());
app.use(cors({ origin: "*" }));
app.use(cookieParser());

app.use(morgan("dev"));

app.use("/api", rootRouter);
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

export const prismaClient = new PrismaClient({
  log: ["query"],
});

app.use(errorMiddleware);

if (process.env.NODE_ENV !== "test") {
  app.listen(port, () => {
    console.log(`app is running on ${port}`);
  });
}
