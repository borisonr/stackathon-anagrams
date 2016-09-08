var Anagrams = angular.module('Anagrams', ['ui.router']);

Anagrams.controller('boardCtrl', function($scope, $http, $location){
	var socket = io();

	socket.emit('joinRoom', $location.path())
	
	$scope.path = $location.path();
	$scope.tiles = [];
	$scope.players = [];
	$scope.currentPlayer;
	$scope.charsLeft = true;
	$scope.chars;

	//show rules
	$scope.rules = false;
	$scope.show = function(){
		$scope.rules = !$scope.rules;
	}

	//create multiple players
	socket.on('newPlayer', function(players, tiles){
		$scope.players = players;
		$scope.tiles = tiles;
		players.forEach(function(player){
			if(player.socketId === "/#"+socket.id) player.number = "My";
			else player.number = "Player "+player.number+"'s "
		})
		$scope.$apply();
	})

	//add a new tile to the pile
	$scope.newTile = function(){
		socket.emit('newTile', $location.path());
	}
	socket.on('newTile', function(tiles, charsLeft, characters){
		$scope.tiles = tiles;
    	$scope.charsLeft = charsLeft;
    	$scope.chars = characters;
		$scope.$apply();
	})

	//submit a word
	$scope.newWord = function(){
		console.log($scope.myWord)
	//check if word is 3 letters
	if($scope.myWord.length < 4) {
		$scope.myWord = "";
		$scope.error = "I'm sorry, that word is less than four letters";
	}
	else {
		//check if word is in dictionary
		$http.get('/api/checkWord/'+$scope.myWord.toLowerCase())
			.then(function(response){
				//if it is in dictionary
				if(response.data === "true"){
					var usedLetters = $scope.myWord.toUpperCase().split("");
					//determine if the word could be made from pile
					var stealing = false;
					var tilesToLettersCopy = [];
					$scope.tiles.forEach(function(tile){
						tilesToLettersCopy.push(tile)
					})
					usedLetters.forEach(function(letter){
						var letterInPile = false;
						tilesToLettersCopy.forEach(function(tile){
							if(tile === letter && !letterInPile){
								tilesToLettersCopy.splice(tilesToLettersCopy.indexOf(tile), 1);
								letterInPile = true;
							}
						})
						if(letterInPile === false) {
							stealing = true;
						}
					})

					//if it can be made from pile...
					if(!stealing){
						console.log("not stealing?")
						for(var i = 0; i < usedLetters.length; i++){
							var deleteCount = 0
							$scope.tiles.forEach(function(tile){
								if(tile === usedLetters[i] && deleteCount === 0){
									$scope.tiles.splice($scope.tiles.indexOf(tile), 1);
									deleteCount++;
								}
							})
						}
						$scope.error = null;
						console.log($scope.myWord, "word", $location.path(), "pathname")
						socket.emit('newWord', $scope.myWord, $scope.tiles, socket.id, $location.path());
						$scope.myWord = "";
					}

					//if it can't be made from pile
					else {
						//determine if it can be made from current words
						console.log("stealing?")
						console.log("usedLetters?", usedLetters)
						var toSteal;
						var playerToStealFromId;
						$scope.players.forEach(function(player){
							player.words.forEach(function(word){
								var letters = word.toUpperCase().split("");
								var stealingFromWord = true;
								letters.forEach(function(letter){
									// var letterInWord = true;
									if(!usedLetters.includes(letter)) stealingFromWord = false;
								})
								if (stealingFromWord) {
									toSteal = word;
									playerToStealFromId = player.socketId;
								}
								})

						})
						console.log("toSteal?", toSteal)
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

							var tilesCopy = [];
							$scope.tiles.forEach(function(tile){
								tilesCopy.push(tile)
							})

							
							for(var i = 0; i < usedLetters.length; i++){
								var letterInCopy = false;
								tilesCopy.forEach(function(tile){
								if(tile === usedLetters[i] && !letterInCopy){
									usedLetters.splice(usedLetters.indexOf(tile), 1);
									tilesCopy.splice(tilesCopy.indexOf(tile), 1);
									letterInCopy = true;
								}
							})
							//if the tiles aren't there
							if(usedLetters.length) $scope.error = "I'm sorry, that word cannot be created from the available letters";
							//if you can steal the word!
							else {
								tilesCopy = tilesCopy.map(function(letter){
									return letter.toUpperCase()
								})
								socket.emit('stealWord', $scope.myWord, tilesCopy, toSteal, playerToStealFromId, socket.id, $location.path());
								$scope.myWord = "";
							}
						}

						}

					}
			}
				//if it isn't in dictionary
				else {
					$scope.error = `I'm sorry, ${$scope.myWord} is not in the English dictionary`;
					$scope.myWord = "";
				}
			})
		}
	}

	socket.on('newWord', function(tiles, players){
		console.log(players, "players")
		$scope.players = players;
		$scope.tiles = tiles;
		$scope.$digest()
	})

	socket.on('stealWord', function(players, tiles){
		$scope.players = players;
		$scope.tiles = tiles;
		$scope.$digest()
	})
		
	socket.on('winner', function(scores){
		$scope.gameOver = "Game over! ";
		scores.forEach(function(score, i){
			$scope.gameOver+="Player #"+(i+1)+"had a score of "+score+"."
		})
		$scope.$apply();
	})

	$scope.score = function(){
		socket.emit('score', $location.path());
	}

	$scope.newGame = function(){
		console.log('getting newGame from html?')
		socket.emit('newGame', $location.path())
	}
	socket.on('newGame', function(){
		console.log('getting newGame on frontend?')
		$scope.tiles = [];
		$scope.players = [];
		$scope.currentPlayer;
		$scope.chars = "aaaaaaaaaaaaabbbcccddddddeeeeeeeeeeeeeeeeeefffgggghhhiiiiiiiiiiiijjkklllllmmmnnnnnnnnooooooooooopppqqrrrrrrrrrsssssstttttttttuuuuuuvvvwwwxxyyyzz";
		$scope.charsLeft = true;
		$scope.gameOver = false;
		$scope.error = false;
		$scope.myWord = "";
		$scope.$apply();
	})
})