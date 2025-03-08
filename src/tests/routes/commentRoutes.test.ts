import request from 'supertest';
import express from 'express';
import { prismaClient } from '../../../server';
import commentRoutes from '../../routes/commentRoutes';
import { AuthMiddleware } from '../../middlewares/auth';
import { commentOwner } from '../../middlewares/ownerComment';
import { CommentSchema } from '../../schema/comment';

// Mock dependencies
jest.mock('../../../server', () => ({
  prismaClient: {
    comment: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findFirstOrThrow: jest.fn(),
      delete: jest.fn()
    },
    post: {
      findFirst: jest.fn()
    }
  }
}));

jest.mock('../../middlewares/auth', () => ({
  AuthMiddleware: jest.fn((req, res, next) => {
    req.user = { id: 1, name: 'Test User', role: 'USER' };
    next();
  })
}));

jest.mock('../../middlewares/ownerComment', () => ({
  commentOwner: jest.fn((req, res, next) => next())
}));

jest.mock('../../schema/comment', () => ({
  CommentSchema: {
    parse: jest.fn()
  }
}));

// Setup express app for testing
const app = express();
app.use(express.json());
app.use('/comments', commentRoutes);

describe('Comment Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /comments/:postId', () => {
    it('should create a new comment', async () => {
      const mockPost = { id: 1, title: 'Test Post' };
      const mockComment = {
        id: 1,
        content: 'Test comment',
        userId: 1,
        postId: 1,
        user: { id: 1, name: 'Test User' },
        post: mockPost
      };

      (CommentSchema.parse as jest.Mock).mockReturnValue(true);
      (prismaClient.post.findFirst as jest.Mock).mockResolvedValue(mockPost);
      (prismaClient.comment.create as jest.Mock).mockResolvedValue(mockComment);

      const response = await request(app)
        .post('/comments/1')
        .send({ content: 'Test comment' });

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockComment);
      expect(prismaClient.comment.create).toHaveBeenCalledWith({
        data: {
          content: 'Test comment',
          post: { connect: { id: 1 } },
          user: { connect: { id: 1 } }
        },
        include: {
          user: true,
          post: true
        }
      });
    });

    it('should return 500 for invalid data', async () => {
      (CommentSchema.parse as jest.Mock).mockImplementation(() => {
        throw new Error('Validation error');
      });

      const response = await request(app)
        .post('/comments/1')
        .send({ content: '' }); // Empty content

      expect(response.status).toBe(500);
    });

    it('should return 404 if post not found', async () => {
      (CommentSchema.parse as jest.Mock).mockReturnValue(true);
      (prismaClient.post.findFirst as jest.Mock).mockResolvedValue(null);

      const response = await request(app)
        .post('/comments/999')
        .send({ content: 'Test comment' });

      expect(response.status).toBe(404);
    });
  });

  describe('DELETE /comments/:commentId', () => {
    it('should delete a comment', async () => {
      const mockComment = {
        id: 1,
        content: 'Test comment',
        userId: 1,
        postId: 1
      };

      (prismaClient.comment.findUnique as jest.Mock).mockResolvedValue(mockComment);
      (prismaClient.comment.delete as jest.Mock).mockResolvedValue(mockComment);

      const response = await request(app)
        .delete('/comments/1');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ message: 'Comment deleted successfully' });
      expect(prismaClient.comment.delete).toHaveBeenCalledWith({
        where: { id: 1 }
      });
    });

    it('should return 404 if comment not found', async () => {
      (prismaClient.comment.findUnique as jest.Mock).mockResolvedValue(null);

      const response = await request(app)
        .delete('/comments/999');

      expect(response.status).toBe(404);
    });

    it('should check comment ownership before deletion', async () => {
      // Override the mock for this specific test
      (commentOwner as jest.Mock).mockImplementation((req, res, next) => {
        // Simulate unauthorized access
        const error = { statusCode: 401, message: 'Unauthorized' };
        res.status(401).json({ message: 'Unauthorized' });
      });

      const response = await request(app)
        .delete('/comments/1');

      expect(response.status).toBe(401);
      expect(prismaClient.comment.delete).not.toHaveBeenCalled();
    });
  });

  afterAll(() => {
    jest.resetAllMocks();
  });
});
