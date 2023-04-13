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

// Endpoint functions
/**
 * Accepts a username and password from the client as a
 * POST request and hashes the password. The username and
 * hashed password are then inserted into the database.
 * @param {Object} req Express request object
 * @param {Object} res Express response object
 */
const registerUser = (req, res) => {
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
    console.log('Hello');
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
    pool.query('SELECT * FROM users WHERE username = $1', [req.params.username], (error, result) => {
        if (error) {
            console.log(error);
            res.status(500).send();
        }
        else {
            res.status(200).send(result.rows[0]);
        }
    });
}

/**
 * /users/:username
 * Updates a user's account information given their username.
 * @param {Object} req 
 * @param {Object} res 
 */
const updateUserByUsername = (req, res) => {
    const update = req.body;
    // NOTE: NEED TO CHANGE TO A CHAIN OF OPTIONAL QUERIES 
    // SO THAT VALUES ALREADY IN DB ARE NOT SET TO NULL
    // WHEN THEY ARE NOT PROVIDED, OR CHANGE TO MULTIPLE FUNCTIONS.
    pool.query(
        'UPDATE users \
        SET username = $1, fname = $2, lname = $3, email = $4 \
        WHERE username = $5',
        [
            update.username || req.params.username,
            update.fname || null,
            update.lname || null,
            update.email || null,
            req.params.username
        ],
        (error, result) => {
            if (error) {
                console.log(error);
                res.status(500).send();
            }
            else if (result.rowCount === 0) {
                res.status(400).send('Invalid update.')
            }
            else {
                res.status(200).send();
            }
        }
    )
}

/**
 * /users/:username
 * Deletes the user with the given ID.
 * @param {Object} req 
 * @param {Object} res 
 */
const deleteUserByUsername = (req, res) => {
    pool.query('DELETE FROM users WHERE username = $1', [req.params.username], (error, result) => {
        if (error) {
            console.log(error);
            res.status(500).send('Server Error.');
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

// Returns user object from the DB given a specific ID.
const findUserById = id => {
    pool.query('SELECT * FROM users WHERE id = $1', [id], (error, result) => {
        if (error) {
            throw error;
        }
        if (result.rowCount === 0) {
            return {};
        }
        return result.rows[0];
    })
}

module.exports = {
    registerUser,
    loginUser,
    verify,
    findUserById,
    getUsers,
    getUserByUsername,
    updateUserByUsername,
    deleteUserByUsername,
}