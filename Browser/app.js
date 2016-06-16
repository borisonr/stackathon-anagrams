var Anagrams = angular.module('Anagrams', []);

Anagrams.controller('boardCtrl', function($scope, $http){
	var socket = io();
	$scope.tiles = [{letter: "A"},{letter: "B"}, {letter: "C"}]
	$scope.words = [];
	$scope.newTile = function(){
		var chars = "abcdefghijklmnopqurstuvwxyz";
    	var char = chars[Math.floor(Math.random() * 26)];
		socket.emit('newTile', {letter: char});
	}
	socket.on('newTile', function(data){
		$scope.tiles.push(data)
		$scope.$digest()
	})

	$scope.newWord = function(){
		var usedLetters = $scope.myWord.toUpperCase().split("");
		console.log(usedLetters);
		for(var i = 0; i < usedLetters.length; i++){
			var deleteCount = 0
			$scope.tiles.forEach(function(tile){
				if(tile.letter === usedLetters[i] && deleteCount === 0){
					$scope.tiles.splice($scope.tiles.indexOf(tile), 1);
					deleteCount++;
				}
			})
		}

		socket.emit('newWord', $scope.myWord, $scope.tiles);
	}

	socket.on('newWord', function(word, tiles){
		$scope.words.push(word)
		$scope.tiles = tiles;
		$scope.$digest()
	})

	$scope.phone = false;
	$http.get('/api/device')
	.then(function(device){
		if(device.data==="phone") $scope.phone = true;
	})	
	
	
})