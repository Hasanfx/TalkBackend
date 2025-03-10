import request from "supertest";
import express from "express";
import { prismaClient } from "../../../server";
import authRoutes from "../../routes/authRoutes";
import bcrypt from "bcryptjs";
import {
  generateAccessToken,
  generateRefreshToken,
} from "../../utils/tokenUtils";
import { UserSchema } from "../../schema/users";

// Mock dependencies
jest.mock("../../../server", () => ({
  prismaClient: {
    user: {
      findFirst: jest.fn(),
      create: jest.fn(),
    },
  },
}));

jest.mock("bcryptjs", () => ({
  compare: jest.fn(),
  hash: jest.fn(),
}));

jest.mock("../../utils/tokenUtils", () => ({
  generateAccessToken: jest.fn(),
  generateRefreshToken: jest.fn(),
  verifyAccessToken: jest.fn(),
}));

jest.mock("../../middlewares/auth", () => ({
  AuthMiddleware: jest.fn((req, res, next) => {
    req.user = { id: 1, name: "Test User", email: "test@example.com" };
    next();
  }),
}));

jest.mock("../../schema/users", () => ({
  UserSchema: {
    parse: jest.fn(),
  },
}));

jest.mock("../../services/uploadImg", () => ({
  handleImageUpload: jest
    .fn()
    .mockResolvedValue("/uploads/profile/test-profile.jpg"),
}));

// Setup express app for testing
const app = express();
app.use(express.json());
app.use("/auth", authRoutes);

describe("Auth Routes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("POST /auth/signup", () => {
    it("should register a new user", async () => {
      const mockUser = {
        id: 1,
        name: "Test User",
        email: "test@example.com",
        password: "hashedpassword",
        profileImg: "/uploads/profile/test-profile.jpg",
      };

      (UserSchema.parse as jest.Mock).mockReturnValue(true);
      (prismaClient.user.findFirst as jest.Mock).mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue("hashedpassword");
      (prismaClient.user.create as jest.Mock).mockResolvedValue(mockUser);

      // Use a simpler approach to avoid connection reset issues
      const response = await request(app).post("/auth/signup").send({
        name: "Test User",
        email: "test@example.com",
        password: "password123",
      });

      expect(response.status).toBe(200);
      expect(prismaClient.user.create).toHaveBeenCalled();
    });

    it("should return 403 if user already exists", async () => {
      const existingUser = {
        id: 1,
        name: "Existing User",
        email: "existing@example.com",
      };

      (UserSchema.parse as jest.Mock).mockReturnValue(true);
      (prismaClient.user.findFirst as jest.Mock).mockResolvedValue(
        existingUser
      );

      const response = await request(app).post("/auth/signup").send({
        name: "Test User",
        email: "existing@example.com",
        password: "password123",
      });

      expect(response.status).toBe(403);
    });

    it("should return 500 for invalid data", async () => {
      (UserSchema.parse as jest.Mock).mockImplementation(() => {
        throw new Error("Validation error");
      });

      const response = await request(app).post("/auth/signup").send({
        name: "", // Invalid name
        email: "invalid-email", // Invalid email
        password: "pass", // Too short password
      });

      expect(response.status).toBe(500);
    });
  });

  describe("POST /auth/login", () => {
    it("should login successfully and return tokens", async () => {
      const mockUser = {
        id: 1,
        name: "Test User",
        email: "test@example.com",
        password: "hashedpassword",
      };

      (prismaClient.user.findFirst as jest.Mock).mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (generateAccessToken as jest.Mock).mockReturnValue("fake-access-token");
      (generateRefreshToken as jest.Mock).mockReturnValue("fake-refresh-token");

      const response = await request(app).post("/auth/login").send({
        email: "test@example.com",
        password: "password123",
      });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        user: mockUser,
        accessToken: "fake-access-token",
      });
      expect(response.headers["set-cookie"]).toBeDefined();
    });

    it("should return 404 if user not found", async () => {
      (prismaClient.user.findFirst as jest.Mock).mockResolvedValue(null);

      const response = await request(app).post("/auth/login").send({
        email: "nonexistent@example.com",
        password: "password123",
      });

      expect(response.status).toBe(404);
    });

    it("should return 400 for incorrect password", async () => {
      const mockUser = {
        id: 1,
        name: "Test User",
        email: "test@example.com",
        password: "hashedpassword",
      };

      (prismaClient.user.findFirst as jest.Mock).mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      const response = await request(app).post("/auth/login").send({
        email: "test@example.com",
        password: "wrongpassword",
      });

      expect(response.status).toBe(400);
    });
  });

  describe("GET /auth/me", () => {
    it("should return the current user", async () => {
      const mockUser = {
        id: 1,
        name: "Test User",
        email: "test@example.com",
      };

      const response = await request(app)
        .get("/auth/me")
        .set("Authorization", "Bearer fake-token");

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockUser);
    });
  });

  describe("GET /auth/logout", () => {
    it("should clear the refresh token cookie", async () => {
      const response = await request(app)
        .get("/auth/logout")
        .set("Authorization", "Bearer fake-token");

      expect(response.status).toBe(200);
      expect(response.headers["set-cookie"]).toBeDefined();
    });
  });

  afterAll(() => {
    jest.resetAllMocks();
  });
});
