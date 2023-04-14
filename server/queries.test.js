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

describe('PUT /users', () => {
    const user = {
        username: 'Test',
        password: 'password',
    }
    const fullUpdate = {
        username: 'update',
        fname: 'TestFirstName',
        lname: 'TestLastName',
        email: 'test@test.com',
    }
    const paritalUpdate = {
        email: 'partialUpdate@test.com',
    }
    const badRequest = {
        fname: new Array(100).join('o')
    }
    beforeEach(async () => {
        await request(baseURL).post('/register').send(user);
    });
    afterEach(async () => {
        await request(baseURL).delete(`/users/${user.username}`);
        await request(baseURL).delete(`/users/${fullUpdate.username}`);
        await request(baseURL).delete(`/users/${paritalUpdate.username}`);
    });

    it('should return 200 for a valid request', async () => {
        const response = await request(baseURL).put(`/users/${user.username}`).send(fullUpdate);
        expect(response.statusCode).toBe(200);
    });
    it('should return 404 for an invalid username', async () => {
        await request(baseURL).delete(`/users/${user.username}`);
        const response = await request(baseURL).put(`/users/${user.username}`).send(fullUpdate);
        expect(response.statusCode).toBe(404);
    });
    it('should update user when given all fields', async () => {
        await request(baseURL).put(`/users/${user.username}`).send(fullUpdate);
        const response = await request(baseURL).get(`/users/${fullUpdate.username}`);
        await request(baseURL).delete(`/users/${fullUpdate.username}`);
        expect(response.statusCode).toBe(200);
        expect(response.body.username).toBe(fullUpdate.username);
        expect(response.body.fname).toBe(fullUpdate.fname);
        expect(response.body.lname).toBe(fullUpdate.lname);
        expect(response.body.email).toBe(fullUpdate.email);
    });
    it('should only update certain fields when not all are provided', async () => {
        await request(baseURL).put(`/users/${user.username}`).send(fullUpdate);
        await request(baseURL).put(`/users/${fullUpdate.username}`).send(paritalUpdate);
        const response = await request(baseURL).get(`/users/${fullUpdate.username}`);
        expect(response.statusCode).toBe(200);
        expect(response.body).toBeDefined();
        expect(response.body.email).toBe(paritalUpdate.email);
        expect(response.body.username).toBe(fullUpdate.username);
        expect(response.body.fname).toBe(fullUpdate.fname);
        expect(response.body.lname).toBe(fullUpdate.lname);
    });
    it('should return 400 for a bad request', async () => {
        const response = await request(baseURL).put(`/users/${user.username}`).send(badRequest);
        expect(response.statusCode).toBe(400);
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