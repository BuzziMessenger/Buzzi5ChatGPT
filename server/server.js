const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");

const app = express();
app.use(cors());

app.get("/", (req, res) => {
  res.send("SERVER OK");
});

const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: "*" }
});

io.on("connection", (socket) => {
  console.log("🟢 CONNECTED:", socket.id);

  socket.on("ping_test", (data) => {
    console.log("📩 PING RECEIVED:", data);

    socket.emit("pong_test", "OK FROM SERVER");
  });
});

server.listen(process.env.PORT || 3000, () => {
  console.log("🚀 SERVER RUNNING");
});