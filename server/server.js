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

console.log("🔥 MSN v4 SERVER LOADED");

const users = {}; // username -> { id, status, lastSeen }

const messageBuffer = [];

function trimBuffer() {
  if (messageBuffer.length > 80) {
    messageBuffer.splice(0, messageBuffer.length - 80);
  }
}

// STATUS DEFAULT
function setStatus(username, status) {
  if (users[username]) {
    users[username].status = status;
    users[username].lastSeen = Date.now();
  }
  io.emit("users", users);
}

io.on("connection", (socket) => {

  console.log("🟢 CONNECT:", socket.id);

  socket.on("register", (username) => {
    if (!username) return;

    socket.username = username;

    users[username] = {
      id: socket.id,
      status: "online",
      lastSeen: Date.now()
    };

    io.emit("users", users);
  });

  socket.on("set_status", ({ user, status }) => {
    setStatus(user, status);
  });

  socket.on("typing", ({ from, to }) => {
    const target = users[to];
    if (target) {
      io.to(target.id).emit("typing", { from });
    }
  });

  socket.on("chat_message", (data) => {

    const payload = {
      from: data.from,
      to: data.to,
      text: data.text,
      time: Date.now()
    };

    messageBuffer.push(payload);
    trimBuffer();

    const target = users[data.to];

    if (target) {
      io.to(target.id).emit("chat_message", payload);
    }

    socket.emit("chat_message", payload);
  });

  socket.on("disconnect", () => {

    if (socket.username && users[socket.username]) {
      users[socket.username].status = "offline";
      users[socket.username].lastSeen = Date.now();

      io.emit("users", users);
    }
  });
});

server.listen(process.env.PORT || 3000, () => {
  console.log("🚀 RUNNING");
});