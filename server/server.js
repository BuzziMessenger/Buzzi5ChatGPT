require("dotenv").config();

const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

/* =========================
   MONGOOSE MODELS
========================= */

const userSchema = new mongoose.Schema({
  name: String,
  password: String,
  status: String,
  avatar: String
});

const messageSchema = new mongoose.Schema({
  from: String,
  to: String,
  text: String,
  time: Number
});

const User = mongoose.model("User", userSchema);
const Message = mongoose.model("Message", messageSchema);

/* =========================
   DB CONNECT
========================= */

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.log(err));

/* =========================
   SOCKET LOGIC
========================= */

io.on("connection", (socket) => {

  /* LOGIN / REGISTER */
  socket.on("register", async ({ user, pass }) => {

    let dbUser = await User.findOne({ name: user });

    if (!dbUser) {
      const hash = await bcrypt.hash(pass, 10);

      dbUser = await User.create({
        name: user,
        password: hash,
        status: "online",
        avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${user}`
      });
    }

    const ok = await bcrypt.compare(pass, dbUser.password);

    if (!ok) return socket.emit("login_fail");

    socket.name = user;

    dbUser.status = "online";
    await dbUser.save();

    socket.emit("login_success", dbUser);

    const users = await User.find({});
    io.emit("users", users);
  });

  /* USERS */
  socket.on("get_users", async () => {
    const users = await User.find({});
    socket.emit("users", users);
  });

  /* CHAT */
  socket.on("chat_message", async (msg) => {

    const saved = await Message.create({
      from: msg.from,
      to: msg.to,
      text: msg.text,
      time: Date.now()
    });

    io.emit("chat_message", saved);
  });

  /* HISTORY */
  socket.on("get_history", async ({ userA, userB }) => {

    const msgs = await Message.find({
      $or: [
        { from: userA, to: userB },
        { from: userB, to: userA }
      ]
    }).sort({ time: 1 });

    socket.emit("history", msgs);
  });

  /* DISCONNECT */
  socket.on("disconnect", async () => {
    if (!socket.name) return;

    await User.updateOne(
      { name: socket.name },
      { status: "offline" }
    );

    const users = await User.find({});
    io.emit("users", users);
  });

});

server.listen(process.env.PORT, () => {
  console.log("BUZZI v9 RUNNING");
});