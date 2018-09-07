// This code was written by Almatrass. 
// It is free to use however you wish.

module.exports = {
	adminSteamIds: [], // Admins can send any offer without verification. Follow this pattern: ['76561198089553444', '76561198089553444'] etc...
	author: {
		name: 'Almatrass', // Shows this name under the 'Site by *' in the middle
		profileLink: 'https://steamcommunity.com/id/almatrass', // This is where this name will link to
	},
	siteName: 'trade.gain.gg', // Site name - For trade messages and site title
	tradeMessage: `Trade offer from trade.gain.gg. Please verify the trade is correct before accepting. Thanks for using trade.gain.gg!`,
	url: 'localhost', // Redirect URL - including port if applicable
	port: 80, // Server port. Don't change this unless you're reverse proxying
	opskinsApiKey: '8fad9023jhf9kasdaf83245hj09faf', // OPSkins API key
	opskinsSecret: 'SHGJKASDF8KJL23J', // OPSkins 2FA Secret
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
	bannedBotItems: [], // Enter the EXACT name (including CAPS) of items you wish the bot NOT to give or show. Should follow this pattern: ['item1', 'item2', 'item3'] etc... - make sure you include quotes. Leave as [] to not ban any items.
	bannedUserItems: [], // Exactly the same as above, except this is to ban items to accept.
	refreshTimeout: 5, // The time in seconds between allowed user inventory refreshes.
	botInventoryRefreshTime: 30, // The time in seconds for refreshing the bot inventory.
	opskinsPollInterval: 5 // The time in seconds for checking OPSkins offers.
}