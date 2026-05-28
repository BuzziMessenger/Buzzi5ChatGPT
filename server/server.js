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

console.log("🔥 MSN v6.1 SERVER RUNNING");

const users = {};
const messages = {};

function roomKey(a, b) {
  return [a, b].sort().join("-");
}

function pushMessage(a, b, msg) {
  const key = roomKey(a, b);
  if (!messages[key]) messages[key] = [];
  messages[key].push(msg);

  if (messages[key].length > 200) {
    messages[key].shift();
  }
}

function broadcastUsers() {
  io.emit("users", users);
}

function avatar(seed) {
  return `https://api.dicebear.com/7.x/pixel-art/svg?seed=${seed}`;
}

io.on("connection", (socket) => {

  console.log("🟢 CONNECT:", socket.id);

  socket.on("register", (username) => {
    if (!username) return;

    socket.username = username;

    users[username] = {
      id: socket.id,
      status: "online",
      text: "Available",
      avatar: avatar(username),
      lastSeen: Date.now()
    };

    broadcastUsers();
  });

  socket.on("set_status_text", ({ user, text }) => {
    if (users[user]) {
      users[user].text = text || "";
      broadcastUsers();
    }
  });

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

  socket.on("get_history", ({ userA, userB }) => {
    socket.emit("history", messages[roomKey(userA, userB)] || []);
  });

  socket.on("typing", ({ from, to }) => {
    const target = users[to];
    if (target) {
      io.to(target.id).emit("typing", { from });
    }
  });

  socket.on("disconnect", () => {
    if (!socket.username) return;

    if (users[socket.username]) {
      users[socket.username].status = "offline";
      users[socket.username].lastSeen = Date.now();
    }

    broadcastUsers();
  });
});

server.listen(process.env.PORT || 3000, () => {
  console.log("🚀 READY");
});