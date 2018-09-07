// This code was written by Almatrass. 
// It is free to use however you wish.

// Export functions
module.exports = {
	getBotInventory,
	getUserInventory
}

// Require stuff
const path = require('path');
const config = require(path.join(__dirname, '..', 'config', 'config.js'));
const utils = require(path.join(__dirname, 'utils.js'));

// Here's the module we care about
const ExpressTrade = require('expresstrade');
// Let's create a new instance of that important module ;)
const ET = new ExpressTrade({
  apikey: config.opskinsApiKey,
  twofactorsecret: config.opskinsSecret
});

// Since we're not going to use a database, we'll cache inventories here:
let userInventoryCache = [];

// Retrieves the bot inventory
function getBotInventory(cb) {
	if (!cb) {
		throw new Error('A callback function must be provided');
	} else {
		ET.IUser.GetInventory((err, body) => {
			if (err) {
				cb(err);
			} else {
				if (body.status == 1) {
					let inventory = [];
					// Loop through bot items
					body.response.items.forEach(function(item) {
						let banned;
						// Check if the bot item is banned by us in config:
						if (config.bannedBotItems.length) {
							config.bannedBotItems.forEach(function(bannedItem) {
								if (bannedItem == item.name) {
									banned = true;
								}
							});
						}
						
						let price = item.suggested_price;
						
						// Change the price based on the rates set in config
						if (item.name == 'Skeleton Key') {
							price = parseFloat(((price * config.rates.keyBotRate) / 100).toFixed(2));
						} else {
							price = parseFloat(((price * config.rates.otherBotRate) / 100).toFixed(2));
						}
						
						
						// Check if the item price is allowed in config
						if (price >= config.minMax.minBot && price <= config.minMax.maxBot && !banned) {
							// If all is good, push only the data we need to a local inventory array:
							inventory.push({
								name: item.name,
								id: item.id,
								category: item.category,
								color: item.color,
								img: item.image['600px'],
								price: price
							});
						}
					});
					// Call the callback, returning our nicely formatted inventory
					cb(null, inventory);
				} else {
					// Status wasn't 1:
					cb(new Error(body.message));
				}
			}
		});
	}
}

// Retrieves a user inventory
function getUserInventory(steamid, refresh, force, cb) {
	if (steamid && cb) {
		let cached;
		let cachedInv;
		// Check if the inventory is cached
		userInventoryCache.forEach(function(inventory) {
			if (inventory.steamid == steamid) {
				cached = true;
				cachedInv = inventory;
			}
		});
		if (cached && !refresh) {
			// If it's cached and we're not requesting a refresh, callback with the cached inventory.
			cb(null, cachedInv);
		} else {
			if (cachedInv && !force) {
				// Check if they've waited long enough before refreshing
				if (cachedInv.updated < Date.now() - (1000 * config.refreshTimeout)) {
					doIt();
				} else {
					// Callback the cached inventory if they haven't waited long enough
					cachedInv.cannotUpdateYet = true;
					cb(null, cachedInv);
				}
			} else {
				// Inventory hasn't been cached, let's retrieve it
				doIt();
			}
			function doIt() {
				// Remove existing cached inventory if it exists
				utils.removeObjArr(userInventoryCache, 'steamid', steamid);
				ET.ITrade.GetUserInventoryFromSteamId({
					steam_id: steamid
				}, (err, body) => {
					if (err) {
						cb(err);
					} else {
						if (body.status == 1) {
							let localInv = [];
							body.response.items.forEach(function(item) {
								let banned;
								// Check if the user item is banned by us in config:
								if (config.bannedUserItems.length) {
									config.bannedUserItems.forEach(function(bannedItem) {
										if (bannedItem == item.name) {
											banned = true;
										}
									});
								}
								
								let price = item.suggested_price;
								// Change the price based on the rates set in config
								if (item.name == 'Skeleton Key') {
									price = parseFloat(((price * config.rates.keyUserRate) / 100).toFixed(2));
								} else {
									price = parseFloat(((price * config.rates.otherUserRate) / 100).toFixed(2));
								}
								
								// Check if the item price is allowed in config
								if (price >= config.minMax.minUser && price <= config.minMax.maxUser && !banned) {
									// If it's all good, push it to our local array
									localInv.push({
										name: item.name,
										id: item.id,
										category: item.category,
										color: item.color,
										img: item.image['600px'],
										price: price
									});
								}
							});
							// Callback with our local formatted inventory
							cb(null, {inventory: localInv});
							// Cache the inventory for later
							userInventoryCache.push({
								steamid: steamid,
								inventory: localInv,
								updated: Date.now(),
								cached: true
							});
						} else {
							// Status wasn't 1
							cb('An unknown error occurred fetching bot inventory');
						}
					}
				});
			}
		}
	} else {
		// Need SteamID and callback parameters
		throw new Error('Missing SteamID parameter or callback function');
	}
}
