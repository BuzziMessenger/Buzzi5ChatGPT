const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");

const app = express();
app.use(cors());

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

io.on("connection", (socket) => {
  console.log("user connected");

  socket.on("auth", (data) => {
    socket.emit("login_ok", { username: data.user });
  });

  socket.on("msg", (m) => {
    io.emit("msg", m);
  });

  socket.on("buzz", (b) => {
    io.emit("buzz", b);
  });

  socket.on("wink", (w) => {
    io.emit("wink", w);
  });

  socket.on("disconnect", () => {
    console.log("user disconnected");
  });
});

server.listen(process.env.PORT || 10000);