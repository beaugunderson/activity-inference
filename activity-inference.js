'use strict';

var bodyParser = require('body-parser');
var express = require('express');
var morgan = require('morgan');
var passport = require('passport');
var session = require('express-session');
var swig = require('swig');
// var _ = require('lodash');

var WithingsStrategy = require('passport-withings').Strategy;

passport.use(new WithingsStrategy({
  clientID: process.env.WITHINGS_KEY,
  clientSecret: process.env.WITHINGS_SECRET,
  callbackURL: process.env.WITHINGS_CALLBACK_URL,
  passReqToCallback: true
}, function (req, accessToken, refreshToken, profile, done) {
  profile.accessToken = accessToken;
  profile.refreshToken = refreshToken;

  done(null, profile);
}));

var DEBUG = process.env.DEBUG;
var PORT = process.env.PORT;

var app = express();

app.engine('html', swig.renderFile);

app.set('view engine', 'html');
app.set('views', './views');

if (DEBUG) {
  app.set('view cache', false);
}

swig.setDefaults({
  cache: false,
  locals: {
    FIREBASE_ROOT: process.env.FIREBASE_ROOT
  }
});

app.use(morgan('dev'));

app.use(express.static('./static'));

app.use(require('cookie-parser')());

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

app.use(session({
  resave: true,
  saveUninitialized: true,
  secret: process.env.SESSION_SECRET
}));

app.use(passport.initialize());
app.use(passport.session());

// If needed we can store a subset of data to the cookie
passport.serializeUser(function (user, done) {
  done(null, user);
});

passport.deserializeUser(function (user, done) {
  done(null, user);
});

app.get('/auth/withings', passport.authenticate('withings'));

app.get('/auth/withings/callback',
  passport.authenticate('withings', {failureRedirect: '/auth/withings'}),
  function (req, res) {
    res.redirect('/');
  });

app.listen(PORT, function () {
  console.log('Listening on port', PORT);
});
