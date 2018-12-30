// Developed by Almatrass
let env = process.env.NODE_ENV || 'development',
    packageJson = require('../package.json'),
    path = require('path'),
    express = require('express'),
    socket = require('socket.io'),
    config = require(path.join(__dirname, 'config.js')),
    myIo = require(path.join(__dirname, '..', 'server', 'sockets', 'io.js')),
    http = require('http'),
    session = require('express-session'),
    handlebars = require('express-handlebars'),
    cookieParser = require('cookie-parser'),
    socketSession = require('express-socket.io-session');

console.log(`Starting application in ${env} mode`);

/* ===============================================
                MAIN APP SETUP
=============================================== */
let sessionMiddleware = session({
	key: 'session_id',
  secret: 'almatrass',
  resave: false,
  saveUninitialized: true,
  cookie: {
		maxAge: 1000 * 60 * 60 * 24 * 365
	}
});
global.App = {
  config: config,
  app: express(),
  utils: require(path.join(__dirname, '..', 'server', 'utils', 'utils.js')),
  port: process.env.PORT || config.port,
  version: packageJson.version,
  root: path.join(__dirname, '..'),
  appPath: function(datPath) {
    return path.join(this.root, datPath);
  },
  require: function(datPath) {
    return require(this.appPath(datPath));
  },
  myPassport: require(path.join(__dirname, '..', 'server', 'auth', 'passport.js')),
  env: env,
  inventory: [],
  // Start the server:
  start: function() {
    if (!this.started) {
      this.started = true;
      
      this.server = http.Server(this.app);
      this.io = socket(this.server);
      
      this.server.listen(this.port);
      
      // io middleware
      this.io.use(socketSession(sessionMiddleware));
      
      myIo(this.io);
      console.log(`Started app version ${this.version} on port ${this.port} in ${this.env} mode`);
    }
  }
};

/* ===============================================
                MIDDLEWARE STUFF
=============================================== */
const Handlebars = handlebars.create({
	extname: '.html'
	, partialsDir: path.join(__dirname, '..', 'front', 'views', 'partials')
	, helpers: {
		getDecimalPercentage: function(decimal) {
			return parseInt(decimal * 100)
		}
	}
});

App.app.engine('html', Handlebars.engine);
App.app.set('view engine', 'html');
App.app.set('views', App.appPath('front/views'));

App.app.use(cookieParser());
App.app.use(sessionMiddleware);

App.app.use(App.myPassport.initialize());
App.app.use(App.myPassport.session());
App.app.use('/public', express.static(App.appPath('front/public')));

App.require('server/routes/routes.js')(App.app);

function onAuthorizeSuccess(data, accept) {
	accept();
}

function onAuthorizeFail(data, message, error, accept) {
	accept(null, !error);
}

App.require('server/intervals');