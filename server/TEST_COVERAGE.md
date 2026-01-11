# Test Coverage Documentation

## Current Test Implementation

The project includes basic test files using **Jest** and **Supertest** for API testing.

### Test Files Structure

```
server/
├── tests/
│   ├── auth.test.js      # Authentication route tests
│   ├── categories.test.js # Category management tests
│   └── emails.test.js     # Email operation tests
└── jest.config.js         # Jest configuration
```

## Current Test Coverage

### 1. Authentication Tests (`auth.test.js`)

**What's Tested:**
- ✅ GET `/auth/me` - Returns 401 when not authenticated
- ✅ GET `/auth/logout` - Returns 200 (logout endpoint)

**Test Code:**
```javascript
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
```

### 2. Category Tests (`categories.test.js`)

**What's Tested:**
- ✅ GET `/api/categories` - Returns 401 when not authenticated
- ✅ POST `/api/categories` - Returns 401 when not authenticated
- ✅ POST `/api/categories` - Returns 400 when name/description missing (placeholder)

**Test Code:**
```javascript
describe('Category Routes', () => {
  describe('GET /api/categories', () => {
    it('should return 401 when not authenticated', async () => {
      const response = await request(app)
        .get('/api/categories');
      
      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/categories', () => {
    it('should return 401 when not authenticated', async () => {
      const response = await request(app)
        .post('/api/categories')
        .send({ name: 'Test', description: 'Test description' });
      
      expect(response.status).toBe(401);
    });
  });
});
```

### 3. Email Tests (`emails.test.js`)

**What's Tested:**
- ✅ GET `/api/emails/category/:categoryId` - Returns 401 when not authenticated
- ✅ POST `/api/emails/fetch` - Returns 401 when not authenticated
- ✅ POST `/api/emails/bulk-delete` - Returns 401 when not authenticated
- ✅ POST `/api/emails/bulk-delete` - Returns 400 when emailIds missing (placeholder)

**Test Code:**
```javascript
describe('Email Routes', () => {
  describe('GET /api/emails/category/:categoryId', () => {
    it('should return 401 when not authenticated', async () => {
      const response = await request(app)
        .get('/api/emails/category/1');
      
      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/emails/fetch', () => {
    it('should return 401 when not authenticated', async () => {
      const response = await request(app)
        .post('/api/emails/fetch');
      
      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/emails/bulk-delete', () => {
    it('should return 401 when not authenticated', async () => {
      const response = await request(app)
        .post('/api/emails/bulk-delete')
        .send({ emailIds: [1, 2, 3] });
      
      expect(response.status).toBe(401);
    });
  });
});
```

## Running Tests

### Command
```bash
cd server
npm test
```

### With Coverage Report
```bash
cd server
npm test -- --coverage
```

This will generate a coverage report showing:
- Which files are tested
- Line coverage percentage
- Branch coverage
- Function coverage

## Test Configuration

**Jest Config (`jest.config.js`):**
```javascript
module.exports = {
  testEnvironment: 'node',
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/tests/'
  ],
  testMatch: [
    '**/tests/**/*.test.js'
  ]
};
```

## What's Missing (Future Enhancements)

The current tests are **basic authentication checks**. To have comprehensive test coverage, you would need:

### 1. **Authentication Mocking**
- Mock authenticated user sessions
- Test authenticated endpoints with valid users
- Test user isolation (users can't access other users' data)

### 2. **Database Mocking/Setup**
- Test database setup/teardown
- Seed test data
- Clean up after tests

### 3. **Full CRUD Tests**
- Create category (with authentication)
- Read categories (with authentication)
- Update category (with authentication)
- Delete category (with authentication)
- Test ownership verification

### 4. **Email Processing Tests**
- Mock Gmail API calls
- Mock OpenAI API calls
- Test email categorization logic
- Test email fetching flow

### 5. **Error Handling Tests**
- Test invalid input validation
- Test database errors
- Test API failures (Gmail, OpenAI)

### 6. **Integration Tests**
- Full user flow: login → create category → fetch emails → view emails
- Multi-user scenarios
- Concurrent operations

## Example Enhanced Test (Not Yet Implemented)

Here's what a more complete test might look like:

```javascript
describe('Category Routes - Authenticated', () => {
  let authCookie;
  let testUserId;

  beforeAll(async () => {
    // Setup: Create test user and authenticate
    // This would require database setup and session mocking
  });

  afterAll(async () => {
    // Cleanup: Remove test data
  });

  describe('POST /api/categories', () => {
    it('should create a category when authenticated', async () => {
      const response = await request(app)
        .post('/api/categories')
        .set('Cookie', authCookie)
        .send({ 
          name: 'Test Category', 
          description: 'Test description' 
        });
      
      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.name).toBe('Test Category');
    });

    it('should return 400 when name is missing', async () => {
      const response = await request(app)
        .post('/api/categories')
        .set('Cookie', authCookie)
        .send({ description: 'Test description' });
      
      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/categories', () => {
    it('should return only user\'s categories', async () => {
      const response = await request(app)
        .get('/api/categories')
        .set('Cookie', authCookie);
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      // Verify all categories belong to test user
      response.body.forEach(category => {
        expect(category.user_id).toBe(testUserId);
      });
    });
  });
});
```

## Summary

**Current Status:**
- ✅ Basic test infrastructure set up (Jest + Supertest)
- ✅ Authentication requirement tests (401 errors)
- ✅ Test scripts configured in package.json
- ⚠️ Limited to unauthenticated endpoint tests
- ⚠️ No database mocking/setup
- ⚠️ No authenticated user tests
- ⚠️ No integration tests

**To Run Tests:**
```bash
cd server
npm test
```

**To Improve Coverage:**
1. Add database test setup/teardown
2. Mock authentication for authenticated tests
3. Add tests for successful operations (not just 401 errors)
4. Add integration tests for full user flows
5. Mock external APIs (Gmail, OpenAI)
