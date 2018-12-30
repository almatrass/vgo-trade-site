const bot = App.require('server/trade/bot');

module.exports = {
  sendTrade: function(socket, socketuser) {
    return function(data) {
      // If they're logged in
      if (!socketuser || !data) {
        socket.emit('tradeFailed', `Please login to trade!`);
        return socket.emit('alert', `Please login to trade!`, 'error');
      }
      if (!data.length) {
        socket.emit('alert', `Please select some items first!`, 'error');
        return socket.emit('tradeFailed', `Please select some items first!`);
      }

      // If there are items
      let counts = [];
      let dupes;

      for (let i = 0; i <= data.length; i++) {
        if (counts[data[i]] === undefined) {
          counts[data[i]] = 1;
        } else {
          dupes = true;
        }
      }

      if (dupes) {
        socket.emit('alert', `Pls, don't 😢`, 'error');
        return socket.emit('tradeFailed', `Pls, don't 😢`);
      }
      
      // Check if it's an admin
      let admin;
      App.config.adminSteamIds.forEach(function(person) {
        if (person == socketuser.id64) {
          admin = person;
        }
      });

      // Since OPSkins don't separate the two sides of the trade, we'll verify both
      // inventories to make sure items belong to the correct parties.
      bot.getUserInventory(socketuser.id64, true, true, (err, localInventory) => {
        if (err) {
          console.error(err);
          return socket.emit('tradeFailed', `An error occurred, please try again`);
        }
        let localUserInv = localInventory.inventory;
        let localBotInv = App.inventory;
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
              App.config.bannedBotItems.forEach(function(bannedItem) {
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
              App.config.bannedUserItems.forEach(function(bannedItem) {
                if (realUserItem.name.toUpperCase().includes(bannedItem.toUpperCase())) {
                  itemBanned = true;
                }
              });
              proposedUserItems.push(realUserItem);
              userTotalValue += realUserItem.price;
            }
          });
        });
        
        if (itemBanned && !admin) {
          socket.emit('alert', `One or more of these items has been blacklisted for trades`);
          return socket.emit('tradeFailed', `One or more of these items has been blacklisted for trades`);
        }
        
        if ((proposedBotItems.concat(proposedUserItems)).length !== data.length && !admin) {
          socket.emit('alert', `One or more selected items don't exist, try refreshing`, 'error');
          socket.emit('tradeFailed', `One or more selected items don't exist, try refreshing`);
        }
        
        let botIdArr = [],
            userIdArr = [];
        proposedBotItems.forEach(function(botItem) {
          botIdArr.push(botItem.id);
        });
        proposedUserItems.forEach(function(userItem) {
          userIdArr.push(userItem.id);
        });
        
        if (botTotalValue > userTotalValue && !admin) {
          socket.emit('alert', `Your items must be less than the bot's items! Please add more items to the trade`, 'error');
          return socket.emit('tradeFailed', `Your items must be less than the bot's items! Please add more items to the trade`);
        }
        // Let the user know we're sending their offer now
        socket.emit('changeTradeStatus', `Sending offer...`);

        // Send the offer using the expresstrade module
        bot.sendTrade(socketuser.id64, botIdArr.toString(), userIdArr.toString(), App.config.tradeMessage, (err, body) => {
          if (err) {
            console.error(err);
            return socket.emit('tradeFailed', `An error occurred, please try again`);
          }
          socket.emit('tradeSuccess', `Trade offer sent!`, body.response.offer.id, botIdArr.concat(userIdArr));

          let notif = `[SENT TRADE]`;
          if (admin)
            notif = `[ADMIN SENT TRADE]`;
          
          // Log that an offer has been sent.
          console.log(`
${notif} - Awaiting accept
Offer ID: ${body.response.offer.id}`);
        });
      });
    }
  }
};