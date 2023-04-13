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
/product endpoints
    May want to allow single, multiple, or all products to be retrived, 
    which may require some limit.
    GET
    Should allow user to view a product and its information
    
*/

/*
/user endpoints
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

/*
/cart endpoints
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
/order endpoints
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
    findUserById
}