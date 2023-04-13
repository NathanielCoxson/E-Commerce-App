const db = require('./queries');
const request = require("supertest");
baseURL = 'http://localhost:3000';

describe('POST /register', () => {
    const user = {
        username: 'Test',
        password: 'password',
    }

    it('should return 201', async () => {
        const response = await request(baseURL).post('/register').send(user);
        await request(baseURL).delete(`/users/${user.username}`).send(user);
        expect(response.statusCode).toBe(201);
    });
    it('should return 400 when using an existing username', async () => {
        await request(baseURL).post('/register').send(user);
        const response = await request(baseURL).post('/register').send(user);
        await request(baseURL).delete(`/users/${user.username}`).send(user);
        expect(response.statusCode).toBe(400);
    });
});

describe('GET /users', () => {
    const user = {
        username: 'Test',
        password: 'password',
    }
    beforeAll(async () => {
        await request(baseURL).post('/register').send(user);
    });
    afterAll(async () => {
        await request(baseURL).delete(`/users/${user.username}`);
    });
    
    it('should return 200', async () => {
        const response = await request(baseURL).get(`/users/${user.username}`);
        expect(response.statusCode).toBe(200);
        expect(response.body.username).toBe(user.username);
    });
    it('should return 200 when requesting all users', async () => {
        const response = await request(baseURL).get('/users');
        expect(response.statusCode).toBe(200);
        expect(response.body.length >= 1).toBe(true);
    });
});

describe("DELETE /users", () => {
    const user = {
        username: 'Test',
        password: 'password',
    }
    
    it('should return 204', async () => {
        await request(baseURL).post('/register').send(user);
        const response = await request(baseURL).delete(`/users/${user.username}`);
        expect(response.statusCode).toBe(204);
    });
});