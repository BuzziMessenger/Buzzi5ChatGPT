const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: "*" }
});

io.on("connection", (socket) => {

  console.log("USER CONNECTED:", socket.id);

  socket.on("test_message", (data) => {
    console.log("RECEIVED:", data);

    socket.emit("test_message", data);
  });

});

server.listen(process.env.PORT || 3000, () => {
  console.log("TEST SERVER RUNNING");
});