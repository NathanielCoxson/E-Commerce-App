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

// Products
describe('GET /products', () => {
    const product = {
        name: 'Test Product',
        price: 4.99,
        description: 'Sample description of a product.'
    };
    let id = null;
    
    beforeAll(async () => {
        const response = await request(baseURL).post('/products').send(product);
        id = response.body.id;
    });
    afterAll(async () => {
        await request(baseURL).delete(`/products/${id}`);
    });

    it('should return 200', async () => {
        const response = await request(baseURL).get(`/products/${id}`);
        expect(response.statusCode).toBe(200);
        expect(response.body.name).toBe(product.name);
        expect(response.body.price).toBe(product.price);
        expect(response.body.description).toBe(product.description);
    });
    it('should return 404 for a missing product', async () => {
        await request(baseURL).delete(`/products/${id}`);
        const response1 = await request(baseURL).get(`/products/${id}`);
        const response2 = await request(baseURL).post('/products').send(product);
        id = response2.body.id;
        expect(response1.statusCode).toBe(404);
    });
});

describe('POST /products', () => {
    const product = {
        name: 'Test Product',
        price: 4.99,
        description: 'Sample description of a product.'
    };

    it('should return 201', async () => {
        const response = await request(baseURL).post('/products').send(product);
        await request(baseURL).delete(`/products/${response.body.id}`);
        expect(response.statusCode).toBe(201);
    });
    it('should return the new product\'s id', async () => {
        const response = await request(baseURL).post('/products').send(product);
        const id = response.body.id;
        await request(baseURL).delete(`/products/${id}`);
        expect(id).toBeDefined;
    });
    it('should create a new product in the database', async () => {
        let response = await request(baseURL).post('/products').send(product);
        const id = response.body.id;
        response = await request(baseURL).get(`/products/${id}`);
        await request(baseURL).delete(`/products/${id}`);
        expect(response.body.name).toBe(product.name);
        expect(response.body.price).toBe(product.price);
        expect(response.body.description).toBe(product.description);
    });
});

describe('PUT /products', () => {
    const product = {
        name: 'Test Product',
        price: 4.99,
        description: 'Sample description of a product.'
    };
    const partialUpdate = {
        price: 3.99
    };
    const fullUpdate = {
        name: 'Test Product Updated',
        price: 2.99,
        description: 'Sample description of a product, updated.'
    };
    let id = null;

    beforeAll(async () => {
        const response = await request(baseURL).post('/products').send(product);
        id = response.body.id;
    }); 
    beforeEach(async () => {
        await request(baseURL).put(`/products/${id}`).send(product);
    });
    afterAll(async () => {
        await request(baseURL).delete(`/products/${id}`);
    });

    it('should return 200 and correctly update a product for a full update', async () => {
        const response = await request(baseURL).put(`/products/${id}`).send(fullUpdate);
        const updatedProduct = await request(baseURL).get(`/products/${id}`);
        expect(response.statusCode).toBe(200);
        expect(updatedProduct.body.name).toBe(fullUpdate.name);
        expect(updatedProduct.body.price).toBe(fullUpdate.price);
        expect(updatedProduct.body.description).toBe(fullUpdate.description);
    });
    it('should return 200 and correctly update a product for a partial update', async () => {
        const response = await request(baseURL).put(`/products/${id}`).send(partialUpdate);
        const updatedProduct = await request(baseURL).get(`/products/${id}`);
        expect(response.statusCode).toBe(200);
        expect(updatedProduct.body.name).toBe(product.name);
        expect(updatedProduct.body.price).toBe(partialUpdate.price);
        expect(updatedProduct.body.description).toBe(product.description);
    });
    it('should return 400 for a bad request', async () => {
        const emptyBody = await request(baseURL).put(`/products/${id}`).send({});
        const invalidValue = await request(baseURL).put(`/products/${id}`).send({
            price: 0
        });
        expect(emptyBody.statusCode).toBe(400);
        expect(invalidValue.statusCode).toBe(400);
    });
    it('should return 404 for a missing product', async () => {
        const response = await request(baseURL).put('/products/0').send(fullUpdate);
        expect(response.statusCode).toBe(404);
    });
});