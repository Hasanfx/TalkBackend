import request from 'supertest';
import express from 'express';
import reactionRoutes from '../routes/reactionRoutes';

const app = express();
app.use(express.json());
app.use(reactionRoutes);

describe('Reaction Routes', () => {
  it('should create or update a reaction for a post', async () => {
    const response = await request(app)
      .post('/posts/1/reactions') // Replace with a valid post ID
      .send({ type: 'like' });
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('type', 'like');
  });

  it('should delete a reaction from a post', async () => {
    const response = await request(app)
      .delete('/posts/1/reactions'); // Replace with a valid post ID
    expect(response.status).toBe(200);
  });

  it('should get reactions for a post', async () => {
    const response = await request(app).get('/posts/1/reactions'); // Replace with a valid post ID
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
  });
});
