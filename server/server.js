const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
require("dotenv").config();

const app = express();
const server = http.createServer(app);

app.use(cors());
app.use(express.json());

/* HEALTH CHECK (IMPORTANT FOR RENDER + DEBUG) */
app.get("/health", (req, res) => {
  res.json({ status: "ok", time: Date.now() });
});

/* SOCKET */
const io = new Server(server, {
  cors: { origin: "*" }
});

/* DB */
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

/* SOCKET HANDLER */
io.on("connection", (socket) => {

  console.log("🟢 CONNECT:", socket.id);

  /* LOGIN */
  socket.on("login", async (data) => {
    console.log("🔥 LOGIN REQUEST:", data);

    try {
      if (!data?.username || !data?.password) {
        socket.emit("login_failed", "Missing fields");
        return;
      }

      const user = await User.findOne({ username: data.username });

      if (!user) {
        socket.emit("login_failed", "User not found");
        return;
      }

      const ok = await bcrypt.compare(data.password, user.password);

      if (!ok) {
        socket.emit("login_failed", "Wrong password");
        return;
      }

      onlineUsers[socket.id] = data.username;

      socket.emit("login_success", {
        username: data.username
      });

      io.emit("users_update", Object.values(onlineUsers));

      console.log("✅ LOGIN OK:", data.username);

    } catch (err) {
      console.log("🔥 LOGIN ERROR:", err);
      socket.emit("login_failed", "Server error");
    }
  });

  /* REGISTER */
  socket.on("register", async (data) => {
    console.log("🆕 REGISTER:", data);

    try {
      const exists = await User.findOne({ username: data.username });

      if (exists) {
        socket.emit("register_failed", "User exists");
        return;
      }

      const hash = await bcrypt.hash(data.password, 10);

      await User.create({
        username: data.username,
        password: hash,
        avatar: ""
      });

      socket.emit("register_ok");

    } catch (err) {
      console.log("🔥 REGISTER ERROR:", err);
      socket.emit("register_failed", "Server error");
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

/* START */
server.listen(3000, () => {
  console.log("🚀 Buzzi Messenger stable running");
});