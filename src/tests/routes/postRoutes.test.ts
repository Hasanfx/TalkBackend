import request from "supertest";
import express from "express";
import { prismaClient } from "../../../server";
import postRoutes from "../../routes/postRoutes";
import { AuthMiddleware } from "../../middlewares/auth";
import { PostOwner } from "../../middlewares/ownerPost";
import { handleImageUpload } from "../../services/uploadImg";
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

jest.mock("../../services/uploadImg", () => ({
  handleImageUpload: jest.fn(),
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
          postImg: "/uploads/posts/test1.jpg",
          author: { name: "User 1", profileImg: "/uploads/profile/user1.jpg" },
          comments: [],
        },
        {
          id: 2,
          content: "Test post 2",
          postImg: "/uploads/posts/test2.jpg",
          author: { name: "User 2", profileImg: "/uploads/profile/user2.jpg" },
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
        postImg: "/uploads/posts/test.jpg",
        author: {
          id: 1,
          name: "User 1",
          profileImg: "/uploads/profile/user1.jpg",
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
    it("should create a new post", async () => {
      const mockPost = {
        id: 1,
        content: "New post",
        postImg: "/uploads/posts/new-post.jpg",
        authorId: 1,
      };

      (handleImageUpload as jest.Mock).mockResolvedValue(
        "/uploads/posts/new-post.jpg"
      );
      (PostSchema.parse as jest.Mock).mockReturnValue(true);
      (prismaClient.post.create as jest.Mock).mockResolvedValue(mockPost);

      const response = await request(app)
        .post("/posts/add")
        .field("content", "New post")
        .field("user", "1")
        .attach(
          "image",
          path.join(__dirname, "../../tests/fixtures/test-profile.jpg")
        );

      expect(response.status).toBe(201);
      expect(response.body).toEqual(mockPost);
      expect(prismaClient.post.create).toHaveBeenCalledWith({
        data: {
          content: "New post",
          postImg: "/uploads/posts/new-post.jpg",
          author: { connect: { id: 1 } },
        },
      });
    });

    it("should return 400 for invalid data", async () => {
      (PostSchema.parse as jest.Mock).mockImplementation(() => {
        throw new Error("Validation error");
      });

      const response = await request(app)
        .post("/posts/add")
        .field("user", "1")
        .attach(
          "image",
          path.join(__dirname, "../../tests/fixtures/test-profile.jpg")
        );

      expect(response.status).toBe(400);
    });
  });

  describe("PUT /posts/:id", () => {
    it("should update a post", async () => {
      const mockPost = {
        id: 1,
        content: "Updated post",
        postImg: "/uploads/posts/updated-post.jpg",
      };

      (prismaClient.post.findFirst as jest.Mock).mockResolvedValue({
        id: 1,
        content: "Original post",
      });
      (handleImageUpload as jest.Mock).mockResolvedValue(
        "/uploads/posts/updated-post.jpg"
      );
      (PostSchema.parse as jest.Mock).mockReturnValue(true);
      (prismaClient.post.update as jest.Mock).mockResolvedValue(mockPost);

      const response = await request(app)
        .put("/posts/1")
        .field("content", "Updated post")
        .attach(
          "file",
          path.join(__dirname, "../../tests/fixtures/test-profile.jpg")
        );

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockPost);
      expect(prismaClient.post.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: {
          content: "Updated post",
          postImg: "/uploads/posts/updated-post.jpg",
        },
      });
    });

    it("should return 404 if post not found", async () => {
      (prismaClient.post.findFirst as jest.Mock).mockResolvedValue(null);

      const response = await request(app)
        .put("/posts/999")
        .field("content", "Updated post")
        .attach(
          "file",
          path.join(__dirname, "../../tests/fixtures/test-profile.jpg")
        );

      expect(response.status).toBe(404);
    });
  });

  describe("DELETE /posts/:id", () => {
    it("should delete a post", async () => {
      const mockPost = { id: 1, content: "Post to delete" };

      (prismaClient.post.findFirst as jest.Mock).mockResolvedValue(mockPost);
      (prismaClient.post.delete as jest.Mock).mockResolvedValue(mockPost);

      const response = await request(app).delete("/posts/1");

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockPost);
      expect(prismaClient.post.delete).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });

    it("should return 404 if post not found", async () => {
      (prismaClient.post.findFirst as jest.Mock).mockResolvedValue(null);

      const response = await request(app).delete("/posts/999");

      expect(response.status).toBe(404);
    });
  });

  afterAll(() => {
    jest.resetAllMocks();
  });
});
