Anagrams.config(function($stateProvider, $urlRouterProvider, $locationProvider){
$locationProvider.html5Mode(true);
	$stateProvider.state('homeState', {
		url: '/',
		templateUrl: 'homestate.html',
		controller: 'boardCtrl'
	})
	.state('gameState', {
		url: '/:gameName',
		templateUrl: 'game.html',
		controller: 'boardCtrl'
	})
})