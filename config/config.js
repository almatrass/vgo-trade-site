// Developed by Almatrass
module.exports = {
  adminSteamIds: [], // Admins can send any offer without verification. Follow this pattern: ['76561198089553444', '76561198089553444'] etc...
	author: {
		name: 'Almatrass', // Shows this name under the 'Site by *' in the middle
		profileLink: 'https://steamcommunity.com/id/almatrass', // This is where this name will link to
	},
	siteName: 'trade.gain.gg', // Site name - For trade messages and site title
	loginName: 'trade.gain.gg', // Site name - Displayed on OPSkins login screen
	tradeMessage: `Trade offer from trade.gain.gg. Please verify the trade is correct before accepting. Thanks for using trade.gain.gg!`,
	returnUrl: 'http://localhost/auth/opskins/return', // Redirect URL - including port if applicable
	port: 80, // Server port. Don't change this unless you're reverse proxying
	opskinsApiKey: process.env.OPSKINS_API_KEY, // OPSkins API key
	opskinsSecret: process.env.OPSKINS_SECRET, // OPSkins 2FA Secret
	rates: {
		keyUserRate: 1, // User key rate
		keyBotRate: 1.05, // Bot key rate
		otherUserRate: 0.9, // User other rate
		otherBotRate: 0.95 // User bot rate
	},
	minMax: {
		minUser: 0.01, // Minimum user item value
		maxUser: 1000, // Maximum user item value
		minBot: 0.01, // Minimum bot item value
		maxBot: 1000 // Maximum bot item value
	},
	bannedBotItems: [], // Enter the name of items you wish the bot NOT to give or show. Server now checks if the name INCLUDES the values entered, so be sure not to be too vague. Should follow this pattern: ['item1', 'item2', 'item3'] etc... - make sure you include quotes. Leave as [] to not ban any items.
	bannedUserItems: [], // Exactly the same as above, except this is to ban items to accept.
	refreshTimeout: 5, // The time in seconds between allowed user inventory refreshes.
	botInventoryRefreshTime: 30, // The time in seconds for refreshing the bot inventory.
	opskinsPollInterval: 5 // The time in seconds for checking OPSkins offers.
};