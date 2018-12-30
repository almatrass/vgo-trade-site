const bot = App.require('server/trade/bot');

// Load the bot inventory
function doTheRefresh() {
	bot.getBotInventory((err, items) => {
		if (err)
			return console.error(err);
    // If there's no error, update the inventory array:
    App.inventory = items;
	});
}
// Keep refreshing the bot inventory
doTheRefresh();
setInterval(function() {
	doTheRefresh();
}, App.config.botInventoryRefreshTime * 1000);