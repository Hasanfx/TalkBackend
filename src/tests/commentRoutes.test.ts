import request from 'supertest';
import express from 'express';
import commentRoutes from '../routes/commentRoutes';

const app = express();
app.use(express.json());
app.use(commentRoutes);

describe('Comment Routes', () => {
  it('should get comments for a post', async () => {
    const response = await request(app).get('/posts/1/comments'); // Replace with a valid post ID
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
  });

  it('should create a comment for a post', async () => {
    const response = await request(app)
      .post('/posts/1/comments') // Replace with a valid post ID
      .send({ content: 'This is a comment' });
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('content', 'This is a comment');
  });
});
