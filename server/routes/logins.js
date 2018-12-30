// Developed by Almatrass
let myPassport = App.require('server/auth/passport.js');

module.exports = {
  opskins: myPassport.authenticate('opskins', {
    successRedirect: '/',
    failureRedirect: '/'
  }),
  logout: (req, res) => {
    req.logout();
    res.redirect('/');
  }
};