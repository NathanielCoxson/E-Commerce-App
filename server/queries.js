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
    let usernameTaken = false;
    pool.query('SELECT * FROM users WHERE username = $1', [username], (error, result) => {
        if (result.rows != 0) {
            usernameTaken = true;
        }
    });
    if (usernameTaken) {
        res.status(400).send("Username already taken");
    }
    else {
        bcrypt.hash(req.body.password, 10, (err, hash) => {
            pool.query(
                'INSERT INTO users (username, hashed_password) VALUES($1, $2)', 
                [username, hash], 
                (error, result) => {
                    if (error) {
                        throw error;
                        res.status(400).send('Error creating new user.');
                    }
                    else {
                        res.status(201).send(`Added new user with username: ${req.body.username}.`);
                    }
            });
        });
    }  
}

module.exports = {
    registerUser
}