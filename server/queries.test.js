const db = require('./queries');
const request = require("supertest");
baseURL = 'http://localhost:3000';

const user = {
    username: 'Test',
    password: 'password',
}

// Users
describe('POST /register', () => {
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

describe('DELETE /users', () => {
    it('should return 204', async () => {
        await request(baseURL).post('/register').send(user);
        const response = await request(baseURL).delete(`/users/${user.username}`);
        expect(response.statusCode).toBe(204);
    });
});

// Carts
describe('POST /carts', () => {
    const item = {
        product_id: 1,
        quantity: 1
    }
    beforeAll(async () => {
        await request(baseURL).post('/register').send(user);
    });
    afterAll(async () => {
        await request(baseURL).delete(`/users/${user.username}`);
    });

    it('should add an item to a user\'s cart', async () => {
        let response = await request(baseURL).post(`/carts/${user.username}`).send(item);
        expect(response.statusCode).toBe(201);
        response = await request(baseURL).get(`/carts/${user.username}`);
        await request(baseURL).delete(`/carts/${user.username}`).send({product_id: item.product_id});
        expect(response.body.length >= 1).toBe(true);
        expect(response.body[0].name).toBe('Book');
        expect(response.body[0].quantity).toBe(1);
        
    });
    it('should return 400 for a bad request', async () => {
        const response = await request(baseURL).post(`/carts/${user.username}`).send({
            product_id: -1,
        });
        expect(response.statusCode).toBe(400);
    });
    it('should return 409 if the item already exists', async () => {
        await request(baseURL).post(`/carts/${user.username}`).send(item);
        const response = await request(baseURL).post(`/carts/${user.username}`).send(item);
        await request(baseURL).delete(`/carts/${user.username}`).send({product_id: item.product_id});
        expect(response.statusCode).toBe(409);
    });
});

describe('GET /carts', () => {
    const item = {
        product_id: 1,
        quantity: 1
    }
    beforeAll(async () => {
        await request(baseURL).post('/register').send(user);
        await request(baseURL).post(`/carts/${user.username}`).send(item);
    });
    afterAll(async () => {
        await request(baseURL).delete(`/carts/${user.username}`).send({product_id: item.product_id});
        await request(baseURL).delete(`/users/${user.username}`);
    });

    it('should return 200', async () => {
        const response = await request(baseURL).get(`/carts/${user.username}`);
        expect(response.statusCode).toBe(200);
    });
    it('should return 404 for a missing cart', async () => {
        const response = await request(baseURL).get('/carts/Test1');
        expect(response.statusCode).toBe(404);
    });
});

describe('PUT /carts', () => {
    const item = {
        product_id: 1,
        quantity: 1
    }
    beforeAll(async () => {
        await request(baseURL).post('/register').send(user);
        await request(baseURL).post(`/carts/${user.username}`).send(item);
    });
    afterAll(async () => {
        await request(baseURL).delete(`/carts/${user.username}`).send({product_id: item.product_id});
        await request(baseURL).delete(`/users/${user.username}`);
    });

    it('should return 200', async () => {
        const response = await request(baseURL).put(`/carts/${user.username}`).send({product_id: item.product_id, new_quantity: 5});
        expect(response.statusCode).toBe(200);
    });
    it('should update an item\'s quanity', async () => {
        await request(baseURL).put(`/carts/${user.username}`).send({product_id: item.product_id, new_quantity: 5});
        const response = await request(baseURL).get(`/carts/${user.username}`);
        expect(response.body[0].quantity).toBe(5);
    });
    it('should return 400 for a bad request', async () => {
        const response = await request(baseURL).put(`/carts/${user.username}`).send({product_id: -1});
        expect(response.statusCode).toBe(400);
    });
    it('should return 404 for a missing item', async () => {
        const response = await request(baseURL).put(`/carts/${user.username}`).send({product_id: 2, new_quantity: 2});
        expect(response.statusCode).toBe(404);
    });
});

describe('DELETE /carts', () => {
    const item = {
        product_id: 1,
        quantity: 1
    }
    beforeAll(async () => {
        await request(baseURL).post('/register').send(user);
        await request(baseURL).post(`/carts/${user.username}`).send(item);
    });
    afterAll(async () => {
        await request(baseURL).delete(`/carts/${user.username}`).send({product_id: item.product_id});
        await request(baseURL).delete(`/users/${user.username}`);
    });

    it('should return 204', async () => {
        const response = await request(baseURL).delete(`/carts/${user.username}`).send({product_id: item.product_id});
        await request(baseURL).post(`/carts/${user.username}`).send(item);
        expect(response.statusCode).toBe(204);
    });
    it('should return 404 for a missing item', async () => {
        const response = await request(baseURL).delete(`/carts/${user.username}`).send({product_id: 2});
        expect(response.statusCode).toBe(404);
    });
});