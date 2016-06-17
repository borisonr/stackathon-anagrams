var Anagrams = angular.module('Anagrams', []);

Anagrams.controller('boardCtrl', function($scope, $http){
	var socket = io();
	
	$scope.tiles = [];
	$scope.players = [];
	$scope.currentPlayer;

	//create multiple players
	socket.on('newPlayer', function(players){
		players.forEach(function(player){
			if(player.socketId === "/#"+socket.id) $scope.currentPlayer = player;
		})
		$scope.players = players;
		$scope.$digest();
	})

	//add a new tile to the pile
	$scope.newTile = function(){
		var chars = "aaaaaaaaaaaaabbbcccddddddeeeeeeeeeeeeeeeeeefffgggghhhiiiiiiiiiiiijjkklllllmmmnnnnnnnnooooooooooopppqqrrrrrrrrrsssssstttttttttuuuuuuvvvwwwxxyyyzz";
    	var char = chars[Math.floor(Math.random() * 26)];
    	if (char ==="q") char = "qu";
		socket.emit('newTile', {letter: char.toUpperCase()});
	}
	socket.on('newTile', function(data){
		if(!$scope.tiles) $scope.tiles = [];
		$scope.tiles.push(data)
		$scope.$digest()
	})

	//submit a word
	$scope.newWord = function(){
	//check if word is 3 letters
	if($scope.myWord.length < 3) {
		$scope.myWord = "";
		$scope.error = "I'm sorry, that word is less than three letters";
	}
	else {
		//check if word is in dictionary
		$http.get('/api/checkWord/'+$scope.myWord.toLowerCase())
			.then(function(response){
				//if it is in dictionary
				if(response.data === "true"){
					console.log($scope.myWord, "myword")
					console.log(response.data, "response")

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
						socket.emit('newWord', $scope.myWord, $scope.tiles, socket.id);
						$scope.myWord = "";
					}

					//if it can't be made from pile
					else {
						//determine if it can be made from current words
						var toSteal;
						var playerToStealFromId;
						$scope.players.forEach(function(player){
							player.words.forEach(function(word){
								var letters = word.toUpperCase().split("");
								var count = 0;
								letters.forEach(function(letter){
									if(usedLetters.includes(letter)) count++;
								})
								if (count === letters.length) {
									toSteal = word;
									playerToStealFromId = player.socketId;
								}
								})
						})

						//if it can't be made from current words, it is officially not a valid word
						if(!toSteal){
							$scope.myWord = "";
							$scope.error = "I'm sorry, that word cannot be created from the available letters";
						}
						// now check to see if it can be made from the current words combined with the letters in the pile
						else{
							var letters = toSteal.toUpperCase().split("");
							letters.forEach(function(letter){
								usedLetters.splice(usedLetters.indexOf(letter), 1)
							})

							for(var i = 0; i < usedLetters.length; i++){
							$scope.tiles.forEach(function(tile){
								if(tile.letter === usedLetters[i]){
									usedLetters.splice(usedLetters.indexOf(tile.letter), 1);
									$scope.tiles.splice($scope.tiles.indexOf(tile), 1);
								}
							})
							//if the tiles aren't there
							if(usedLetters.length) $scope.error = "I'm sorry, that word cannot be created from the available letters";
							//if you can steal the word!
							else {
								socket.emit('stealWord', $scope.myWord, $scope.tiles, toSteal, playerToStealFromId, socket.id);
								$scope.myWord = "";
							}
						}

						}

					}
			}
				//if it isn't in dictionary
				else {
					$scope.error = "I'm sorry, that word is not in the English dictionary";
					$scope.myWord = "";
				}
			})
		}
	}

	socket.on('newWord', function(tiles, players){
		$scope.players = players;
		$scope.tiles = tiles;
		$scope.$digest()
	})

	socket.on('stealWord', function(players, tiles){
		$scope.players = players;
		$scope.tiles = tiles;
		$scope.$digest()
	})

	$scope.phone = false;
	socket.on('connected', function(){
		$http.get('/api/device')
		.then(function(device){
			if(device.data==="phone") {
				$scope.phone = true;
				socket.emit('device', "phone")
			}
			else{
				socket.emit('device', "desktop")
			}
		})
	})
		
	
	
})