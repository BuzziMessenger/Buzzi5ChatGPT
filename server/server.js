const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");
const mongoose = require("mongoose");
const multer = require("multer");
const path = require("path");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
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

/* STORAGE (FILES + VOICE) */
const storage = multer.diskStorage({
  destination: "./uploads",
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  }
});
const upload = multer({ storage });

/* MODELS */
const UserSchema = new mongoose.Schema({
  username: String,
  password: String,
  avatar: String,
  friends: [String]
});

const MessageSchema = new mongoose.Schema({
  from: String,
  to: String,
  text: String,
  file: String,
  voice: String,
  time: Number
});

const User = mongoose.model("User", UserSchema);
const Message = mongoose.model("Message", MessageSchema);

/* AUTH */
app.post("/register", async (req, res) => {
  const { username, password } = req.body;

  const hash = await bcrypt.hash(password, 10);

  const user = await User.create({
    username,
    password: hash,
    avatar: ""
  });

  res.json(user);
});

app.post("/login", async (req, res) => {
  const { username, password } = req.body;

  const user = await User.findOne({ username });
  if (!user) return res.status(400).json("No user");

  const ok = await bcrypt.compare(password, user.password);
  if (!ok) return res.status(400).json("Wrong password");

  const token = jwt.sign({ username }, process.env.JWT_SECRET);

  res.json({ token, username });
});

/* FILE UPLOAD */
app.post("/upload", upload.single("file"), (req, res) => {
  res.json({
    url: `https://buzzimessenger.onrender.com/uploads/${req.file.filename}`
  });
});

/* USERS ONLINE */
let online = {};

io.on("connection", (socket) => {

  socket.on("auth", ({ username }) => {
    online[socket.id] = username;
    io.emit("online_users", Object.values(online));
  });

  /* 💬 MESSAGE (TEXT + FILE + VOICE) */
  socket.on("send_message", async (msg) => {
    const m = await Message.create({
      ...msg,
      time: Date.now()
    });

    io.emit("receive_message", m);
  });

  /* ❌ DISCONNECT */
  socket.on("disconnect", () => {
    delete online[socket.id];
    io.emit("online_users", Object.values(online));
  });
});

server.listen(3000, () => {
  console.log("Buzzi Messenger 6.0 ULTIMATE running");
});