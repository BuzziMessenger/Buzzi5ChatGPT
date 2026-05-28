const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
app.use(cors());

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*"
  }
});

// username -> socket.id
const users = {};

function emitUsers() {
  io.emit("users", Object.keys(users));
}

io.on("connection", (socket) => {

  // register user
  socket.on("register", (username) => {
    if (!username) return;

    users[username] = socket.id;
    socket.username = username;

    emitUsers();

    console.log("User joined:", username);
  });

  // private message routing
  socket.on("private_message", ({ from, to, text }) => {
    console.log(from, "->", to, text);

    const targetSocket = users[to];

    // send to receiver
    if (targetSocket) {
      io.to(targetSocket).emit("private_message", {
        from,
        text
      });
    }

    // echo back to sender (sync chat)
    socket.emit("private_message", {
      from,
      text
    });
  });

  // disconnect cleanup
  socket.on("disconnect", () => {
    if (socket.username) {
      delete users[socket.username];
      emitUsers();
    }
  });

});

server.listen(process.env.PORT || 3000, () => {
  console.log("MSN server running");
});