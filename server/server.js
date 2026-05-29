require("dotenv").config();

const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const app = express();
app.use(cors({ origin: "*" }));

const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: "*" },
  transports: ["websocket", "polling"]
});

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.log(err));

const User = mongoose.model("User", {
  username: { type: String, required: true, unique: true },
  password: String,
  status: String
});

const Message = mongoose.model("Message", {
  from: String,
  to: String,
  text: String,
  time: Number
});

io.on("connection", (socket) => {

  console.log("user connected");

  socket.on("register", async ({ user, pass, mode }) => {

    if (!user || !pass) return;

    try {

      let dbUser = await User.findOne({ username: user });

      if (mode === "register") {

        if (dbUser) {
          socket.emit("login_fail", "User already exists");
          return;
        }

        const hash = await bcrypt.hash(pass, 10);

        dbUser = await User.create({
          username: user,
          password: hash,
          status: "online"
        });
      }

      if (!dbUser) {
        socket.emit("login_fail", "User not found");
        return;
      }

      const ok = await bcrypt.compare(pass, dbUser.password);

      if (!ok) {
        socket.emit("login_fail", "Wrong password");
        return;
      }

      socket.username = user;

      dbUser.status = "online";
      await dbUser.save();

      socket.emit("login_success", { username: dbUser.username });

      emitUsers(io);

    } catch (err) {
      console.log(err);
      socket.emit("login_fail", "Server error");
    }
  });

  socket.on("get_history", async ({ userA, userB }) => {

    const msgs = await Message.find({
      $or: [
        { from: userA, to: userB },
        { from: userB, to: userA }
      ]
    }).sort({ time: 1 });

    socket.emit("history", msgs);
  });

  socket.on("chat_message", async (msg) => {

    if (!msg.from || !msg.to || !msg.text) return;

    const saved = await Message.create({
      from: msg.from,
      to: msg.to,
      text: msg.text,
      time: Date.now()
    });

    io.emit("chat_message", saved);
  });

  socket.on("disconnect", async () => {

    if (!socket.username) return;

    await User.updateOne(
      { username: socket.username },
      { status: "offline" }
    );

    emitUsers(io);
  });

});

/* =========================
   SAFE USERS EMIT (FIX)
========================= */
async function emitUsers(io) {

  const users = await User.find({
    username: { $ne: null }   // 🔴 FIX: geen null users
  });

  io.emit("users", users);
}

const PORT = process.env.PORT || 3000;

server.listen(PORT, "0.0.0.0", () => {
  console.log("BUZZI CORE LOCK v1.1 RUNNING");
});