import { Request, Response, NextFunction } from 'express';
import { createPost, updatePost, deletePost, getAllPosts, getPostById } from '../../controllers/PostController';
import { prismaClient } from '../../../server';
import { HttpException, ErrorCode } from '../../exception/root';
import { handleImageUpload } from '../../services/uploadImg';
import { ZodError } from 'zod';
import { PostSchema } from '../../schema/post';
import { ErrorHandler } from '../../schema/errorHandler';

// Define custom interface extending Request to include user property
interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    [key: string]: any;
  };
  file?: Express.Multer.File;
}

// Mock dependencies
jest.mock('../../../server', () => ({
  prismaClient: {
    post: {
      create: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
    }
  }
}));

jest.mock('../../services/uploadImg', () => ({
  handleImageUpload: jest.fn()
}));

jest.mock('../../schema/post', () => ({
  PostSchema: {
    parse: jest.fn()
  }
}));

// Mock the error handler
jest.mock('../../schema/errorHandler', () => ({
  ErrorHandler: jest.fn((fn) => fn)
}));

describe('PostController', () => {
  let mockReq: any;
  let mockRes: any;
  let mockNext: jest.MockedFunction<NextFunction>;

  beforeEach(() => {
    mockReq = {
      body: {},
      params: {},
      file: { buffer: Buffer.from('test-image') },
      user: { id: 1 },
    };
    mockRes = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis()
    };
    mockNext = jest.fn();
    jest.clearAllMocks();
  });

  describe('createPost', () => {
    it('should create a post successfully', async () => {
      mockReq.body = { content: 'Test content' };
      const mockFilePath = 'uploads/posts/test-image.jpg';
      const mockPost = { id: 1, content: 'Test content', postImg: mockFilePath };
      
      (handleImageUpload as jest.Mock).mockResolvedValue(mockFilePath);
      (PostSchema.parse as jest.Mock).mockReturnValue(true);
      (prismaClient.post.create as jest.Mock).mockResolvedValue(mockPost);

      await ErrorHandler(createPost)(mockReq, mockRes, mockNext);

      expect(handleImageUpload).toHaveBeenCalledWith(mockReq, 'posts');
      expect(PostSchema.parse).toHaveBeenCalledWith(mockReq.body);
      expect(prismaClient.post.create).toHaveBeenCalledWith({
        data: {
          content: mockReq.body.content,
          postImg: mockFilePath,
          author: { connect: { id: Number(mockReq.user.id) } }
        }
      });
      expect(mockRes.json).toHaveBeenCalledWith(mockPost);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle validation errors', async () => {
      const zodError = new ZodError([
        { code: 'invalid_type', expected: 'string', received: 'undefined', path: ['content'], message: 'Required' }
      ]);
      
      (PostSchema.parse as jest.Mock).mockImplementation(() => {
        throw zodError;
      });
      (handleImageUpload as jest.Mock).mockResolvedValue('some/path.jpg');

      const mockHttpException = new HttpException(
        ErrorCode.INVALID_DATA_400,
        400,
        'Invalid data'
      );
      
      await ErrorHandler(createPost)(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalledWith(mockHttpException);
    });


  });

  // Additional tests for updatePost, deletePost, getAllPosts, and getPostById would follow the same pattern...

  afterAll(() => {
    jest.resetAllMocks();
  });
});
