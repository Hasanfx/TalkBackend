import request from 'supertest';
import express from 'express';
import userRoutes from '../routes/userRoutes';

const app = express();
app.use(express.json());
app.use(userRoutes);

describe('User Routes', () => {
  it('should get all users', async () => {
    const response = await request(app).get('/users');
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
  });

  it('should get a user by ID', async () => {
    const response = await request(app).get('/users/1'); // Replace with a valid user ID
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('id', 1);
  });

  it('should update a user', async () => {
    const response = await request(app)
      .put('/users/1') // Replace with a valid user ID
      .send({ name: 'Updated User' });
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('name', 'Updated User');
  });
});
