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

console.log("🔥 MSN v5 SERVER LOADED");

const users = {}; 
// username -> { id, status, lastSeen }

const messages = {}; 
// "userA-userB" -> [messages]

function roomKey(a, b) {
  return [a, b].sort().join("-");
}

function pushMessage(a, b, msg) {
  const key = roomKey(a, b);
  if (!messages[key]) messages[key] = [];
  messages[key].push(msg);

  if (messages[key].length > 100) {
    messages[key].shift();
  }
}

function sendUserList() {
  io.emit("users", users);
}

io.on("connection", (socket) => {
  console.log("🟢 CONNECT:", socket.id);

  // REGISTER
  socket.on("register", (username) => {
    if (!username) return;

    socket.username = username;

    users[username] = {
      id: socket.id,
      status: "online",
      lastSeen: Date.now()
    };

    sendUserList();

    socket.emit("system", "Welkom " + username);
  });

  // STATUS UPDATE
  socket.on("set_status", ({ user, status }) => {
    if (users[user]) {
      users[user].status = status;
      users[user].lastSeen = Date.now();
      sendUserList();
    }
  });

  // PRIVATE CHAT
  socket.on("chat_message", (data) => {
    const msg = {
      from: data.from,
      to: data.to,
      text: data.text,
      time: Date.now()
    };

    pushMessage(data.from, data.to, msg);

    const target = users[data.to];

    if (target) {
      io.to(target.id).emit("chat_message", msg);
    }

    socket.emit("chat_message", msg);
  });

  // HISTORY REQUEST
  socket.on("get_history", ({ userA, userB }) => {
    const key = roomKey(userA, userB);
    socket.emit("history", messages[key] || []);
  });

  // TYPING
  socket.on("typing", ({ from, to }) => {
    const target = users[to];
    if (target) {
      io.to(target.id).emit("typing", { from });
    }
  });

  // DISCONNECT
  socket.on("disconnect", () => {
    if (!socket.username) return;

    if (users[socket.username]) {
      users[socket.username].status = "offline";
      users[socket.username].lastSeen = Date.now();
    }

    sendUserList();
  });
});

server.listen(process.env.PORT || 3000, () => {
  console.log("🚀 RUNNING");
});