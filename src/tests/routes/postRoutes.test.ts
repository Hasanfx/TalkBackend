import request from "supertest";
import express from "express";
import { prismaClient } from "../../../server";
import postRoutes from "../../routes/postRoutes";
import { PostSchema } from "../../schema/post";
import path from "path";

// Mock dependencies
jest.mock("../../../server", () => ({
  prismaClient: {
    post: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findMany: jest.fn(),
    },
  },
}));

jest.mock("../../middlewares/auth", () => ({
  AuthMiddleware: jest.fn((req, res, next) => {
    req.user = { id: 1, name: "Test User" };
    next();
  }),
}));

jest.mock("../../middlewares/ownerPost", () => ({
  PostOwner: jest.fn((req, res, next) => next()),
}));



jest.mock("../../schema/post", () => ({
  PostSchema: {
    parse: jest.fn(),
  },
}));

// Setup express app for testing
const app = express();
app.use(express.json());
app.use("/posts", postRoutes);

describe("Post Routes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("GET /posts", () => {
    it("should return all posts", async () => {
      const mockPosts = [
        {
          id: 1,
          content: "Test post 1",
          author: { name: "User 1" },
          comments: [],
        },
        {
          id: 2,
          content: "Test post 2",
          author: { name: "User 2"},
          comments: [],
        },
      ];

      (prismaClient.post.findMany as jest.Mock).mockResolvedValue(mockPosts);

      const response = await request(app).get("/posts");

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockPosts);
      expect(prismaClient.post.findMany).toHaveBeenCalled();
    });
  });

  describe("GET /posts/:id", () => {
    it("should return a post by id", async () => {
      const mockPost = {
        id: 1,
        content: "Test post",
        author: {
          id: 1,
          name: "User 1",
        },
        comments: [],
        commentCount: 0,
      };

      (prismaClient.post.findUnique as jest.Mock).mockResolvedValue(mockPost);

      const response = await request(app).get("/posts/1");

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockPost);
      expect(prismaClient.post.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
        include: expect.any(Object),
      });
    });

    it("should return 404 if post not found", async () => {
      (prismaClient.post.findUnique as jest.Mock).mockResolvedValue(null);

      const response = await request(app).get("/posts/999");

      expect(response.status).toBe(404);
    });
  });

  describe("POST /posts/add", () => {

    it("should return 400 for invalid data when creating post", async () => {
      (PostSchema.parse as jest.Mock).mockImplementation(() => {
        throw new Error("Validation error");
      });

      const response = await request(app).post("/posts/add").field("user", "1");

      expect(response.status).toBe(400);
    });
  });
  afterAll(() => {
    jest.resetAllMocks();
  });
});
