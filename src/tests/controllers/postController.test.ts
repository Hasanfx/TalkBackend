import { Request, Response, NextFunction } from 'express';
import { createPost, updatePost, deletePost, getAllPosts, getPostById } from '../../controllers/PostController';
import { prismaClient } from '../../../server';
import { HttpException, ErrorCode } from '../../exception/root';
import { handleImageUpload } from '../../services/uploadImg';
import { ZodError } from 'zod';
import { PostSchema } from '../../schema/post';

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
      // Set up mocks
      mockReq.body = { content: 'Test content' };
      const mockFilePath = 'uploads/posts/test-image.jpg';
      const mockPost = { id: 1, content: 'Test content', postImg: mockFilePath };
      
      (handleImageUpload as jest.Mock).mockResolvedValue(mockFilePath);
      (PostSchema.parse as jest.Mock).mockReturnValue(true);
      (prismaClient.post.create as jest.Mock).mockResolvedValue(mockPost);

      // Call the function
      await createPost(mockReq, mockRes, mockNext);

      // Assertions
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
      
      // Mock the PostSchema.parse to throw a ZodError
      (PostSchema.parse as jest.Mock).mockImplementation(() => {
        throw zodError;
      });
      (handleImageUpload as jest.Mock).mockResolvedValue('some/path.jpg');

      // Create a mock HttpException object that matches actual implementation
      const mockHttpException = new HttpException(
        ErrorCode.INVALID_DATA_400,
        400,
        'Invalid data'
      );
      
      // Mock the next function to simulate what happens in the controller
      mockNext.mockImplementation((error) => {
        if (error instanceof Error) {
          return error;
        }
        return new Error('Unknown error occurred');
      });

      await createPost(mockReq, mockRes, mockNext);

      // Verify that next was called with an HttpException instance
      expect(mockNext).toHaveBeenCalled();
      
      // Create a custom matcher to check just the properties we care about
      expect(mockNext.mock.calls[0][0]).toEqual(
        expect.objectContaining({
          statusCode: 400,
          code: ErrorCode.INVALID_DATA_400,
        })
      );
    });

    it('should handle general errors during creation', async () => {
      const error = new Error('Database connection error');
      
      (handleImageUpload as jest.Mock).mockResolvedValue('some/path.jpg');
      (PostSchema.parse as jest.Mock).mockReturnValue(true);
      (prismaClient.post.create as jest.Mock).mockRejectedValue(error);
      
      // Mock the next function to return the HttpException properly
      mockNext.mockImplementation((err) => {
        if (err instanceof HttpException) {
          return err;
        }
        return new Error('Unknown error occurred');
      });

      await createPost(mockReq, mockRes, mockNext);

      // Verify that next was called with an HttpException with the correct properties
      const nextArg = mockNext.mock.calls[0][0];
      expect(nextArg).toEqual(
        expect.objectContaining({
          statusCode: 100,
          code: ErrorCode.GENERAL_EXCEPTION_500,
          message: 'Database connection error'
        })
      );
    });
  });

  describe('updatePost', () => {
    it('should update a post successfully', async () => {
      // Set up mocks
      mockReq.params = { id: '1' };
      mockReq.body = { content: 'Updated content' };
      mockReq.file = null; // Explicitly set file to null to indicate no new image
      
      const existingPost = { id: 1, content: 'Old content', postImg: 'old/path.jpg' };
      const updatedPost = { id: 1, content: 'Updated content', postImg: 'old/path.jpg' };
      
      (PostSchema.parse as jest.Mock).mockReturnValue(true);
      (prismaClient.post.findFirst as jest.Mock).mockResolvedValue(existingPost);
      (prismaClient.post.update as jest.Mock).mockResolvedValue(updatedPost);

      // Call the function
      await updatePost(mockReq, mockRes, mockNext);

      // Assertions
      expect(PostSchema.parse).toHaveBeenCalledWith(mockReq.body);
      expect(prismaClient.post.findFirst).toHaveBeenCalledWith({
        where: { id: Number(mockReq.params.id) }
      });
      expect(prismaClient.post.update).toHaveBeenCalledWith({
        where: { id: existingPost.id },
        data: {
          content: mockReq.body.content,
          postImg: existingPost.postImg
        }
      });
      expect(mockRes.json).toHaveBeenCalledWith(updatedPost);
    });

    it('should handle post not found during update', async () => {
      mockReq.params = { id: '999' };
      mockReq.body = { content: 'Updated content' };
      
      (PostSchema.parse as jest.Mock).mockReturnValue(true);
      (prismaClient.post.findFirst as jest.Mock).mockResolvedValue(null);
      
      // Mock the next function to create an HttpException
      mockNext.mockImplementation((err) => {
        if (err instanceof HttpException) {
          return err;
        }
        return new Error('Unknown error occurred');
      });

      await updatePost(mockReq, mockRes, mockNext);

      const nextArg = mockNext.mock.calls[0][0];
      expect(nextArg).toEqual(
        expect.objectContaining({
          statusCode: 404,
          code: ErrorCode.NOT_FOUND_404
        })
      );
      expect(prismaClient.post.update).not.toHaveBeenCalled();
    });

    it('should update with new image if provided', async () => {
      mockReq.params = { id: '1' };
      mockReq.body = { content: 'Updated content' };
      mockReq.file = { buffer: Buffer.from('new-image') };
      
      const existingPost = { id: 1, content: 'Old content', postImg: 'old/path.jpg' };
      const newFilePath = 'uploads/posts/new-image.jpg';
      const updatedPost = { id: 1, content: 'Updated content', postImg: newFilePath };
      
      (PostSchema.parse as jest.Mock).mockReturnValue(true);
      (prismaClient.post.findFirst as jest.Mock).mockResolvedValue(existingPost);
      (handleImageUpload as jest.Mock).mockResolvedValue(newFilePath);
      (prismaClient.post.update as jest.Mock).mockResolvedValue(updatedPost);

      await updatePost(mockReq, mockRes, mockNext);

      expect(handleImageUpload).toHaveBeenCalledWith(mockReq, 'posts');
      expect(prismaClient.post.update).toHaveBeenCalledWith({
        where: { id: existingPost.id },
        data: {
          content: mockReq.body.content,
          postImg: newFilePath
        }
      });
    });
  });

  describe('deletePost', () => {
    it('should delete a post successfully', async () => {
      // Set up mocks
      mockReq.params = { id: '1' };
      const existingPost = { id: 1, content: 'Some content', postImg: 'path.jpg' };
      
      (prismaClient.post.findFirst as jest.Mock).mockResolvedValue(existingPost);
      (prismaClient.post.delete as jest.Mock).mockResolvedValue(existingPost);

      // Call the function
      await deletePost(mockReq, mockRes, mockNext);

      // Assertions
      expect(prismaClient.post.findFirst).toHaveBeenCalledWith({
        where: { id: Number(mockReq.params.id) }
      });
      expect(prismaClient.post.delete).toHaveBeenCalledWith({
        where: { id: existingPost.id }
      });
      expect(mockRes.json).toHaveBeenCalledWith(existingPost);
    });

    it('should handle post not found during delete', async () => {
      mockReq.params = { id: '999' };
      
      (prismaClient.post.findFirst as jest.Mock).mockResolvedValue(null);
      
      // Mock the next function properly
      mockNext.mockImplementation((err) => {
        if (err instanceof HttpException) {
          return err;
        }
        return new Error('Unknown error occurred');
      });

      await deletePost(mockReq, mockRes, mockNext);

      const nextArg = mockNext.mock.calls[0][0];
      expect(nextArg).toEqual(
        expect.objectContaining({
          statusCode: 404,
          code: ErrorCode.NOT_FOUND_404
        })
      );
      expect(prismaClient.post.delete).not.toHaveBeenCalled();
    });
  });

  describe('getAllPosts', () => {
    it('should return all posts with formatted data', async () => {
      const mockPosts = [
        {
          id: 1,
          content: 'Post 1',
          postImg: 'path1.jpg',
          createdAt: new Date(),
          author: { name: 'User 1', profileImg: 'profile1.jpg' },
          reactions: [{ type: 'like', userId: 2 }],
          comments: [
            {
              id: 1,
              content: 'Comment 1',
              createdAt: new Date(),
              updatedAt: new Date(),
              userId: 2,
              user: { name: 'User 2', profileImg: 'profile2.jpg' }
            }
          ]
        }
      ];
      
      (prismaClient.post.findMany as jest.Mock).mockResolvedValue(mockPosts);

      await getAllPosts(mockReq, mockRes, mockNext);

      expect(prismaClient.post.findMany).toHaveBeenCalledWith({
        include: expect.objectContaining({
          author: expect.any(Object),
          reactions: expect.any(Object),
          comments: expect.any(Object)
        }),
        orderBy: { createdAt: 'desc' }
      });
      
      expect(mockRes.json).toHaveBeenCalledWith([
        {
          ...mockPosts[0],
          reactionCount: 1
        }
      ]);
    });

    it('should handle errors when fetching all posts', async () => {
      const error = new Error('Database error');
      
      (prismaClient.post.findMany as jest.Mock).mockRejectedValue(error);
      
      // Mock the next function properly
      mockNext.mockImplementation((err) => {
        if (err instanceof HttpException) {
          return err;
        }
        return new Error('Unknown error occurred');
      });

      await getAllPosts(mockReq, mockRes, mockNext);

      const nextArg = mockNext.mock.calls[0][0];
      expect(nextArg).toEqual(
        expect.objectContaining({
          statusCode: 100,
          code: ErrorCode.GENERAL_EXCEPTION_500,
          message: 'Database error'
        })
      );
      expect(mockRes.json).not.toHaveBeenCalled();
    });
  });

  describe('getPostById', () => {
    it('should return a post by id with counts', async () => {
      mockReq.params = { id: '1' };
      
      const mockPost = {
        id: 1,
        content: 'Post 1',
        postImg: 'path1.jpg',
        author: { id: 1, name: 'User 1', profileImg: 'profile1.jpg' },
        reactions: [{ type: 'like', userId: 2 }],
        comments: [
          {
            id: 1,
            content: 'Comment 1',
            createdAt: new Date(),
            updatedAt: new Date(),
            userId: 2,
            user: { id: 2, name: 'User 2', profileImg: 'profile2.jpg' }
          }
        ]
      };
      
      (prismaClient.post.findUnique as jest.Mock).mockResolvedValue(mockPost);

      await getPostById(mockReq, mockRes, mockNext);

      expect(prismaClient.post.findUnique).toHaveBeenCalledWith({
        where: { id: Number(mockReq.params.id) },
        include: expect.objectContaining({
          author: expect.any(Object),
          reactions: expect.any(Object),
          comments: expect.any(Object)
        })
      });
      
      expect(mockRes.json).toHaveBeenCalledWith({
        ...mockPost,
        reactionCount: 1,
        commentCount: 1
      });
    });

    it('should handle post not found when getting by id', async () => {
      mockReq.params = { id: '999' };
      
      (prismaClient.post.findUnique as jest.Mock).mockResolvedValue(null);
      
      // Implement proper handling for HttpException
      mockNext.mockImplementation((err) => {
        if (err instanceof HttpException) {
          return err;
        }
        return new Error('Unknown error occurred');
      });

      await getPostById(mockReq, mockRes, mockNext);

      const nextArg = mockNext.mock.calls[0][0];
      expect(nextArg).toEqual(
        expect.objectContaining({
          statusCode: 404,
          code: ErrorCode.NOT_FOUND_404,
          message: 'Post not found'
        })
      );
      expect(mockRes.json).not.toHaveBeenCalled();
    });

    it('should handle errors when fetching a post by id', async () => {
      mockReq.params = { id: '1' };
      const error = new Error('Database error');
      
      (prismaClient.post.findUnique as jest.Mock).mockRejectedValue(error);
      
      // Properly handle HttpException objects
      mockNext.mockImplementation((err) => {
        if (err instanceof HttpException) {
          return err;
        }
        return new Error('Unknown error occurred');
      });

      await getPostById(mockReq, mockRes, mockNext);

      const nextArg = mockNext.mock.calls[0][0];
      expect(nextArg).toEqual(
        expect.objectContaining({
          statusCode: 100,
          code: ErrorCode.GENERAL_EXCEPTION_500,
          message: 'Database error'
        })
      );
      expect(mockRes.json).not.toHaveBeenCalled();
    });
  });
  
  // Add a proper afterAll to close any open handles
  afterAll(() => {
    jest.resetAllMocks();
  });
});