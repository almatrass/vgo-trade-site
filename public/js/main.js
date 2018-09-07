// This code was written by Almatrass. 
// It is free to use however you wish.

const botLoader = `<div class="mainLoader botItemsLoader"></div>`;
const userLoader = `<div class="mainLoader userItemsLoader"></div>`;
const modalTradeLoader = `<div class="mainLoader modalTradeLoader"></div>`;

// This provides a cool starting animation
window.sr = ScrollReveal();

$(document).ready(function() {
	// Emit 'setupSite' - this loads the bot
	// and user inventories.
	socket.emit('setupSite');
	
	// Get rid of the loader
	$('.siteLoader').fadeOut(50);
	
	// ==== IF YOU DON'T WANT THE ANIMATIONS HERE, SIMPLY ====
	// ==== REMOVE THE 'sr' and 'sr*NUMBER*' CLASS FROM   ====
	// ==== THE ELEMENTS IN 'middlesection.html'.         ====
	// ==== IF YOU WANT TO ADD MORE MIDDLE STUFF AND KEEP ====
	// ==== THE ANIMATIONS, INCREASE THE                  ====
	// ==== 'numberOfMiddleElements' variable below to    ====
	// ==== how many total elements you have in the       ====
	// ==== middle and keep incrementing the classes in   ====
	// ==== your html!                                    ====
	
	let numberOfMiddleElements = 7;
	// Reveal elements in a nice
	// little animation:
	sr.reveal('.userTrade', {
		origin: 'left',
		distance: '100px',
		duration: 300
	});
	sr.reveal('.botTrade', {
		origin: 'right',
		distance: '100px',
		duration: 300
	});
	
	// Loop this and get a nice slowing animation
	// for the middle elements
	let duration = 300;
	for (let i = 0; i <= numberOfMiddleElements; i++) {
		sr.reveal(`.srMiddle${i}`, {
			origin: 'bottom',
			distance: '100px',
			duration: duration
		});
		duration += 75;
	}
});

// Display our toasts at the bottom left, and
// display them for 7 seconds without interaction
toastr.options.positionClass = 'toast-bottom-left';
toastr.options.timeOut = 7000;

// Easy way to display toasts from the server
socket.on('alert', function(message, state) {
	toastr[state](message);
});

// Check if the item exists in the selected array
function checkItemArr(arr, assetid) {
	let condition;
	arr.forEach(function (item) {
		if (item.assetid == assetid) {
			condition = true;
		}
	});
	return condition;
}

// Remove an item from selected item array
function removeItemArr(arr, assetid) {
	for (let i = arr.length - 1; i >= 0; i--) {
		if (arr[i].assetid == assetid) {
			arr.splice(i, 1);
		}
	}
}

// Setup our app module, and change the syntax for 
// integration with handlebars
var app = angular.module("mainApp", []);
app.config(function ($interpolateProvider) {
	$interpolateProvider.startSymbol('{[{');
	$interpolateProvider.endSymbol('}]}');
});

// Angular controller
app.controller("mainCtrl", function ($scope) {
	
	// When either inventory is loaded, add the
	// items to the local array and refresh the
	// angular view.
	socket.on('userInvLoaded', function(data) {
		$('.userItemsLoader').remove();
		$scope.$apply(() => $scope.userInventory = data.userInventory);
		$('[data-toggle="tooltip"]').tooltip();
	});
	
	socket.on('botInvLoaded', function(data) {
		$('.botItemsLoader').remove();
		$scope.$apply(() => $scope.botInventory = data.botInventory);
		$('[data-toggle="tooltip"]').tooltip();
	});
	
	// Default ordering is -price (high to low)
	$scope.userOrderBy = '-price';
	$scope.botOrderBy = '-price';
	$scope.userSelected = [];
	$scope.botSelected = [];
	
	// Requesting inventory refreshes:
	$scope.refreshBotInv = function() {
		$('#botTradeBody').prepend(botLoader);
		$scope.botInventory = [];
		socket.emit('loadBotInventory');
	}
	
	$scope.refreshUserInv = function() {
		$('#userTradeBody').prepend(userLoader);
		$scope.userInventory = [];
		socket.emit('refreshUserInventory');
	}
	
	// Fetch the array we want to work with: bot or user
	$scope.getSideArr = function (side) {
		if (side == 'user') {
			arr = $scope.userSelected;
		} else {
			arr = $scope.botSelected;
		}
		return arr;
	}
	
	// Change item sorting order
	$scope.changeOrderBy = function (sorting, side) {
		if (side == 'user') {
			$scope.userOrderBy = sorting;
		} else {
			$scope.botOrderBy = sorting;
		}
	}
	
	// When an item is clicked, push it to the array if
	// it's not selected, remove it from the array if it is.
	$scope.itemClick = function (assetid, price, side) {
		let arr = $scope.getSideArr(side);
		
		if (checkItemArr(arr, assetid)) {
			removeItemArr(arr, assetid);
		} else {
			arr.push({
				assetid: assetid
				, price: price
			});
		}
	}
	
	// Get the darker background color style for 
	// selected items.
	$scope.getStyle = function (assetid, side) {
		let arr = $scope.getSideArr(side);
		if (checkItemArr(arr, assetid)) {
			return {
				'background-color': '#F4F4F4'
			};
		}
	}
	
	// Get the total value of selected items
	$scope.getValue = function (side) {
		let arr = $scope.getSideArr(side);
		let amount = 0;
		arr.forEach(function (item) {
			amount += item.price;
		});
		return amount;
	}
	
	// Finally send the trade!
	$scope.sendTrade = function() {
		let items = [];
		$scope.userSelected.forEach(function(item) {
			items.push(item.assetid);
		});
		$scope.botSelected.forEach(function(item) {
			items.push(item.assetid);
		});
		socket.emit('sendTrade', items);
		$('.modalTradeBody').html(`${modalTradeLoader}<h4 class="tradeStatus">Verifying items...</h4>`);
		$("#modalTrade").modal();
	}
	
	// If the trade fails...
	socket.on('tradeFailed', function(msg) {
		let html = `<i class="far fa-times-circle tradeStatusFa"></i><h4>${msg}</h4>`;
		$('.modalTradeBody').html(html);
	});
	
	// If the trade succeeds...
	socket.on('tradeSuccess', function(msg, tradeid, itemids) {
		let html = `<i class="far fa-check-circle tradeStatusFa"></i><h4>${msg}</h4><a href="https://trade.opskins.com/trade-offers/${tradeid}" target="_blank" class="btn accentBtn" role="button">View Offer</a>`;
		$('.modalTradeBody').html(html);
		
		// Remove the sent items from view
		itemids.forEach(function(id) {
			$(`.${id}`).fadeOut(200);
			setTimeout(function() {
				$(`.${id}`).remove();
			}, 200);
		});
		
		// Clear the selected items
		$scope.userSelected = [];
		$scope.botSelected = [];
		$scope.$apply();
	});
});

// Change the status of a pending trade
// on the trade modal.
socket.on('changeTradeStatus', function(msg) {
	$('.tradeStatus').text(msg);
});