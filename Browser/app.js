var Anagrams = angular.module('Anagrams', []);

Anagrams.controller('boardCtrl', function($scope, $http){
	var socket = io();
	$scope.tiles = [{letter: "a"},{letter: "b"}, {letter: "c"}]
	$scope.newTile = function(){
		var chars = "abcdefghijklmnopqurstuvwxyz";
    	var char = chars[Math.floor(Math.random() * 26)];
		// $scope.tiles.push({letter: char});
		socket.emit('newTile', {letter: char});
	}
	socket.on('newTile', function(data){
		$scope.tiles.push(data)
		$scope.$digest()
	})
	$scope.phone = false;
	$http.get('/api/device')
	.then(function(device){
		console.log(device)
		if(device.data==="phone") $scope.phone = true;
	})	
	
	
})