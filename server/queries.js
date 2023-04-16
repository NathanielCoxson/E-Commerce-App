const Pool = require('pg').Pool;
const pool = new Pool({
    user: 'me',
    host: 'localhost',
    database: 'e_commerce',
    password: 'password',
    port: 5432
});
const bcrypt = require('bcrypt');
const { query } = require('express');
const saltRounds = 10;

/**
 * Logs a common response when a request is made to the server.
 * @param {string} type 
 * @param {string} endpoint 
 * @returns 
 */
const logRequest = (type, endpoint) => console.log(`${type} ${endpoint}`);

// Endpoint functions
/**
 * Accepts a username and password from the client as a
 * POST request and hashes the password. The username and
 * hashed password are then inserted into the database.
 * @param {Object} req Express request object
 * @param {Object} res Express response object
 */
const registerUser = (req, res) => {
    // logRequest('POST', '/register');
    let username = req.body.username;
    pool.query('SELECT * FROM users WHERE username = $1', [username], (error, result) => {
        if (error) {
            console.log(error);
        }
        else if (result.rows != 0) {
            res.status(400).send('Username already taken.');
        }
        else {
            bcrypt.hash(req.body.password, saltRounds, (err, hash) => {
                pool.query(
                    'INSERT INTO users (username, hashed_password) VALUES($1, $2)', 
                    [username, hash], 
                    (error, result) => {
                        if (error) {
                            console.log(error);
                            res.status(400).send('Error creating new user.');
                        }
                        else {
                            res.status(201).send(`Added new user with username: ${req.body.username}.`);
                        }
                });
            });
        } 
    });
     
}

const loginUser = (req, res) => {
    res.send('Login Successful.');
}

/*
/products endpoints
    May want to allow single, multiple, or all products to be retrived, 
    which may require some limit.
    GET
        Sends back an item's information.
    POST
        Adds an item to the database.
    PUT
        Updates an existing item.
    DELETE
        Deletes an item from the database.
*/
/**
 * POST /products
 * Adds a new product to the database.
 * @param {Object} req 
 * @param {Object} res 
 * @returns undefined
 */
const addProduct = (req, res) => {
    const { price, name, description } = req.body;

    /*
    Request Conditions:
        price is an float,
        name and description are strings
        price is > 0,
        all fields are present
    */
    const conditions = [
        price ? true : false, 
        name ? true : false, 
        description ? true : false,
        typeof(price) === 'number',
        typeof(name) === 'string',
        typeof(description) === 'string',
        price > 0
    ]
    if (conditions.every(cond => cond === true)) {
        const queryText = "INSERT INTO products VALUES(DEFAULT, $1, $2, $3) RETURNING id";
        pool.query(queryText, [price, name, description], (error, result) => {
            if (error) {
                console.log(error);
                res.status.send(500);
                return;
            }
            res.status(201).send(result.rows[0]);
        });
    }
    else {
        res.status(400).send();
        return;
    }
};

/**
 * GET /products/:id
 * Sends back the product with the given id.
 * @param {Object} req 
 * @param {Object} res 
 * @returns undefined
 */
const getProduct = (req, res) => {
    const id = req.params.id;
    const queryText = "SELECT name, price, description FROM products WHERE id = $1";
    pool.query(queryText, [id], (error, result) => {
        if (error) {
            console.log(error);
            res.status(500).send();
            return;
        }
        if (result.rowCount === 0) {
            res.status(404).send();
            return;
        }
        res.status(200).send(result.rows[0]);
    });
};

/**
 * GET /products
 * Sends back all of the products in the databse.
 * @param {Object} req 
 * @param {Object} res 
 * @returns undefined
 */
const getProducts = (req, res) => {
    // Consider limiting the number of returned objects
    // in the case that the table becomes very large.
    const queryText = "SELECT name, price, description FROM products";
    pool.query(queryText, (error, result) => {
        if (error) {
            res.status(500).send();
            return;
        }
        res.status(200).send(result.rows);
    });
};

/**
 * PUT /products/:id
 * Updates the product with the given id.
 * @param {Object} req 
 * @param {Object} res 
 * @returns undefined
 */
const updateProduct = async (req, res) => {
    const { price, name, description } = req.body;

    /*
        Request Conditions:
            At least one field must be provided
            price > 0 and is a number
            name and description are strings
    */
    conditions = [
        typeof(name) !== 'undefined' ||
        typeof(price) !== 'undefined' ||
        typeof(description) !== 'undefined',
        typeof(price) !== 'undefined' ? typeof(price) === 'number' && price > 0 : true,
        name ? typeof(name) === 'string' : true,
        typeof(description) !== 'undefined' ? typeof(description) === 'string' : true
    ];
    if (conditions.every(cond => cond === true)) {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            let queryText = 'SELECT price, name, description FROM products WHERE id = $1';
            const result = await client.query(queryText, [req.params.id]);
            if (result.rowCount === 0) {
                res.status(404).send();
                return;
            }
            let update = result.rows[0];
            update = {
                price: price ? price : update.price,
                name: name ? name : update.name,
                description: description ? description : update.description
            }
            queryText = 'UPDATE products SET price = $1, name = $2, description = $3 WHERE id = $4';
            await client.query(queryText, [
                update.price,
                update.name,
                update.description,
                req.params.id
            ]);
            await client.query('COMMIT');
        } catch (error) {
            await client.query('ROLLBACK');
            console.log(error);
            res.status(500).send();
            return;
        } finally {
            client.release();
        }
        res.status(200).send();
    }
    else {
        res.status(400).send();
        return;
    }
};

/**
 * DELETE /products/:id
 * Deletes the product with the given id from the database.
 * @param {Object} req 
 * @param {Object} res 
 * @returns undefined
 */
const deleteProduct = (req, res) => {
    const id = req.params.id;
    const queryText = 'DELETE FROM products WHERE id = $1';
    pool.query(queryText, [id], (error, result) => {
        if (error) {
            console.log(error);
            res.status(500).send();
            return;
        }
        if (result.rowCount === 0) {
            res.status(404).send();
            return;
        }
        res.status(204).send();
    });
};

/*
/users endpoints
    GET
        Allows the user to view their account.

    PUT
        Allows the user to update their account information

    DELETE
        Would allow user to delete their own account

    POST?
        Would be account creation, but should already
        be covered by /register unless /register is
        moved to /user/register? Maybe POST could happen
        after account creation to add additional user
        information such as name, address, email, etc.
*/
/**
 * GET /users
 * Returns all users from the database as an array of objects.
 * @param {Object} req 
 * @param {Object} res 
 */
const getUsers = (req, res) => {
    // logRequest('GET', '/users');
    pool.query('SELECT * FROM users', (error, result) => {
        if (error) {
            console.log(error);
            res.status(500).send();
        }
        else {
            res.status(200).send(result.rows);
        }
    })
}

/**
 * GET /users/:username
 * Returns the user with the given id from the database as an object.
 * @param {Object} req 
 * @param {Object} res 
 */
const getUserByUsername = (req, res) => {
    // logRequest('GET', '/users/:username');
    pool.query('SELECT * FROM users WHERE username = $1', [req.params.username], (error, result) => {
        if (error) {
            console.log(error);
            res.status(500).send();
        }
        else {
            res.status(200).json(result.rows[0]);
        }
    });
}

/**
 * PUT /users/:username
 * Updates a user's account information given their username.
 * @param {Object} req 
 * @param {Object} res 
 */
const updateUserByUsername = async (req, res) => {
    // logRequest('PUT', '/users/:username');
    const body = req.body;
    const maxFname = 50;
    const maxLname = 50;
    const maxEmail = 200;
    const maxUsername = 20;

    // Check request
    let badRequest = false;
    if (body.fname && body.fname.length > maxFname) {
        badRequest = true;
    }
    if (body.lname && body.lname.length > maxLname) {
        badRequest = true;
    }
    if (body.email && body.email.length > maxEmail) {
        badRequest = true;
    }
    if (body.username && body.username.length > maxUsername) {
        badRequest = true;
    }
    if (badRequest) {
        res.status(400).send();
        return;
    }

    const client = await pool.connect();
    let success = true;
    try {
        await client.query('BEGIN');
        let queryText = 'SELECT username, fname, lname, email FROM users WHERE username = $1';
        const result = await client.query(queryText, [req.params.username]);
        if (result.rowCount === 0) {
            success = false;
            // Not Found
            res.status(404).send();
        }
        else {
            let update = result.rows[0];
            update.fname = body.fname ? body.fname : update.fname;
            update.lname = body.lname ? body.lname : update.lname;
            update.email = body.email ? body.email : update.email;
            update.username = body.username ? body.username : update.username;
            let queryText = "\
                UPDATE users\
                SET fname = $1, \
                    lname = $2, \
                    email = $3, \
                    username = $4 \
                WHERE username = $5";
            await client.query(queryText, [
                update.fname, 
                update.lname, 
                update.email, 
                update.username, 
                req.params.username
            ]);
        }
        await client.query('COMMIT');
    } catch (error) {
        await client.query('ROLLBACK');
        console.log(error);
        success = false;
        // Server error
        res.status(500).send();
    } finally {
        client.release();
    }
    if (success) {
        // Success
        res.status(200).send();
    }
}

/**
 * DELETE /users/:username
 * Deletes the user with the given ID.
 * @param {Object} req 
 * @param {Object} res 
 */
const deleteUserByUsername = (req, res) => {
    // logRequest('DELETE', '/users/:username');
    pool.query('DELETE FROM users WHERE username = $1', [req.params.username], (error, result) => {
        if (error) {
            console.log(error);
            res.status(500).send('Server Error');
        }
        else if (result.rowCount === 0) {
            res.status(404).send('User not found.');
        }
        else if (result.rowCount === 1) {
            res.status(204).send();
        }
    });
}

/*
/carts endpoints
    GET
        Sends back the contents of a user's cart
    POST
        Add an new item to the user's cart
    DELETE
        Remove's an item from the user's cart
    POST
        Could change existing item, such as quantity
*/
/**
 * POST /carts/:username
 * Adds a new item to a user's cart.
 * @param {Object} req 
 * @param {Object} res 
 * @returns undefined
 */
const addToCart = (req, res) => {
    const { product_id, quantity } = req.body;
    // Check for a bad request
    if (
        !product_id || 
        product_id < 0 ||
        !quantity || 
        quantity < 0 ||
        !Number.isInteger(product_id) || 
        !Number.isInteger(quantity)
    ) {
        res.status(400).send();
        return;
    }
    const queryText = 'INSERT INTO cart_items VALUES($1, $2, $3)';
    pool.query(queryText, [req.params.username, product_id, quantity], (error, result) => {
        if (error) {
            if (error.detail.includes('already exists')) {
                res.status(409).send();
                return;
            }
            else {
                console.log(error);
                res.status(500).send();
                return;
            }  
        }
        res.status(201).send();
    });
}

/**
 * GET /carts/:username
 * Sends back a list of items in a user's cart.
 * @param {Object} req 
 * @param {Object} res 
 */
const getCart = (req, res) => {
    const username = req.params.username;
    const queryText = "\
    SELECT \
        products.name,\
        products.description,\
        cart_items.quantity,\
        products.price,\
        products.price * cart_items.quantity AS total_price\
    FROM cart_items, products\
    WHERE cart_items.product_id = products.id AND cart_items.username = $1";
    pool.query(queryText, [username], (error, result) => {
        if (error) {
            console.log(error);
            res.status(500).send();
            return;
        }
        if (result.rows.length === 0) {
            res.status(404).send();
            return;
        }
        res.status(200).send(result.rows);
    });
}

/**
 * PUT /carts/:username
 * Updates the quantity of an item in a user's cart.
 * @param {Object} req 
 * @param {Object} res 
 * @returns 
 */
const updateCart = (req, res) => {
    const username = req.params.username;
    const { product_id, new_quantity } = req.body;
    // Check request
    if (
        !product_id ||
        !new_quantity ||
        !Number.isInteger(product_id) || 
        !Number.isInteger(new_quantity) ||
        new_quantity < 0 ||
        product_id < 0
    ) {
      res.status(400).send();
      return;  
    }
    const queryText = "\
    UPDATE cart_items\
    SET quantity = $1\
    WHERE product_id = $2 AND username = $3";
    pool.query(queryText, [new_quantity, product_id, username], (error, result) => {
        if (error) {
            console.log(error);
            res.status(500).send();
            return;
        }
        if (result.rowCount === 0) {
            res.status(404).send();
            return;
        }
        res.status(200).send();
    });
}

/**
 * DELETE /carts/:username
 * Deletes an item from a user's cart with a given id.
 * @param {Object} req 
 * @param {Object} res 
 */
const deleteCartItem = (req, res) => {
    const username = req.params.username;
    const { product_id } = req.body;
    const queryText = "DELETE FROM cart_items WHERE username = $1 AND product_id = $2";
    pool.query(queryText, [username, product_id], (error, result) =>{
        if (error) {
            console.log(error);
            res.status(500).send();
            return;
        }
        if (result.rowCount === 0) {
            res.status(404).send();
            return;
        }
        res.status(204).send();
    });
};

/*
/orders endpoints
    GET
        Returns an order's information including:
        total price, contents, data placed, and ideally
        order status in a production environment.
    POST
        Place a new order using the current cart contents
    DELETE
        Would allow the user to cancel an existing order
    PUT?
        May or may not allow a user to alter an existing order.
        May not be needed in this application but this could include
        updating shipping address before order is shipped, updating
        contact info for the order, etc.
*/
/**
 * GET /orders
 * Sends back all of the orders in the database.
 * Only sends the id of the order, the user who placed the order,
 * and the date that it was placed.
 * @param {Object} req 
 * @param {Object} res 
 */
const getOrders = (req, res) => {
    // logRequest('GET', '/orders/:username');
    pool.query(
        'SELECT orders.date_placed \
         FROM orders, users \
         WHERE \
            orders.user_id = users.id AND \
            users.username = $1',
        [req.params.username],
        (error, result) => {
            if (error) {
                console.log(error);
                res.status(500).send('Server Error')
            }
            else if (result.rowCount === 0) {
                res.status(404).send('No orders found.');
            }
            else if (result.rowCount > 0) {
                res.status(200).send(result.rows);
            }
        }
    )
};

/**
 * GET /orders/:username
 * Sends back all of the orders placed by a specific user.
 * Only sends back the id, username, and date of the order.
 * @param {Object} req 
 * @param {Object} res 
 */
const getUserOrders = (req, res) => {

};

/**
 * GET /orders/:username/:id
 * Sends back a specific order that was placed by the given
 * user with the given order id. Body will be an object 
 * including a list of order item objects that contain
 * product data and total price, as well as a total sum
 * of all products in the order.
 * @param {Object} req 
 * @param {Object} res 
 */
const getOrder = (req, res) => {

};

/**
 * POST /orders/:username
 * Adds a new order to the database for the given username.
 * The order is created based on the current contents of the 
 * associated user's cart. 
 * @param {Object} req 
 * @param {Object} res 
 */
const addOrder = (req, res) => {

}


// Helper functions
/*
    Verification function used by Passport.js to authenticate a user given
    their username and password. The function queries the DB to find the 
    correct user by the username and then compares the hashed password with
    the password provided.
*/
function verify(username, password, cb) {
    pool.query('SELECT * FROM users WHERE username = $1', [username], (error, result) => {
        if (error) {
            return cb(error);
        }
        if (result.rowCount === 0) {
            return cb(null, false, {message: 'Incorrect username or password.'});
        }
        bcrypt.compare(password, result.rows[0].hashed_password, (err, correct) => {
            if (err) {
                return cb(err);
            }
            if (!correct) {
                return cb(null, false, {message: 'Incorrect username or password.'});
            }
            return cb(null, result.rows[0]);
        });
    });
}

module.exports = {
    registerUser,
    loginUser,
    verify,
    getUsers,
    getUserByUsername,
    updateUserByUsername,
    deleteUserByUsername,
    getOrders,
    addToCart,
    getCart,
    updateCart,
    deleteCartItem,
    addProduct,
    getProduct,
    getProducts,
    updateProduct,
    deleteProduct
}