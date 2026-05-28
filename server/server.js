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

const users = {};

function emitUsers() {
  io.emit("users", Object.keys(users));
}

io.on("connection", (socket) => {

  socket.on("register", (username) => {
    if (!username) return;

    users[username] = socket.id;
    socket.username = username;

    emitUsers();
  });

  socket.on("private_message", ({ from, to, text }) => {

    const target = users[to];

    if (target) {
      io.to(target).emit("private_message", { from, text });
    }

    socket.emit("private_message", { from, text });
  });

  socket.on("disconnect", () => {
    if (socket.username) {
      delete users[socket.username];
      emitUsers();
    }
  });

});

server.listen(process.env.PORT || 3000);