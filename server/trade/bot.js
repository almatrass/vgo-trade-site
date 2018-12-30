const ExpressTrade = require('expresstrade');

const ET = new ExpressTrade({
  apikey: App.config.opskinsApiKey,
  twofactorsecret: App.config.opskinsSecret,
  pollInterval: App.config.opskinsPollInterval * 1000
});

let userInventoryCache = [];

function sendTrade(steamid, itemstosend, itemstoreceive, message, cb) {
  ET.ITrade.SendOfferToSteamId({steam_id: steamid, items_to_send: itemstosend, items_to_receive: itemstoreceive, message: message}, (err, body) => {
    if (err)
      return cb(err);
    
    if (body.status !== 1)
      return cb(new Error(body.message));
    
    cb(null, body);
  });
}

// Retrieves the bot inventory
function getBotInventory(cb) {
	if (!cb)
		throw new Error('A callback function must be provided');
    
  let demItems = [];
  let page = 1;

  getIt();

  function getIt() {
    ET.IUser.GetInventory({
      page: page,
      per_page: 1
    }, (err, body) => {
      if (err)
        return cb(err);
      if (body.status !== 1)
        return cb(new Error(body.message));

      let items = body.response.items;
      items.forEach(function(item) {
        demItems.push(item);
      });

      if (body.total_pages == body.current_page)
        return nextStep(demItems);

      page += 1;
      getIt();
    });
  }

  function nextStep(demItems) {
    let inventory = [];
    // Loop through bot items
    demItems.forEach(function(item) {
      let banned;
      // Check if the bot item is banned by us in config:
      if (App.config.bannedBotItems.length) {
        App.config.bannedBotItems.forEach(function(bannedItem) {
          if (item.name.toUpperCase().includes(bannedItem.toUpperCase())) {
            banned = true;
          }
        });
      }

      let price = item.suggested_price;

      // Change the price based on the rates set in config
      if (item.name == 'WAX Key') {
        price = parseFloat(((price * App.config.rates.keyBotRate) / 100).toFixed(2));
      } else {
        price = parseFloat(((price * App.config.rates.otherBotRate) / 100).toFixed(2));
      }


      // Check if the item price is allowed in config
      if (price >= App.config.minMax.minBot && price <= App.config.minMax.maxBot && !banned) {
        // If all is good, push only the data we need to a local inventory array:
        inventory.push({
          name: item.name,
          id: item.id,
          category: item.category,
          color: item.color,
          img: item.image['600px'],
          price: price,
          rarity: item.rarity
        });
      }
    });
    // Call the callback, returning our nicely formatted inventory
    cb(null, inventory);
  }
}

// Retrieves a user inventory
function getUserInventory(steamid, refresh, force, cb) {
  if (!steamid || !cb)
    throw new Error('Missing SteamID parameter or callback function');
    
  let cached;
  let cachedInv;
  // Check if the inventory is cached
  userInventoryCache.forEach(function(inventory) {
    if (inventory.steamid == steamid) {
      cached = true;
      cachedInv = inventory;
    }
  });
  
  if (cached && !refresh)
    return cb(null, cachedInv);
  
  if (!cachedInv || force)
    return doIt();
  
  // Check if they've waited long enough before refreshing
  if (cachedInv.updated < Date.now() - (1000 * App.config.refreshTimeout)) 
    return doIt();
  
  // Callback the cached inventory if they haven't waited long enough
  cachedInv.cannotUpdateYet = true;
  cb(null, cachedInv);
  
  function doIt() {
    // Remove existing cached inventory if it exists
    App.utils.removeObjArr(userInventoryCache, 'steamid', steamid);

    let demItems = [];
    let page = 1;

    getIt();

    function getIt() {
      ET.ITrade.GetUserInventoryFromSteamId({
        steam_id: steamid,
        page: page,
        per_page: 1
      }, (err, body) => {
        if (err)
          return cb(err);
        
        if (body.status !== 1)
          return cb('An unknown error occurred fetching bot inventory');
        
        let items = body.response.items;
        items.forEach(function(item) {
          demItems.push(item);
        });

        if (body.total_pages > body.current_page) {
          page += 1;
          getIt();
        } else {
          nextStep(demItems);
        }
      });
    }

    function nextStep(demItems) {
      let localInv = [];
      demItems.forEach(function(item) {
        let banned;
        // Check if the user item is banned by us in config:
        if (App.config.bannedUserItems.length) {
          App.config.bannedUserItems.forEach(function(bannedItem) {
            if (item.name.toUpperCase().includes(bannedItem.toUpperCase()))
              banned = true;
          });
        }

        let price = item.suggested_price;
        // Change the price based on the rates set in config
        if (item.name == 'WAX Key') {
          price = parseFloat(((price * App.config.rates.keyUserRate) / 100).toFixed(2));
        } else {
          price = parseFloat(((price * App.config.rates.otherUserRate) / 100).toFixed(2));
        }

        // Check if the item price is allowed in config
        if (price >= App.config.minMax.minUser && price <= App.config.minMax.maxUser && !banned) {
          // If it's all good, push it to our local array
          localInv.push({
            name: item.name,
            id: item.id,
            category: item.category,
            color: item.color,
            img: item.image['600px'],
            price: price,
            rarity: item.rarity
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
    }
  }
}

module.exports = {
  sendTrade,
  getBotInventory,
  getUserInventory
};

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