// Creating an express server

var express = require('express')
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

var device = require('express-device');
var path = require('path');
var rootPath = path.join(__dirname, './');

var checkWord = require('check-word'),
    words     = checkWord('en');

// This is needed if the app is run on heroku and other cloud providers:

var port = process.env.PORT || 8080;

// Initialize a new socket.io object. It is bound to 
// the express app, which allows them to coexist.

// var io = require('socket.io').listen(app.listen(port));

// detect device

app.use(device.capture());

// Make the files in the public folder available to the world
// app.use(express.static(__dirname + '/public'));

app.use(express.static(path.join(rootPath, './node_modules')));
app.use(express.static(path.join(rootPath, './Browser')));

// App Configuration

app.get('/api/device', function(req, res, next){
	if(req.device.type === "desktop") {
		res.send('desktop');
	}
	if(req.device.type === "phone") {
		res.send('phone');
	}
})

app.get('/api/checkWord/:word', function(req, res, next){
	if(!words.check(req.params.word)) res.send('false');
	if(words.check(req.params.word)) res.send('true');
})

app.get('/*', function (req, res) {
        res.sendFile(path.join(rootPath, '/Browser/home.html'));
    });

var num = {};
var players = {};
var chars = "aaaaaaaaaaaaabbbcccddddddeeeeeeeeeeeeeeeeeefffgggghhhiiiiiiiiiiiijjkklllllmmmnnnnnnnnooooooooooopppqqrrrrrrrrrsssssstttttttttuuuuuuvvvwwwxxyyyzz";
var roomChars = {};

io.on('connection', function(socket){
  console.log('a user connected', socket.id);
  var roomName;
  socket.on('joinRoom', function(room){
  	roomName = room;
  	if(!players[room]) {
  		players[room] = [];
  		num[room] = 1;
  		roomChars[room] = chars;
  	}
  	socket.join(room)
  	socket.emit('connected')
  })
  socket.on('device', function(device){
  	if(device === "phone"){
  	  var player = {number: num[roomName], words: [], socketId: socket.id}
	  players[roomName].push(player);
	  console.log(player, "player");
	  console.log(players, "players");
	  io.to(roomName).emit('newPlayer', players[roomName]);
	  num[roomName]++;
  	}
  })  
  socket.on('newTile', function(){
  	var charsLeft = true;
  	var char = roomChars[roomName][Math.floor(Math.random() * roomChars[roomName].length)];
    if(!roomChars[roomName] || !char) charsLeft = false;
	var charsArr = roomChars[roomName].split("");
    var count = 0;
	charsArr.forEach(function(c){
		if (c === char && count === 0) {
			charsArr.splice(charsArr.indexOf(c), 1);
			count++;
		}
	})
	if(!charsArr) charsLeft = false;
	roomChars[roomName] = charsArr.join("");
	if (char ==="q") char = "qu";
    io.to(roomName).emit('newTile', char, charsLeft)
  });
  socket.on('newWord', function(word, tiles, socketId, room){
  	console.log(word, "word")
  	players[room].forEach(function(player){
  		if(player.socketId === "/#"+socketId) player.words.push(word.toLowerCase());
  	})
  	console.log(players[room], "players")
    io.to(room).emit('newWord', tiles, players[room])
  });
  socket.on('stealWord', function(newWord, tiles, wordToRemove, playerToStealFrom, playerWhoIsStealing, room){
  	console.log(newWord, "newword")
  	players[room].forEach(function(player){
  		if(player.socketId === "/#"+playerWhoIsStealing) player.words.push(newWord.toLowerCase());
  	})
  	players[room].forEach(function(player){
  		if(player.socketId === playerToStealFrom) {
  			player.words.splice(player.words.indexOf(wordToRemove.toLowerCase()), 1);
  		}
  	})
  	io.to(room).emit('stealWord', players[room], tiles)
  });
  socket.on('score', function(){
  	var scores = players[roomName].map(function(player){
  		var score = 0;
  		player.words.forEach(function(word){
  			word = word.split("")
  			word.splice(0, 3)
  			score += word.length + 1;
  		})
  		return score;
  	})
  	console.log(Math.max(...scores))
  	io.to(roomName).emit('winner', Math.max(...scores), scores.indexOf(Math.max(...scores)) )
  })
  socket.on('newGame', function(){
  	players[roomName] = [];
  	num[roomName] = 1;
  	roomChars[roomName] = chars;
  	io.to(roomName).emit('newGame')
  })
  socket.on('disconnect', function(){
    console.log('user disconnected');
  });
});


http.listen(port, function(){
  console.log('listening on *:8080');
});


console.log('Your presentation is running on http://localhost:' + 8080);
