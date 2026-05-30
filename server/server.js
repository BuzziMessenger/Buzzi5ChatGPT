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

/* MESSAGE MODEL */
const MessageSchema = new mongoose.Schema({
  from: String,
  to: String,
  text: String,
  avatar: String,
  time: Number,
  seen: { type: Boolean, default: false }
});

const Message = mongoose.model("Message", MessageSchema);

/* USERS */
let users = {};

io.on("connection", (socket) => {

  /* 👤 JOIN */
  socket.on("add_user", (user) => {
    users[socket.id] = {
      id: socket.id,
      name: user.name,
      avatar: user.avatar
    };

    io.emit("update_users", Object.values(users));
  });

  /* 📥 LOAD DM HISTORY */
  socket.on("load_dm", async ({user1, user2}) => {
    const history = await Message.find({
      $or: [
        { from: user1, to: user2 },
        { from: user2, to: user1 }
      ]
    }).sort({ time: 1 });

    socket.emit("dm_history", history);
  });

  /* 💬 PRIVATE MESSAGE */
  socket.on("private_message", async (msg) => {
    const m = await Message.create({
      ...msg,
      time: Date.now(),
      seen: false
    });

    const target = Object.values(users)
      .find(u => u.name === msg.to);

    if (target) {
      io.to(target.id).emit("private_message", m);
    }

    socket.emit("private_message", m);
  });

  /* 👁 SEEN */
  socket.on("seen", async ({from, to}) => {
    await Message.updateMany(
      { from, to, seen: false },
      { $set: { seen: true } }
    );

    io.emit("update_seen", { from, to });
  });

  /* ❌ DISCONNECT */
  socket.on("disconnect", () => {
    delete users[socket.id];
    io.emit("update_users", Object.values(users));
  });
});

server.listen(3000, () => {
  console.log("Buzzi Messenger 4.0 running");
});