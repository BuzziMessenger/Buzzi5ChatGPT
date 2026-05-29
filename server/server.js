require("dotenv").config();

const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const app = express();

app.use(cors({
  origin: "*"
}));

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  },
  transports: ["websocket", "polling"]
});

/* DB */
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.log(err));

const User = mongoose.model("User", {
  name: String,
  password: String,
  status: String,
  avatar: String
});

const Message = mongoose.model("Message", {
  from: String,
  to: String,
  text: String,
  time: Number
});

/* SOCKET */
io.on("connection", (socket) => {

  console.log("user connected");

  /* LOGIN / REGISTER */
  socket.on("register", async ({ user, pass }) => {

    let dbUser = await User.findOne({ name: user });

    if (!dbUser) {
      const hash = await bcrypt.hash(pass, 10);

      dbUser = await User.create({
        name: user,
        password: hash,
        status: "online",
        avatar: ""
      });
    }

    const ok = await bcrypt.compare(pass, dbUser.password);

    if (!ok) {
      socket.emit("login_fail");
      return;
    }

    socket.name = user;

    dbUser.status = "online";
    await dbUser.save();

    socket.emit("login_success", dbUser);

    const users = await User.find({});
    io.emit("users", users);
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

const PORT = process.env.PORT || 3000;

server.listen(PORT, "0.0.0.0", () => {
  console.log("BUZZI CLEAN V5 RUNNING");
});