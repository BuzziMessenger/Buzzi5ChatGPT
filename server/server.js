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

  socket.on("register", (username) => {
    users[username] = socket.id;
    socket.username = username;

    io.emit("users", Object.keys(users));
    console.log("User online:", username);
  });

  socket.on("private_message", (data) => {
    const { from, to, text } = data;

    console.log("MSG:", from, "->", to, text);

    const target = users[to];

    if (target) {
      io.to(target).emit("private_message", { from, text });
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
  console.log("Server running");
});