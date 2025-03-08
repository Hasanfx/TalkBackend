import { Request, Response, NextFunction } from 'express';
import { createPost } from '../../controllers/PostController';
import { prismaClient } from '../../../server';
import { HttpException, ErrorCode } from '../../exception/root';
import { handleImageUpload } from '../../services/uploadImg';
import { ZodError } from 'zod';
import { PostSchema } from '../../schema/post';
import { ErrorHandler } from '../../schema/errorHandler';

interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    [key: string]: any;
  };
  file?: Express.Multer.File;
}

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
      file: {
        buffer: Buffer.from('test-image'),
        fieldname: 'file',
        originalname: 'test.jpg',
        encoding: '7bit',
        mimetype: 'image/jpeg',
        size: 1024,
        destination: 'uploads/',
        filename: 'test.jpg',
        path: 'uploads/test.jpg'
      },
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
      // Set up the request with the correct structure
      mockReq.body = { 
        content: 'Test content',
        user: 1 // Add user ID to the body as expected by the controller
      };
      const mockFilePath = 'uploads/posts/test-image.jpg';
      const mockPost = { id: 1, content: 'Test content', postImg: mockFilePath };
      
      (handleImageUpload as jest.Mock).mockResolvedValue(mockFilePath);
      (PostSchema.parse as jest.Mock).mockReturnValue(true);
      (prismaClient.post.create as jest.Mock).mockResolvedValue(mockPost);

      await ErrorHandler(createPost)(mockReq, mockRes, mockNext);

      expect(handleImageUpload).toHaveBeenCalledWith(mockReq, 'posts');
      expect(PostSchema.parse).toHaveBeenCalledWith({ content: 'Test content' });
      expect(prismaClient.post.create).toHaveBeenCalledWith({
        data: {
          content: mockReq.body.content,
          postImg: mockFilePath,
          author: { connect: { id: Number(mockReq.body.user) } }
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

      await ErrorHandler(createPost)(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(HttpException));
    });
  });

  afterAll(() => {
    jest.resetAllMocks();
  });
});