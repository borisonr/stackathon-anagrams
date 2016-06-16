var Anagrams = angular.module('Anagrams', []);

Anagrams.controller('boardCtrl', function($scope, $http){
	var socket = io();
	$scope.tiles = [{letter: "A"},{letter: "B"}, {letter: "C"}, {letter:"E"}]
	$scope.words = [];

	//add a new tile to the pile
	$scope.newTile = function(){
		var chars = "abcdefghijklmnopqurstuvwxyz";
    	var char = chars[Math.floor(Math.random() * 26)];
		socket.emit('newTile', {letter: char.toUpperCase()});
	}
	socket.on('newTile', function(data){
		if(!$scope.tiles) $scope.tiles = [];
		$scope.tiles.push(data)
		$scope.$digest()
	})

	//submit a word
	$scope.newWord = function(){
		var usedLetters = $scope.myWord.toUpperCase().split("");
		//determine if the word could be made from pile
		var stealing = false;
		usedLetters.forEach(function(letter){
			var letterInPile = false;
			$scope.tiles.forEach(function(tile){
				if (tile.letter === letter) letterInPile = true;
			})
			if(letterInPile === false) {
				stealing = true;
			}
		})

		//if it can be made from pile...
		if(!stealing){
			for(var i = 0; i < usedLetters.length; i++){
				var deleteCount = 0
				$scope.tiles.forEach(function(tile){
					if(tile.letter === usedLetters[i] && deleteCount === 0){
						$scope.tiles.splice($scope.tiles.indexOf(tile), 1);
						deleteCount++;
					}
				})
			}
			$scope.error = null;
			socket.emit('newWord', $scope.myWord, $scope.tiles);
		}

		//if it can't be made from pile
		else {
			//determine if it can be made from current words
			var toSteal;
			$scope.words.forEach(function(word){
				var letters = word.toUpperCase().split("");
				var count = 0;
				letters.forEach(function(letter){
					if(usedLetters.includes(letter)) count++;
				})
				if (count === letters.length) toSteal = word;
			})

			//if it can't be made from current words, it is officially not a valid word
			if(!toSteal){
				$scope.error = "I'm sorry, that word cannot be created from the available letters"
			}
			// now check to see if it can be made from the current words combined with the letters in the pile
			else{

			}

		}
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