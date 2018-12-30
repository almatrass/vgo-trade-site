// Developed by Almatrass
const logins = App.require('server/routes/logins'),
      home = App.require('server/routes/home');

module.exports = app => {
  app.get('/', home);
  app.get(/^\/auth\/opskins(\/return)?$/, logins.opskins);
  app.get('/logout', logins.logout);
};