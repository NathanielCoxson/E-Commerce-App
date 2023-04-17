const express = require('express');
const app = express();
const session = require('express-session');
const db = require('./queries.js');
const bodyParser = require('body-parser');
const passport = require('passport');
const LocalStrategy = require('passport-local');
const port = 3000;

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Setup session here, including settings.
app.use(session({
        secret: "f4z4gs$Gcg",
        cookie: {maxAge: 300000000, secure: true},
        saveUninitialized: false,
        resave: false,
    })
);

app.use(passport.initialize());
app.use(passport.session());

// Serialize user here and included any user
// information to identify that user.
passport.serializeUser((user, done) => {
    done(null, user.id);
});
// Deserialize user here and provide the
// same user identificaiton that was used
// to serialize the user.
passport.deserializeUser((id, done) => {
    return done(null, id);
});
passport.use(new LocalStrategy(db.verify));

//Endpoints
app.get('/', (req, res) => {
    res.send('Hello World');
});

// login and registration
app.post('/register', db.registerUser);
app.post('/login', 
    passport.authenticate('local', {failureRedirect: '/', failureMessage: true}),
    db.loginUser
);

// /users
app.get('/users/:username', db.getUserByUsername);
app.get('/users', db.getUsers);

app.put('/users/:username', db.updateUserByUsername);
app.delete('/users/:username', db.deleteUserByUsername);

// /orders
app.get('/orders/:username/:id', db.getOrder);
app.get('/orders/:username', db.getUserOrders);
app.get('/orders', db.getOrders);
app.post('/orders/:username', db.addOrder);
app.delete('/orders/:username', db.deleteOrder);

// /carts
app.post('/carts/:username', db.addToCart);
app.get('/carts/:username', db.getCart);
app.put('/carts/:username', db.updateCart);
app.delete('/carts/:username', db.deleteCartItem);

// /products
app.post('/products', db.addProduct);
app.get('/products', db.getProducts);
app.get('/products/:id', db.getProduct);
app.put('/products/:id', db.updateProduct);
app.delete('/products/:id', db.deleteProduct);




app.listen(port, () => {
    console.log(`Listening on port ${port}`);
});