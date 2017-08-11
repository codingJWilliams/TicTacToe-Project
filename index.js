var app = require('express')();
var http = require('http').Server(app);
var config = require("./config.json");
var io = require('socket.io')(http, {'pingInterval': 3000, 'pingTimeout': 3000});
var rn = require('random-number');
var MongoClient = require('mongodb').MongoClient;

app.get('/', function(req, res){
  res.sendFile(__dirname + config.file_locations.lobby);
});
app.get("/newgame/", function(req, res){ res.redirect('/play/?game=' + generateGameCode() + "&nickname=" + req.query.nickname); })
app.get('/play/', function(req, res){ res.sendFile(__dirname + config.file_locations.play_friend); });
app.use('/static', require('express').static('static'))
function generateGameCode(){ return "TTT-" + gRD() + gRD() + gRD() + gRA() + gRA() + gRA() }
function gRD(){ return String(rn({min:0, max:9, integer: true})) }
function gRA(){ return String.fromCharCode(rn({min: 0, max:25, integer: true}) + 65) }



io.on('connection', function(socket){
    console.log('User Joined');
    socket.on("forward-message", function(params){
      io.to(params.toID).emit(params.event_name, params.payload)
    })
    socket.on('please-join-game', function(params) {
      console.log(params)
      if(!params.game.startsWith("TTT")) return;
      MongoClient.connect(config.database.uri, function (err, db){
        if(err) { return console.dir(err); }
        db.collection("games", function(err, games){
          games.find({code: params.game}).limit(1).toArray(function(err, docs) {
            console.log(err)
            console.log(docs)
            if(docs.length === 1){
              var g = docs[0];
              delete g['_id'];
              g.player2 = socket.id;
              games.updateOne({code: params.game}, {"$set": {"player2": socket.id}}, function (err, d){if (err) console.log(err);});
              socket.emit("game-accepted", {database: g})
            } else {
              var g = {
                code: params.game,
                player1: socket.id
              }
              socket.emit("game-accepted", {database: g})
              games.insertOne(g)
            }
          });
        });
      })
  })
  socket.on('disconnect', function(){
    console.log('user disconnected');
  });
});

http.listen(config.server.port, function(){
  console.log('listening on *:' + config.server.port);
});
