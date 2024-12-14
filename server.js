const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const moment = require('moment'); // For handling time data

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Serve static files from the "public" directory
app.use(express.static('public'));

let waitingUsers = [];
let activeChats = {};
let users = {};
let disconnectedUsers = {}; // Track disconnected users

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('A user connected');
  io.emit('updateOnlineUsers', io.engine.clientsCount); // Update online users

  // Log the connection time
  users[socket.id] = {
    connectTime: moment().format(),
  };

  socket.on('startChat', () => {
    if (waitingUsers.length > 0) {
      const partner = waitingUsers.shift();
      activeChats[socket.id] = partner;
      activeChats[partner] = socket.id;

      io.to(socket.id).emit('chatStarted', partner);
      io.to(partner).emit('chatStarted', socket.id);
    } else {
      waitingUsers.push(socket.id);
      io.to(socket.id).emit('waiting');
    }
  });

  socket.on('chatMessage', (msg) => {
    const partner = activeChats[socket.id];
    if (partner) {
      io.to(partner).emit('chatMessage', msg);
    }
  });

  socket.on('typing', () => {
    const partner = activeChats[socket.id];
    if (partner) {
      io.to(partner).emit('typing');
    }
  });

  socket.on('endChat', () => {
    const partner = activeChats[socket.id];
    if (partner) {
      io.to(partner).emit('chatEnded');
      delete activeChats[partner];
      waitingUsers.push(partner);
      if (waitingUsers.length > 1) {
        const [user1, user2] = waitingUsers.splice(0, 2);
        activeChats[user1] = user2;
        activeChats[user2] = user1;
        io.to(user1).emit('chatStarted', user2);
        io.to(user2).emit('chatStarted', user1);
      }
    }
    delete activeChats[socket.id];
    io.to(socket.id).emit('chatEnded');

    // Automatically connect to waiting user if available
    if (waitingUsers.length > 0) {
      const newPartner = waitingUsers.shift();
      activeChats[newPartner] = socket.id;
      activeChats[socket.id] = newPartner;

      io.to(socket.id).emit('chatStarted', newPartner);
      io.to(newPartner).emit('chatStarted', socket.id);
    }
  });

  socket.on('disconnect', () => {
    const partner = activeChats[socket.id];
    if (partner) {
      io.to(partner).emit('chatEnded');
      delete activeChats[partner];
    }
    waitingUsers = waitingUsers.filter((id) => id !== socket.id);

    // Log the disconnection time and calculate the duration
    const disconnectTime = moment();
    const connectTime = moment(users[socket.id].connectTime);
    const duration = moment.duration(disconnectTime.diff(connectTime)).asMinutes();

    // Save the user activity data
    if (users[socket.id]) {
      users[socket.id].disconnectTime = disconnectTime.format();
      users[socket.id].duration = duration;

      // Move user data to disconnected users
      disconnectedUsers[socket.id] = users[socket.id];
      delete users[socket.id];
    }

    delete activeChats[socket.id];
    io.emit('updateOnlineUsers', io.engine.clientsCount); // Update online users
  });
});

// Route to serve the admin page
app.get('/admin', (req, res) => {
  res.sendFile(__dirname + '/admin.html');
});

// Route to serve user activity data
app.get('/user-activity', (req, res) => {
  res.json(Object.keys(disconnectedUsers).map(id => ({
    id,
    ...disconnectedUsers[id]
  })));
});

// Start the server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
