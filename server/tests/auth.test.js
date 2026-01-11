const request = require('supertest');
const app = require('../index');

describe('Auth Routes', () => {
  describe('GET /auth/me', () => {
    it('should return 401 when not authenticated', async () => {
      const response = await request(app)
        .get('/auth/me');
      
      expect(response.status).toBe(401);
    });
  });

  describe('GET /auth/logout', () => {
    it('should return 200 when logging out', async () => {
      const response = await request(app)
        .get('/auth/logout');
      
      expect(response.status).toBe(200);
    });
  });
});
