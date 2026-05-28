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

console.log("🔥 MSN v3 SERVER LOADED");

const users = {};
const messageBuffer = []; // laatste 50 messages

function trimBuffer() {
  if (messageBuffer.length > 50) {
    messageBuffer.splice(0, messageBuffer.length - 50);
  }
}

io.on("connection", (socket) => {
  console.log("🟢 CONNECTED:", socket.id);

  // REGISTER
  socket.on("register", (username) => {
    if (!username) return;

    socket.username = username;
    users[username] = socket.id;

    io.emit("users", Object.keys(users));

    // stuur history
    socket.emit("message_history", messageBuffer);
  });

  // TYPING
  socket.on("typing", ({ from, to }) => {
    const target = users[to];
    if (target) {
      io.to(target).emit("typing", { from });
    }
  });

  // CHAT MESSAGE
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
      io.to(target).emit("chat_message", payload);
    }

    socket.emit("chat_message", payload);
  });

  // DISCONNECT
  socket.on("disconnect", () => {
    if (socket.username) {
      delete users[socket.username];
      io.emit("users", Object.keys(users));
    }
  });
});

server.listen(process.env.PORT || 3000, () => {
  console.log("🚀 RUNNING");
});