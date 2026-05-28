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

io.on("connection", (socket) => {
  console.log("connected:", socket.id);

  // login/register
  socket.on("register", (username) => {
    if (!username) return;

    socket.username = username;
    users[username] = socket.id;

    console.log("REGISTER:", username);
    io.emit("users", Object.keys(users));
  });

  // private chat
  socket.on("private_message", ({ from, to, text }) => {
    console.log("MSG:", from, "->", to, text);

    const targetId = users[to];

    if (targetId) {
      io.to(targetId).emit("private_message", { from, text });
    }

    socket.emit("private_message", { from, text });
  });

  // disconnect
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