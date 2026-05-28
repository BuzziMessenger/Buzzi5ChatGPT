const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");

const app = express();
app.use(cors());

app.get("/", (req, res) => {
  res.send("OK SERVER RUNNING");
});

const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: "*" }
});

console.log("🔥 FILE LOADED");

io.on("connection", (socket) => {
  console.log("🟢 CLIENT CONNECTED:", socket.id);

  socket.onAny((event, data) => {
    console.log("📡 EVENT RECEIVED:", event, data);
  });

  socket.on("chat_message", (msg) => {
    console.log("💬 CHAT MESSAGE:", msg);

    io.emit("chat_message", msg);
  });
});

server.listen(process.env.PORT || 3000, () => {
  console.log("🚀 SERVER LISTENING");
});