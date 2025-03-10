import { NextFunction } from 'express';
import { createComment, deleteComment } from '../../controllers/CommentController';
import { prismaClient } from '../../../server';
import { HttpException } from '../../exception/root';
import { CommentSchema } from '../../schema/comment';
import { ErrorHandler } from '../../schema/errorHandler';
import { ZodError } from 'zod'; // Importing ZodError

// Mock dependencies
jest.mock('../../../server', () => ({
  prismaClient: {
    comment: {
      create: jest.fn(),
      findFirst: jest.fn(),
      delete: jest.fn(),
      findUnique: jest.fn(),
    },
    post: {
      findFirst: jest.fn()
    }
  }
}));

jest.mock('../../schema/comment', () => ({
  CommentSchema: {
    parse: jest.fn()
  }
}));

jest.mock('../../schema/errorHandler', () => ({
  ErrorHandler: jest.fn((fn) => fn)
}));

describe('CommentController', () => {
  let mockReq: any;
  let mockRes: any;
  let mockNext: jest.MockedFunction<NextFunction>;

  beforeEach(() => {
    mockReq = {
      body: {},
      params: { postId: 1, commentId: 1 },
      user: { id: 1 },
    };
    mockRes = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis()
    };
    mockNext = jest.fn();
    jest.clearAllMocks();
  });

  describe('createComment', () => {
    it('should create a comment successfully', async () => {
      // Set up mocks
      mockReq.body = { content: 'Test comment' };
      const mockComment = { id: 1, content: 'Test comment' };
      
      (CommentSchema.parse as jest.Mock).mockReturnValue(true);
      (prismaClient.comment.create as jest.Mock).mockResolvedValue(mockComment);
      (prismaClient.post.findFirst as jest.Mock).mockResolvedValue({ id: 1 }); // Mocking the post existence

      // Call the function
      await ErrorHandler(createComment)(mockReq, mockRes, mockNext);

      // Assertions
      expect(CommentSchema.parse).toHaveBeenCalledWith(mockReq.body);
      expect(prismaClient.comment.create).toHaveBeenCalledWith({
        data: {
          content: mockReq.body.content,
          post: { connect: { id: 1 } },
          user: { connect: { id: Number(mockReq.user.id) } }
        },
        include: {
          user: true,
          post: true
        }
      });
      expect(mockRes.json).toHaveBeenCalledWith(mockComment);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle validation errors when creating a comment', async () => {
      const zodError = new ZodError([
        { code: 'invalid_type', expected: 'string', received: 'undefined', path: ['content'], message: 'Required' }
      ]);
      
      // Mock the CommentSchema.parse to throw a ZodError
      (CommentSchema.parse as jest.Mock).mockImplementation(() => {
        throw zodError;
      });

      // Call the wrapped function
      await ErrorHandler(createComment)(mockReq, mockRes, mockNext);

      // Verify that next was called with an HttpException instance
      expect(mockNext).toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalledWith(expect.any(HttpException));
    });
  });

  describe('deleteComment', () => {
    it('should delete a comment successfully', async () => {
      // Set up mocks
      const mockComment = { id: 1, content: 'Test comment' };
      (prismaClient.comment.findUnique as jest.Mock).mockResolvedValue(mockComment);
      (prismaClient.comment.delete as jest.Mock).mockResolvedValue(mockComment);

      // Call the function
      await ErrorHandler(deleteComment)(mockReq, mockRes, mockNext);

      // Assertions
      expect(prismaClient.comment.findUnique).toHaveBeenCalledWith({
        where: { id: Number(mockReq.params.commentId) },
      });
      expect(prismaClient.comment.delete).toHaveBeenCalledWith({
        where: { id: mockComment.id },
      });
      expect(mockRes.json).toHaveBeenCalledWith({ message: "Comment deleted successfully" });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle comment not found during deletion', async () => {
      (prismaClient.comment.findUnique as jest.Mock).mockResolvedValue(null);

      // Call the function
      await ErrorHandler(deleteComment)(mockReq, mockRes, mockNext);

      // Verify that next was called with an HttpException instance
      expect(mockNext).toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalledWith(expect.any(HttpException));
    });
  });

  afterAll(() => {
    jest.resetAllMocks();
  });
});
