const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");
const socket = io("https://buzzimessenger.onrender.com", {
  transports: ["websocket", "polling"]
});

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

  socket.on("msg", (data) => {
    io.emit("msg", data);
  });

  socket.on("disconnect", () => {
    console.log("user disconnected");
  });
});

server.listen(process.env.PORT || 10000);