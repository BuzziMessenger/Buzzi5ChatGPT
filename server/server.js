const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");

const app = express();
app.use(cors());

const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: "*" }
});

console.log("🔥 SERVER LOADED");

const users = {}; // username -> socket.id

io.on("connection", (socket) => {
  console.log("🟢 CONNECTED:", socket.id);

  // REGISTER USER
  socket.on("register", (username) => {
    if (!username) return;

    socket.username = username;
    users[username] = socket.id;

    console.log("👤 REGISTER:", username);

    io.emit("users", Object.keys(users));

    io.emit("system_message", `${username} is online`);
  });

  // PRIVATE MESSAGE
  socket.on("chat_message", ({ from, to, text }) => {
    console.log(`💬 ${from} -> ${to}:`, text);

    const target = users[to];

    const payload = { from, to, text };

    // naar ontvanger
    if (target) io.to(target).emit("chat_message", payload);

    // terug naar verzender
    socket.emit("chat_message", payload);
  });

  // DISCONNECT
  socket.on("disconnect", () => {
    if (socket.username) {
      delete users[socket.username];
      io.emit("users", Object.keys(users));
      io.emit("system_message", `${socket.username} is offline`);
    }
  });
});

server.listen(process.env.PORT || 3000, () => {
  console.log("🚀 RUNNING");
});