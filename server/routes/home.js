// Developed by Almatrass
module.exports = (req, res) => {
	res.render('index', {
		user: req.user,
		rates: App.config.rates,
		siteName: App.config.siteName,
		author: App.config.author
	});
};