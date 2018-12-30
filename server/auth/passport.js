// Developed by Almatrass
const passport = require('passport'),
      opStrategy = require('passport-opskins').Strategy,
      path = require('path'),
      config = require(path.join(__dirname, '..', '..', 'config', 'config.js')),
      request = require('request');

// When the user logs in...
passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((obj, done) => {
	done(null, obj);
});

// OPSkins strategy (written by me lmao)
let strat = new opStrategy({
  name: 'vgo-trade-site',
  returnURL: config.returnUrl,
  apiKey: config.opskinsApiKey,
  scopes: 'identity_basic', // Space-separated list of identities
  mobile: false, // Remove OPSkins NavBar
  permanent: false, // Maintain permanent access to the account
  debug: false // Displays error messages in the browser
}, (user, done) => {
  return done(null, user);
});

passport.use('opskins', strat);

module.exports = passport;