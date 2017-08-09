var app = require('express')();
var server = require('http').Server(app);
var io = require('socket.io')(server);

const port = process.env.PORT || 4001;
server.listen(port);

users = []

const removeUser = (id) => {
  return users.filter(( c ) => c.id !== id);
}

io.on("connection", function (client) {
  console.log('new connection')
  client.on("join", function(data){

    const alheadExistsClient = users.find(c => c.id === client.id)

    if(alheadExistsClient) {
      return client.emit("update", {
        message: "client is alread connected",
      });
    }

    const user = {
      id: client.id,
      name: data.name,
      avatar: data.avatar,
    }

    users.push(user)

    // only user
    client.emit("update", {
      message: "connected",
      isConnected: true,
      users: users,
      isInputModalOpen: false,
      userName: '',
      currentUser: user,
    });

    // other users
    client.broadcast.emit("update", {
      users: users,
    })
  });

  client.on("send", function(msg){
    console.log("Message: " + msg);
    client.broadcast.emit("chat", users[client.id], msg);
  });

  client.on("updateAvatar", function(avatar){
    const user = users.find(( c ) => c.id == client.id)
    if (user) {
      user.avatar = avatar
      client.emit("update", {
        message: "avatar changed",
        users: users,
      });
      client.broadcast.emit("update", {
        users: users,
      });
    }
    //client.broadcast.emit("chat", users[client.id], msg);
  });


  client.on("logout", function(){

    users = removeUser(client.id)

    client.broadcast.emit("update", {
      message: "User "+client.id+" made logout",
      users: users,
    })

    client.emit("update", {
      message: "disconnected",
      isConnected: false,
      users: users,
    });
  })

  client.on("disconnect", function(){
    users = removeUser(client.id)
    console.log(users)
    client.broadcast.emit("update", {
      message: "Client "+client.id+" was disconnected",
      users: users,
    })
  });
});
