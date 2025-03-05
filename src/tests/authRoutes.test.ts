import request from 'supertest';
import express from 'express';
import authRoutes from '../routes/authRoutes';

const app = express();
app.use(express.json());
app.use(authRoutes);

describe('Auth Routes', () => {
  it('should register a new user', async () => {
    const response = await request(app)
      .post('/signup')
      .send({ name: 'Test User', email: 'test@example.com', password: 'password123' });
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('email', 'test@example.com');
  });

  it('should login an existing user', async () => {
    const response = await request(app)
      .post('/login')
      .send({ email: 'test@example.com', password: 'password123' });
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('accessToken');
  });

  it('should get user details', async () => {
    const response = await request(app)
      .get('/me')
      .set('Authorization', 'Bearer some_token'); // Replace with a valid token
    expect(response.status).toBe(200);
  });

  it('should logout a user', async () => {
    const response = await request(app)
      .get('/logout')
      .set('Authorization', 'Bearer some_token'); // Replace with a valid token
    expect(response.status).toBe(200);
  });
});
