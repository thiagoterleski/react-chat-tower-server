var app = require('express')();
var server = require('http').Server(app);
var io = require('socket.io')(server);
var randomColor = require('randomcolor');

const port = process.env.PORT || 4001;
server.listen(port);

users = []
messageboard = []

const removeUser = (id) => {
  return users.filter(( c ) => c.id !== id);
}

const getUser = (id) => {
  return users.find(u => u.id === id)
}

io.on("connection", function (client) {

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
      color: randomColor({ luminosity: 'bright' }),
    }

    users.push(user)


    // only user
    client.emit("update", {
      message: "connected",
      isConnected: true,
      users: users,
      isInputModalOpen: false,
      userName: '',
      chat: {
        open: true,
        messages: messageboard.slice(-10),
      },
      currentUser: user,
    });

    console.log('===============USERS====================')
    console.log(users)

    // other users
    client.broadcast.emit("update", {
      users: users,
    })
  });

  client.on("sendMessage", function(data){
    console.info('===================sendMessage=====================')
    console.log(users)
    const chatUser = getUser(client.id)
    console.log(client.id)
    console.log(chatUser)

    if (!chatUser) {
      return client.emit("error", { message: 'User not found' })
    }


    messageboard.push({
      message: data.message,
      user: chatUser,
      createdAt: new Date().toISOString(),
    })

    const sliceMessages = messageboard.slice(-10)

    client.emit("chat", sliceMessages);
    client.broadcast.emit("chat", sliceMessages);

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

    client.broadcast.emit("update", {
      message: "Client "+client.id+" was disconnected",
      users: users,
    })
  });
});
