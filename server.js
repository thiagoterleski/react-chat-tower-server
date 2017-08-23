var app = require('express')();
var server = require('http').Server(app);
var io = require('socket.io')(server);
var randomColor = require('randomcolor');

const port = process.env.PORT || 4001;
server.listen(port);

let users = []
let messageboard = []
const totalMessages = 10

const removeUser = (id) => {
  return users.filter(( c ) => c.id !== id);
}

const getUser = (id) => {
  return users.find(u => u.id === id)
}

/**
 * For each new connection, this event will be fired
 * @param  {client}
 * A unique identifier for the session, that comes from the underlying Client
 */
io.on("connection", function (client) {

  /**
   * User join to chat
   * @param  { name: string, avatar: string}
   */
  client.on("join", function(data){

    // Check if client.id is alhead exists
    const alheadExistsClient = users.find(c => c.id === client.id)

    if(alheadExistsClient) {
      return client.emit("update", {
        message: "client is alread connected",
      });
    }

    // Create the new user object and generate a random color for him
    const user = {
      id: client.id,
      name: data.name,
      avatar: data.avatar,
      color: randomColor({ luminosity: 'light' }),
    }

    users.push(user)

    // sending to the client
    // The {update} event will be responsible for change the entire state of app
    client.emit("update", {
      message: "connected",
      isConnected: true,
      users: users,
      isInputModalOpen: false,
      userName: '',
      chat: {
        open: true,
        messages: messageboard.slice(-totalMessages),
      },
      currentUser: user,
    });

    // update other users
    client.broadcast.emit("update", {
      users: users,
    })
  });

  /**
   * Send Message Event
   * @param  {string} message
   */
  client.on("sendMessage", function(data){
    const chatUser = getUser(client.id)

    // Check if the user is present
    if (!chatUser) {
      return client.emit("error", { message: 'User not found' })
    }

    messageboard.push({
      message: data.message,
      user: chatUser,
      createdAt: new Date().toISOString(),
    })

    const sliceMessages = messageboard.slice(-totalMessages)

    // Update the client and other users
    client.emit("chat", sliceMessages);
    client.broadcast.emit("chat", sliceMessages);

  });

  /**
   * Change the avatar
   * @param  {string} avatar name
   */
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
  });


  /**
   * Disconect user
   */
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
