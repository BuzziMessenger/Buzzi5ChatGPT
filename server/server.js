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

const users = {};
const messages = {};

function roomKey(a, b) {
  return [a, b].sort().join("-");
}

function clean(t) {
  return (t || "").replace(/</g, "").replace(/>/g, "");
}

io.on("connection", (socket) => {

  socket.on("register", (name) => {
    if (!name) return;

    socket.name = name;

    users[name] = {
      id: socket.id,
      status: "online",
      text: "Available"
    };

    io.emit("users", users);
  });

  socket.on("set_status_text", ({ user, text }) => {
    if (users[user]) {
      users[user].text = clean(text);
      io.emit("users", users);
    }
  });

  socket.on("chat_message", (msg) => {
    const key = roomKey(msg.from, msg.to);

    if (!messages[key]) messages[key] = [];

    const fullMsg = {
      ...msg,
      time: Date.now()
    };

    messages[key].push(fullMsg);

    const target = users[msg.to];

    if (target) {
      io.to(target.id).emit("chat_message", fullMsg);
    }

    socket.emit("chat_message", fullMsg);
  });

  socket.on("get_history", ({ userA, userB }) => {
    socket.emit("history", messages[roomKey(userA, userB)] || []);
  });

  socket.on("disconnect", () => {
    if (!socket.name) return;

    if (users[socket.name]) {
      users[socket.name].status = "offline";
    }

    io.emit("users", users);
  });
});

server.listen(3000, () => console.log("MSN PRO SERVER RUNNING"));