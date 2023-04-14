const Pool = require('pg').Pool;
const pool = new Pool({
    user: 'me',
    host: 'localhost',
    database: 'e_commerce',
    password: 'password',
    port: 5432
});
const bcrypt = require('bcrypt');
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
    Should allow user to view a product and its information
    
*/

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
 * /users
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
 * /users/:username
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
 * /users/:username
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
 * /users/:username
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
}