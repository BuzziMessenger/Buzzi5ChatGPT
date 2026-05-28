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

io.on("connection", (socket) => {

  console.log("connected:", socket.id);

  socket.on("register", (username) => {
    if (!username) return;

    users[username] = socket.id;
    socket.username = username;

    io.emit("users", Object.keys(users));
  });

  socket.on("private_message", ({ from, to, text }) => {
    const targetSocket = users[to];

    if (targetSocket) {
      io.to(targetSocket).emit("private_message", { from, text });
    }

    socket.emit("private_message", { from, text });
  });

  socket.on("disconnect", () => {
    if (socket.username) {
      delete users[socket.username];
      io.emit("users", Object.keys(users));
    }
  });

});

server.listen(process.env.PORT || 3000, () => {
  console.log("running");
});