var app = require('express')();
var http = require('http').Server(app);
var config = require("./config.json");

app.get('/', function(req, res){
  res.sendFile(__dirname + config.file_locations.index);
});

http.listen(config.server.port, function(){
  console.log('listening on *:' + config.server.port);
});
