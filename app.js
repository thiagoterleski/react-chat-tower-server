var app = require('express')();
var server = require('http').Server(app);
var io = require('socket.io')(server);

const port = process.env.PORT || 4001;
server.listen(port);

clients = {}

io.on("connection", function (client) {
  console.log('new connection')
  client.on("join", function(name){
    console.log("Joined: " + name);
    clients[client.id] = name;
    client.emit("update", {
      message: "connected",
      clients: clients,
    });
    client.broadcast.emit("update", {
      message: "Client "+client.id+" was connected",
      clients: clients,
    })
  });

  client.on("send", function(msg){
    console.log("Message: " + msg);
    client.broadcast.emit("chat", clients[client.id], msg);
  });

  client.on("disconnect", function(){
    delete clients[client.id];
    client.broadcast.emit("update", {
      message: "Client "+client.id+" was connected",
      clients: clients,
    })
  });
});
