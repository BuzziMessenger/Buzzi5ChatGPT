const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
require("dotenv").config();

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: "*" }
});

app.use(cors());
app.use(express.json());

/* 🔌 MONGO CONNECT + DEBUG */
mongoose.connect(process.env.MONGO_URL)
  .then(() => console.log("✅ MongoDB connected"))
  .catch(err => console.log("❌ Mongo error:", err));

/* USER MODEL */
const UserSchema = new mongoose.Schema({
  username: String,
  password: String,
  avatar: String
});

const User = mongoose.model("User", UserSchema);

/* ONLINE USERS */
let onlineUsers = {};

/* SOCKET */
io.on("connection", (socket) => {

  console.log("🟢 User connected:", socket.id);

  /* REGISTER */
  socket.on("register", async ({ username, password }) => {
    try {
      console.log("REGISTER:", username);

      const exists = await User.findOne({ username });

      if (exists) {
        console.log("❌ User exists");
        socket.emit("register_failed", "User already exists");
        return;
      }

      const hash = await bcrypt.hash(password, 10);

      await User.create({
        username,
        password: hash,
        avatar: ""
      });

      console.log("✅ Registered:", username);
      socket.emit("register_ok");

    } catch (err) {
      console.log("❌ Register error:", err);
      socket.emit("register_failed", "Server error");
    }
  });

  /* LOGIN */
  socket.on("login", async ({ username, password }) => {
    try {
      console.log("LOGIN:", username);

      const user = await User.findOne({ username });

      if (!user) {
        socket.emit("login_failed", "User not found");
        return;
      }

      const ok = await bcrypt.compare(password, user.password);

      if (!ok) {
        socket.emit("login_failed", "Wrong password");
        return;
      }

      onlineUsers[socket.id] = username;

      socket.emit("login_success", {
        username,
        avatar: user.avatar
      });

      io.emit("users_update", Object.values(onlineUsers));

      console.log("✅ Login success:", username);

    } catch (err) {
      console.log("❌ Login error:", err);
      socket.emit("login_failed", "Server error");
    }
  });

  /* MESSAGE */
  socket.on("send_message", (msg) => {
    io.emit("receive_message", msg);
  });

  /* DISCONNECT */
  socket.on("disconnect", () => {
    delete onlineUsers[socket.id];
    io.emit("users_update", Object.values(onlineUsers));
  });
});

server.listen(3000, () => {
  console.log("🚀 Buzzi Messenger 11.1 FIXED running");
});