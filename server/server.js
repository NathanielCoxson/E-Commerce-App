const express = require('express');
const db = require('./queries.js');
const bodyParser = require('body-parser');

const app = express();
const port = 3000;

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

//Endpoints
app.get('/', (req, res) => {
    res.send('Hello World');
});
app.post('/register', db.registerUser);

app.listen(port, () => {
    console.log(`Listening on port ${port}`);
});