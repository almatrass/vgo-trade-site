const fetch = App.require('server/sockets/fetch'),
      trade = App.require('server/sockets/trade');

module.exports = (socket, socketuser) => {
	socket.on('setupSite', fetch.setupSite(socket, socketuser));
	socket.on('loadBotInventory', fetch.loadBotInventory(socket, socketuser));
	socket.on('refreshUserInventory', fetch.refreshUserInventory(socket, socketuser));
	socket.on('sendTrade', trade.sendTrade(socket, socketuser));
};