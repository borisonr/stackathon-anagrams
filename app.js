// Creating an express server

var express = require('express')
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

var device = require('express-device');
var path = require('path');
var rootPath = path.join(__dirname, './');

// This is needed if the app is run on heroku and other cloud providers:

// var port = process.env.PORT || 8080;

// Initialize a new socket.io object. It is bound to 
// the express app, which allows them to coexist.

// var io = require('socket.io').listen(app.listen(port));

// detect device

app.use(device.capture());

// Make the files in the public folder available to the world
// app.use(express.static(__dirname + '/public'));

app.use(express.static(path.join(rootPath, './node_modules')));
app.use(express.static(path.join(rootPath, './Browser')));

app.get('/', function (req, res) {
        res.sendFile(path.join(rootPath, '/Browser/home.html'));
    });

// App Configuration

app.get('/api/device', function(req, res, next){
	if(req.device.type === "desktop") res.send('desktop');
	if(req.device.type === "phone") res.send('phone');
})

// io.on('connection', function (socket) {
//   socket.emit('news', { hello: 'world' });
//   socket.on('my other event', function (data) {
//     console.log(data);
//   });
// });

io.on('connection', function(socket){
  console.log('a user connected');
  socket.on('newTile', function(data){
    io.emit('newTile', data)
  });
  socket.on('newWord', function(word, tiles){
    io.emit('newWord', word, tiles)
  });
  socket.on('disconnect', function(){
    console.log('user disconnected');
  });
});


http.listen(8080, function(){
  console.log('listening on *:8080');
});


console.log('Your presentation is running on http://localhost:' + 8080);