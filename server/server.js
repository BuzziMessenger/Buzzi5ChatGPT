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

  console.log("🔌 connected:", socket.id);

  socket.on("register", (username) => {
    users[username] = socket.id;
    socket.username = username;

    console.log("👤 register:", username);
    io.emit("users", Object.keys(users));
  });

  socket.on("private_message", (data) => {
    console.log("📩 RECEIVED:", data);

    const { from, to, text } = data;

    const target = users[to];

    if (!target) {
      console.log("❌ user not found:", to);
      return;
    }

    console.log("➡ sending to:", to);

    io.to(target).emit("private_message", {
      from,
      text
    });

    socket.emit("private_message", {
      from,
      text
    });
  });

  socket.on("disconnect", () => {
    console.log("❌ disconnect");

    for (const name in users) {
      if (users[name] === socket.id) {
        delete users[name];
      }
    }

    io.emit("users", Object.keys(users));
  });
});

server.listen(process.env.PORT || 3000, () => {
  console.log("🚀 MSN server running");
});