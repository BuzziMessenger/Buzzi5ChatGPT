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

io.on("connection", (socket) => {
  console.log("connected:", socket.id);

  socket.on("chat_message", (msg) => {
    console.log("msg received:", msg);

    io.emit("chat_message", msg); // broadcast naar iedereen
  });
});

server.listen(process.env.PORT || 3000, () => {
  console.log("running");
});