const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const multer = require("multer");
const path = require("path");
require("dotenv").config();

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: "*" }
});

app.use(cors());
app.use(express.json());
app.use("/uploads", express.static("uploads"));

mongoose.connect(process.env.MONGO_URL);

/* STORAGE (AVATARS) */
const storage = multer.diskStorage({
  destination: "./uploads",
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

/* MODELS */
const UserSchema = new mongoose.Schema({
  username: String,
  password: String,
  avatar: String
});

const MessageSchema = new mongoose.Schema({
  from: String,
  to: String,
  text: String,
  time: Number,
  seen: Boolean
});

const User = mongoose.model("User", UserSchema);
const Message = mongoose.model("Message", MessageSchema);

/* ONLINE USERS */
let users = {};
let typingUsers = {};

io.on("connection", (socket) => {

  /* 👤 REGISTER */
  socket.on("register", async ({ username, password }) => {
    const hash = await bcrypt.hash(password, 10);

    await User.create({
      username,
      password: hash,
      avatar: ""
    });

    socket.emit("sound", "login");
  });

  /* 🔑 LOGIN */
  socket.on("login", async ({ username, password }) => {
    const user = await User.findOne({ username });
    if (!user) return socket.emit("login_failed");

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return socket.emit("login_failed");

    users[socket.id] = username;

    io.emit("users_update", Object.values(users));

    socket.emit("login_success", {
      username,
      avatar: user.avatar
    });

    socket.emit("sound", "login");
  });

  /* 🖼 UPLOAD AVATAR */
  app.post("/avatar", upload.single("avatar"), async (req, res) => {
    const url = `https://buzzimessenger.onrender.com/uploads/${req.file.filename}`;
    res.json({ url });
  });

  /* 💬 MESSAGE */
  socket.on("send_message", async (msg) => {
    const m = await Message.create({
      ...msg,
      time: Date.now(),
      seen: false
    });

    io.emit("receive_message", m);
    io.emit("sound", "message");
  });

  /* ✍ TYPING */
  socket.on("typing", ({ user, to, isTyping }) => {
    typingUsers[user] = isTyping;

    io.emit("typing_update", {
      user,
      isTyping
    });
  });

  /* 👁 SEEN */
  socket.on("seen", async ({ from, to }) => {
    await Message.updateMany(
      { from, to, seen: false },
      { seen: true }
    );
  });

  /* ❌ DISCONNECT */
  socket.on("disconnect", () => {
    delete users[socket.id];
    io.emit("users_update", Object.values(users));
  });
});

server.listen(3000, () => {
  console.log("Buzzi Messenger 11.0 FINAL POLISH running");
});