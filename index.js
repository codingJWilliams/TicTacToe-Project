var app = require('express')();
var http = require('http').Server(app);
var config = require("./config.json");
var io = require('socket.io')(http);

app.get('/', function(req, res){
  res.sendFile(__dirname + config.file_locations.index);
});

io.on('connection', function(socket){
  console.log('a user connected');
  socket.on('disconnect', function(){
    console.log('user disconnected');
  });
});

http.listen(config.server.port, function(){
  console.log('listening on *:' + config.server.port);
});
