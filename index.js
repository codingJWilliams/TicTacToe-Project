var app = require('express')();
var http = require('http').Server(app);
var config = require("./config.json");
var io = require('socket.io')(http, {'pingInterval': 3000, 'pingTimeout': 3000});
var rn = require('random-number');

app.get('/', function(req, res){
  res.sendFile(__dirname + config.file_locations.lobby);
});
app.get("/newgame/", function(req, res){
  console.log(req.query)
  res.redirect('/play/?game=' + generateGameCode() + "&nickname=" + req.query.nickname);
})
app.use('/static', require('express').static('static'))
function generateGameCode(){ return "TTT-" + gRD() + gRD() + gRD() + gRA() + gRA() + gRA() }
function gRD(){ return String(rn({min:0, max:9, integer: true})) }
function gRA(){ return String.fromCharCode(rn({min: 0, max:25, integer: true}) + 65) }

io.on('connection', function(socket){
  console.log('a user connected');
  socket.on('chat message', function(msg){
    io.emit('chat message', msg);
  });
  socket.on('disconnect', function(){
    console.log('user disconnected');
  });
});

http.listen(config.server.port, function(){
  console.log('listening on *:' + config.server.port);
});
