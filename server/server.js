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

app.use(session({
        secret: "f4z4gs$Gcg",
        cookie: {maxAge: 300000000, secure: true},
        saveUninitialized: false,
        resave: false,
    })
);

app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser((user, done) => {
    done(null, user.id);
});
passport.deserializeUser((id, done) => {
    return done(null, id);
});
passport.use(new LocalStrategy(db.verify));

//Endpoints
app.get('/', (req, res) => {
    res.send('Hello World');
});
app.post('/register', db.registerUser);
app.post('/login', 
    passport.authenticate('local', {failureRedirect: '/', failureMessage: true}),
    db.loginUser
);

app.listen(port, () => {
    console.log(`Listening on port ${port}`);
});