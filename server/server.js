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

console.log("🔥 MSN v6 FULL SYSTEM LOADED");

const users = {};
const messages = {};

function roomKey(a, b) {
  return [a, b].sort().join("-");
}

function pushMessage(a, b, msg) {
  const key = roomKey(a, b);
  if (!messages[key]) messages[key] = [];
  messages[key].push(msg);
  if (messages[key].length > 150) messages[key].shift();
}

function broadcastUsers() {
  io.emit("users", users);
}

/* DEFAULT AVATARS */
const defaultAvatars = [
  "https://api.dicebear.com/7.x/pixel-art/svg?seed=msn1",
  "https://api.dicebear.com/7.x/pixel-art/svg?seed=msn2",
  "https://api.dicebear.com/7.x/pixel-art/svg?seed=msn3",
  "https://api.dicebear.com/7.x/pixel-art/svg?seed=msn4"
];

function randomAvatar() {
  return defaultAvatars[Math.floor(Math.random() * defaultAvatars.length)];
}

io.on("connection", (socket) => {

  socket.on("register", (username) => {
    if (!username) return;

    socket.username = username;

    if (!users[username]) {
      users[username] = {
        id: socket.id,
        status: "online",
        text: "Available",
        avatar: randomAvatar(),
        lastSeen: Date.now()
      };
    } else {
      users[username].id = socket.id;
      users[username].status = "online";
    }

    broadcastUsers();
  });

  /* STATUS TEXT */
  socket.on("set_status_text", ({ user, text }) => {
    if (users[user]) {
      users[user].text = text;
      broadcastUsers();
    }
  });

  /* CHAT */
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

  /* HISTORY */
  socket.on("get_history", ({ userA, userB }) => {
    socket.emit("history", messages[roomKey(userA, userB)] || []);
  });

  /* TYPING */
  socket.on("typing", ({ from, to }) => {
    if (users[to]) {
      io.to(users[to].id).emit("typing", { from });
    }
  });

  /* DISCONNECT */
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
  console.log("🚀 RUNNING");
});