const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");
const mongoose = require("mongoose");
require("dotenv").config();

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: "*" }
});

app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGO_URL);

/* MESSAGE MODEL (ENCRYPTED READY) */
const MessageSchema = new mongoose.Schema({
  from: String,
  to: String,
  encrypted: String,
  time: Number
});

const Message = mongoose.model("Message", MessageSchema);

/* ONLINE USERS */
let users = {};

/* SIMPLE KEY STORE (IN MEMORY) */
let publicKeys = {};

io.on("connection", (socket) => {

  /* JOIN */
  socket.on("join", (user) => {
    users[socket.id] = user.name;
    io.emit("users_update", Object.values(users));
  });

  /* 🔐 PUBLIC KEY EXCHANGE (E2EE BASIS) */
  socket.on("set_key", ({ user, key }) => {
    publicKeys[user] = key;
  });

  socket.on("get_key", (user, cb) => {
    cb(publicKeys[user] || null);
  });

  /* 💬 MESSAGE */
  socket.on("send_message", async (msg) => {
    const saved = await Message.create({
      ...msg,
      time: Date.now()
    });

    io.emit("receive_message", saved);
  });

  /* DISCONNECT */
  socket.on("disconnect", () => {
    delete users[socket.id];
    io.emit("users_update", Object.values(users));
  });
});

server.listen(3000, () => {
  console.log("Buzzi Messenger 10.0 NO-REDIS running");
});