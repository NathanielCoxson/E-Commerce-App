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