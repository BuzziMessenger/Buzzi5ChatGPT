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
  cors: { origin: "*" },
  pingInterval: 10000,
  pingTimeout: 5000
});

app.use(cors());
app.use(express.json());

/* HEALTH CHECK (BELANGRIJK VOOR FRONTEND) */
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    time: Date.now()
  });
});

/* MONGO */
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

/* USERS */
let onlineUsers = {};

/* SOCKET */
io.on("connection", (socket) => {

  console.log("🟢 CONNECT:", socket.id);

  socket.on("login", async ({ username, password }) => {
    console.log("LOGIN TRY:", username);

    try {
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

      console.log("✅ LOGIN OK:", username);

    } catch (err) {
      console.log("🔥 LOGIN ERROR:", err);
      socket.emit("login_failed", "Server error");
    }
  });

  socket.on("register", async ({ username, password }) => {
    const exists = await User.findOne({ username });

    if (exists) {
      socket.emit("register_failed", "User exists");
      return;
    }

    const hash = await bcrypt.hash(password, 10);

    await User.create({
      username,
      password: hash,
      avatar: ""
    });

    socket.emit("register_ok");
  });

  socket.on("send_message", (msg) => {
    io.emit("receive_message", msg);
  });

  socket.on("login", (data) => {
  console.log("LOGIN RECEIVED:", data);
});

  socket.on("disconnect", () => {
    delete onlineUsers[socket.id];
    io.emit("users_update", Object.values(onlineUsers));
  });
});

server.listen(3000, () => {
  console.log("🚀 Buzzi Bulletproof 11.2 running");
});