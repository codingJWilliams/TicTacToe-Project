var app = require('express')();
var http = require('http').Server(app);
var config = require("./config.json");
var io = require('socket.io')(http, {'pingInterval': config.socket.ping.interval, 'pingTimeout': config.socket.ping.timeout});
var rn = require('random-number');
var MongoClient = require('mongodb').MongoClient;

app.get('/', function(req, res){ res.sendFile(__dirname + config.file_locations.lobby); }); // Serve up static "join game" page
app.get("/newgame/", function(req, res){ res.redirect('/play/?game=' + generateGameCode() + "&nickname=" + req.query.nickname); }) // On request to /newgame/ make a game code. Could be client side TODO: Make client side
app.get('/play/', function(req, res){ res.sendFile(__dirname + config.file_locations.play_friend); }); // Serve up static file. No magic here
app.use('/static', require('express').static('static'))

function generateGameCode(){ return "TTT-" + gRD() + gRD() + gRD() + gRA() + gRA() + gRA() } // Return String game code where format is TTT-111AAA
function gRD(){ return String(rn({min:0, max:9, integer: true})) }                     // Returns random 0-9 character
function gRA(){ return String.fromCharCode(rn({min: 0, max:25, integer: true}) + 65) } // Returns random A-Z character
io.on('connection', function(socket){                                                                                  // Magic here ^^
    console.log('User Joined');                                                        // When user connects, log to console TODO: Log to database? More extensive?
    socket.on("forward-message", function(params){                                     //   When client requests to forward a message on
      io.to(params.toID).emit(params.event_name, params.payload)                       //   Send a message to the socket requested with the event and payload sent
      /*
      ^^^^ This makes it so much easier to design the game, as it keeps the bulk of the code in the html.
      The server only needs to make the initial introductions sending each client the other's id then they
      can communicate in whatever way they want
      */
    })
    socket.on('please-join-game', function(params) {
      console.log(params)                                                       // The client will request like { game: "TTT-111AAA" }
      if(!params.game.startsWith("TTT")) return;                                // If the game code looks invalid, refuse TODO: Better checking
      MongoClient.connect(config.database.uri, function (err, db){              // Connect to database
        if(err) { return console.dir(err); }
        db.collection(config.database.collection, function(err, games){         // Get games collection as var games
          games.find({code: params.game}).limit(1).toArray(function(err, docs) {
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

http.listen(config.server.port, function(){ console.log('HTTP Server is listening on *:' + config.server.port); });
