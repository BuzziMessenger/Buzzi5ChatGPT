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

io.on("connection", (socket) => {
  console.log("user connected");

  socket.on("message", (data) => {
    io.emit("message", data);
  });
});

server.listen(process.env.PORT || 3000, () => {
  console.log("running");
});