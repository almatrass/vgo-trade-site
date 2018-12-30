const bot = App.require('server/trade/bot');

module.exports = {
  setupSite: function(socket, socketuser) {
    return function() {
      socket.emit('botInvLoaded', {
        botInventory: App.inventory
      });
      if (!socketuser) {
        return socket.emit('userInvLoaded', {
          userInventory: []
        });
      }
      if (!socketuser.id64)
        return socket.emit('alert', `Please use an account with a SteamID linked to trade!`, 'error');
      bot.getUserInventory(socketuser.id64, false, false, (err, result) => {
        if (err) {
          console.error(err);
        } else {
          socket.emit('userInvLoaded', {
            userInventory: result.inventory
          });
        }
      });
    }
  },
  loadBotInventory: function(socket, socketuser) {
    return function() {
      socket.emit('botInvLoaded', {
        botInventory: App.inventory
      });
    }
	},
  refreshUserInventory: function(socket, socketuser) {
    return function() {
      if (!socketuser) {
        return socket.emit('userInvLoaded', {
          userInventory: []
        });
      }
      if (!socketuser.id64)
        return socket.emit('alert', `Please use an account with a SteamID linked to trade!`, 'error');
      // The below function checks if the user can refresh yet, if they can, we 
      // get their inventory from OPSkins, if not we display a cached version.

      bot.getUserInventory(socketuser.id64, true, false, (err, result) => {
        if (err) {
          console.error(err);
          return socket.emit('alert', `An error occurred refreshing your inventory, please try again`, 'error');
        }
        // Send the inventory contents to the client
        socket.emit('userInvLoaded', {
          userInventory: result.inventory
        });

        // The function returns a 'cannotUpdateYet' key, indicating the
        // inventory wasn't actually refreshed, but is being loaded
        // from the cache.
        if (!result.cannotUpdateYet)
          return socket.emit('alert', `Inventory successfully refreshed!`, 'success');
        
        socket.emit('alert', `You may only refresh your inventory once every ${App.config.refreshTimeout} seconds.<br>A cached version is being displayed`, 'info');
      });
    }
  }
};