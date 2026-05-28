const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");

const app = express();
app.use(cors());

app.get("/", (req, res) => {
  res.send("SERVER IS RUNNING");
});

const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: "*" }
});

console.log("🔥 SERVER FILE LOADED");

// simpele user map
const users = {};

io.on("connection", (socket) => {
  console.log("🟢 SOCKET CONNECTED:", socket.id);

  socket.on("register", (username) => {
    console.log("👤 REGISTER:", username);

    if (!username) return;

    users[username] = socket.id;
    socket.username = username;

    io.emit("users", Object.keys(users));
  });

  socket.on("chat_message", (msg) => {
    console.log("📩 CHAT MSG:", msg);

    io.emit("chat_message", msg);
  });

  socket.on("disconnect", () => {
    console.log("❌ DISCONNECT");

    if (socket.username) {
      delete users[socket.username];
      io.emit("users", Object.keys(users));
    }
  });
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log("🚀 SERVER LISTENING ON PORT", PORT);
});