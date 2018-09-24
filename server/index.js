// This code was written by Almatrass. 
// It is free to use however you wish.

// Require basic modules
const http = require('http');
const path = require('path');
const express = require('express');
const handlebars = require('express-handlebars');
const socket = require('socket.io');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const passport = require('passport');
const socketSession = require('express-socket.io-session')
const totp = require('notp').totp;
const base32 = require('thirty-two');

// Passport strategy stuff
const CustomStrategy = require('passport-custom');

const opAuth = require('opskins-oauth');

// Require expresstrade module
const ExpressTrade = require('expresstrade');

// Config file
const config = require(path.join(__dirname, '..', 'config', 'config.js'));

// Create new expresstrade instance
const ET = new ExpressTrade({
  apikey: config.opskinsApiKey,
  twofactorsecret: config.opskinsSecret,
	pollInterval: config.opskinsPollInterval * 1000
});

// When a sent trade is accepted...
ET.on('offerAccepted', offer => {
	let botTotal = 0;
	let userTotal = 0;
	let recipientName = offer.recipient.display_name;
	let recipientSteamId = offer.recipient.steam_id;
	let recipientUid = offer.recipient.uid;
	let tradeId = offer.id;
	
	// Work out the total value of both sides
	offer.sender.items.forEach(function(botItem) {
		botTotal += botItem.suggested_price / 100;
	});
	offer.recipient.items.forEach(function(userItem) {
		userTotal += userItem.suggested_price / 100;
	});
	
	// Log a nice summary of the trade
	console.log(`
[ACCEPTED TRADE]
Bot value: $${botTotal}
User item value: $${userTotal}
Profit: $${userTotal - botTotal}

Name: ${recipientName}
Steamid: ${recipientSteamId}
UID: ${recipientUid}
Offer ID: ${tradeId}`);
});

// Module for fetching bot and user inventories
const inventory = require(path.join(__dirname, 'inventory.js'));

// The current bot inventory will be stored
// in this array
let botInventory = [];

// Load the bot inventory
function doTheRefresh() {
	inventory.getBotInventory((err, items) => {
		if (err) {
			console.error(err);
		} else {
			// If there's no error, update the inventory array:
			botInventory = items;
			console.log(`[INVENTORY] Bot inventory refreshed`);
		}
	});
}
// Keep refreshing the bot inventory
doTheRefresh();
setInterval(function() {
	doTheRefresh();
}, config.botInventoryRefreshTime * 1000);

// Setup our http server and socket server
const app = express();
const server = http.Server(app);
const io = socket(server);

// We'll use handlebars for our view engine
const Handlebars = handlebars.create({
	extname: '.html'
	, partialsDir: path.join(__dirname, '..', 'views', 'partials')
	, helpers: {
		getDecimalPercentage: function(decimal) {
			return parseInt(decimal * 100)
		}
	}
});

// Setup some handlebars stuff
app.engine('html', Handlebars.engine);
app.set('view engine', 'html');
app.set('views', path.join(__dirname, '..', 'views'));
app.use('/public', express.static(path.join(__dirname, '..', 'public')));

// Serialize and deserialize users into the session
passport.serializeUser((user, done) => {
	done(null, user);
});

passport.deserializeUser((obj, done) => {
	done(null, obj);
});

// Setup OPSkins sign-in
let OpskinsAuth = new opAuth.init({
	name: config.loginName,
	returnURL: config.returnUrl,
	apiKey: config.opskinsApiKey,
	scopes: 'identity',
	mobile: true
});

// Authenticate the user with OPSkins
passport.use('custom', new CustomStrategy(function (req, done) {
	OpskinsAuth.authenticate(req, (err, user) => {
		if (err) {
			done(err);
		} else {
			done(null, user);
		}
	});
}));

// Session and passport session stuff
let sessionMiddleware = session({
	key: 'session_id'
	, secret: 'almatrass'
	, resave: false
	, saveUninitialized: true
	, cookie: {
		maxAge: 1000 * 60 * 60 * 24 * 365
	}
});
app.use(cookieParser());
app.use(sessionMiddleware);

app.use(passport.initialize());
app.use(passport.session());
io.use(socketSession(sessionMiddleware));

function onAuthorizeSuccess(data, accept) {
	accept();
}

function onAuthorizeFail(data, message, error, accept) {
	accept(null, !error);
}

io.on('connection', socket => {
	let socketuser;
	// If user is logged in, assign the user object to 'socketuser'
	if (socket.handshake.session.passport && socket.handshake.session.passport.user) {
		socketuser = socket.handshake.session.passport.user;
	}
	
	// Retrieve the bot and user inventories on site load
	socket.on('setupSite', () => {
		socket.emit('botInvLoaded', {
			botInventory: botInventory
		});
		if (socketuser) {
			inventory.getUserInventory(socketuser.id64, false, false, (err, result) => {
				if (err) {
					console.error(err);
				} else {
					socket.emit('userInvLoaded', {
						userInventory: result.inventory
					});
				}
			});
		} else {
			socket.emit('userInvLoaded', {
				userInventory: []
			});
		}
	});
	
	// When a user refreshes bot inventory, send them the most up to date array
	socket.on('loadBotInventory', function() {
		socket.emit('botInvLoaded', {
			botInventory: botInventory
		});
	});
	
	// When a user requests an inventory refresh:
	socket.on('refreshUserInventory', function() {
		if (socketuser) {
			// The below function checks if the user can refresh yet, if they can, we 
			// get their inventory from OPSkins, if not we display a cached version.
			
			inventory.getUserInventory(socketuser.id64, true, false, (err, result) => {
				if (err) {
					console.error(err);
					socket.emit('alert', `An error occurred refreshing your inventory, please try again`, 'error');
				} else {
					// Send the inventory contents to the client
					socket.emit('userInvLoaded', {
						userInventory: result.inventory
					});
					
					// The function returns a 'cannotUpdateYet' key, indicating the
					// inventory wasn't actually refreshed, but is being loaded
					// from the cache.
					if (result.cannotUpdateYet) {
						socket.emit('alert', `You may only refresh your inventory once every ${config.refreshTimeout} seconds.<br>A cached version is being displayed`, 'info');
					} else {
						socket.emit('alert', `Inventory successfully refreshed!`, 'success');
					}
				}
			});
		} else {
			// If the user isn't logged in, just
			// send them a blank inventory.
			socket.emit('userInvLoaded', {
				userInventory: []
			});
		}
	});
	
	// When a user requests a new trade:
	socket.on('sendTrade', function(data) {
		// If they're logged in
		if (socketuser) {
			// If there are items
			if (data) {
				if (data.length) {
					
          let counts = [];
          let dupes;
          
          for (let i = 0; i <= data.length; i++) {
            if (counts[data[i]] === undefined) {
              counts[data[i]] = 1;
            } else {
              dupes = true;
            }
          }
          
          if (!dupes) {
            // Check if it's an admin
            let admin;
            config.adminSteamIds.forEach(function(person) {
              if (person == socketuser.id64) {
                admin = person;
              }
            });

            // Since OPSkins don't separate the two sides of the trade, we'll verify both
            // inventories to make sure items belong to the correct parties.
            inventory.getUserInventory(socketuser.id64, true, true, (err, localInventory) => {
              if (err) {
                console.error(err);
                socket.emit('tradeFailed', `An error occurred, please try again`);
              } else {
                let localUserInv = localInventory.inventory;
                let localBotInv = botInventory;
                let proposedUserItems = [];
                let proposedBotItems = [];
                let botTotalValue = 0;
                let userTotalValue = 0;

                let itemBanned;
                // For each proposed item, add it to the correct
                // separate array: either bot or user. Indicate a
                // banned item if it's present: shouldn't be, as
                // inventories are filtered when fetched anyway.
                data.forEach(function(proposedItem) {
                  localBotInv.forEach(function(realBotItem) {
                    if (proposedItem == realBotItem.id) {
                      config.bannedBotItems.forEach(function(bannedItem) {
                        if (realBotItem.name.toUpperCase().includes(bannedItem.toUpperCase())) {
                          itemBanned = true;
                        }
                      });
                      proposedBotItems.push(realBotItem);
                      botTotalValue += realBotItem.price;
                    }
                  });
                  localUserInv.forEach(function(realUserItem) {
                    if (proposedItem == realUserItem.id) {
                      config.bannedUserItems.forEach(function(bannedItem) {
                        if (realUserItem.name.toUpperCase().includes(bannedItem.toUpperCase())) {
                          itemBanned = true;
                        }
                      });
                      proposedUserItems.push(realUserItem);
                      userTotalValue += realUserItem.price;
                    }
                  });
                });

                // Double check that none of the items are blacklisted in
                // case the user is trying to trying to trick us and send
                // a custom item array.
                if (!itemBanned || admin) {

                  // Make sure the length of the real items is the same as 
                  // originally requested. This is different if any selected
                  // items can't be found in either inventory
                  if ((proposedBotItems.concat(proposedUserItems)).length == data.length || admin) {
                    let idArr = [];
                    proposedBotItems.forEach(function(botItem) {
                      idArr.push(botItem.id);
                    });
                    proposedUserItems.forEach(function(userItem) {
                      idArr.push(userItem.id);
                    });

                    // If the value of the bot items is less than the user's items.
                    // If they're an admin the values are ignored
                    if (botTotalValue <= userTotalValue || admin) {
                      // Let the user know we're sending their offer now
                      socket.emit('changeTradeStatus', `Sending offer...`);

                      // Send the offer using the expresstrade module
                      ET.ITrade.SendOfferToSteamId({steam_id: socketuser.id64, items: idArr.toString(), message: config.tradeMessage}, (err, body) => {
                        if (err) {
                          console.error(err);
                          socket.emit('tradeFailed', `An error occurred, please try again`);
                        } else {
                          // If status is 1, trade was sent successfully
                          if (body.status == 1) {
                            // Let the user know that the trade is successful.
                            // Send the client the offerid, so it can generate 
                            // a link to the offer. Send out an array of item ids,
                            // so they can be removed from view.
                            socket.emit('tradeSuccess', `Trade offer sent!`, body.response.offer.id, idArr);
                            let notif = `[SENT TRADE]`;
                            if (admin) {
                              notif = `[ADMIN SENT TRADE]`;
                            }
                            // Log that an offer has been sent.
                            console.log(`
  ${notif} - Awaiting accept
  Offer ID: ${body.response.offer.id}`);
                          } else {
                            // If status is not 1, something went wrong.
                            console.error(new Error(body.message));
                            socket.emit('tradeFailed', `An error occurred, please try again`);
                          }
                        }
                      });
                    } else {
                      socket.emit('alert', `Your items must be less than the bot's items! Please add more items to the trade`, 'error');
                      socket.emit('tradeFailed', `Your items must be less than the bot's items! Please add more items to the trade`);
                    }
                  } else {
                    socket.emit('alert', `One or more selected items don't exist, try refreshing`, 'error');
                    socket.emit('tradeFailed', `One or more selected items don't exist, try refreshing`);
                  }
                } else {
                  socket.emit('alert', `One or more of these items has been blacklisted for trades`);
                  socket.emit('tradeFailed', `One or more of these items has been blacklisted for trades`);
                }
              }
            });
          } else {
            socket.emit('alert', `Pls, don't 😢`, 'error');
						socket.emit('tradeFailed', `Pls, don't 😢`);
          }
				} else {
					socket.emit('alert', `Please select some items first!`, 'error');
					socket.emit('tradeFailed', `Please select some items first!`);
				}
			} else {
				socket.emit('alert', `An error occurred, please try again`, 'error');
				socket.emit('tradeFailed', `An error occurred, please try again`);
			}
		} else {
			socket.emit('tradeFailed', `Please login to trade!`);
			socket.emit('alert', `Please login to trade!`, 'error');
		}
	});
});

// ROUTES
// Home route
app.get('/', (req, res) => {
	res.render('index', {
		user: req.user,
		rates: config.rates,
		siteName: config.siteName,
		author: config.author
	});
});

// Redirect the user to the login page.
app.get('/auth/opskins', function (req, res) {
	res.redirect(OpskinsAuth.getFetchUrl());
});

// Authenticate the user once they've logged in
app.get('/auth/opskins/authenticate', passport.authenticate('custom', {
	failureRedirect: '/'
}), function (req, res) {
	res.redirect('/');
});

// Log the user out of the session
app.get('/logout', (req, res) => {
	req.logout();
	res.redirect('/');
});

// Listen for requests
server.listen(config.port)