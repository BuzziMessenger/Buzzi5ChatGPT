const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
app.use(cors());

const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: "*" }
});

// username -> socket.id
const users = {};

function getOnlineUsers() {
  return Object.keys(users);
}

io.on("connection", (socket) => {

  // USER REGISTRATION
  socket.on("register", (username) => {
    users[username] = socket.id;
    socket.username = username;

    io.emit("users", getOnlineUsers());
  });

  // PRIVATE MESSAGE ROUTING
  socket.on("private_message", ({ to, from, text }) => {

    const targetSocketId = users[to];

    if (targetSocketId) {
      io.to(targetSocketId).emit("private_message", {
        from,
        text
      });
    }

    // send back to sender too (so chat sync works)
    socket.emit("private_message", {
      from,
      text
    });
  });

  // DISCONNECT
  socket.on("disconnect", () => {
    if (socket.username) {
      delete users[socket.username];
      io.emit("users", getOnlineUsers());
    }
  });
});

server.listen(process.env.PORT || 3000, () => {
  console.log("MSN server running");
});