import express from "express";
import http from "http";
import mongoose from "mongoose";
import { Server } from "socket.io";

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: "*" }
});

mongoose.connect("mongodb+srv://Buzzi:BuzziMessenger@buzzimessenger.yoprloo.mongodb.net/buzzi_db");

const User = mongoose.model("User", {
  username: String,
  password: String,
  avatar: String,
  status: String,
  lastSeen: Number
});

const Message = mongoose.model("Message", {
  from: String,
  to: String,
  text: String,
  time: Number,
  read: Boolean
});

io.on("connection", (socket) => {

  socket.on("auth", async ({ user, pass, mode }) => {

    let u = await User.findOne({ username: user });

    if (mode === "register") {
      if (u) return socket.emit("error_msg", "Bestaat al");

      u = await User.create({
        username: user,
        password: pass,
        avatar: "https://api.dicebear.com/7.x/fun-emoji/svg?seed=" + user,
        status: "online",
        lastSeen: Date.now()
      });
    }

    if (!u || u.password !== pass)
      return socket.emit("error_msg", "Fout login");

    socket.username = u.username;
    socket.join(u.username);

    await User.updateOne({ username: u.username }, {
      status: "online",
      lastSeen: Date.now()
    });

    socket.emit("login_ok", u);

    io.emit("users", await User.find());
  });

  socket.on("msg", async (m) => {

    const msg = await Message.create({ ...m, read: false });

    io.to(m.to).emit("msg", msg);
    io.to(m.from).emit("msg", msg);
  });

  socket.on("history", async ({ a, b }) => {

    const msgs = await Message.find({
      $or: [
        { from: a, to: b },
        { from: b, to: a }
      ]
    });

    socket.emit("history", msgs);
  });

  socket.on("typing", ({ to, from }) => {
    io.to(to).emit("typing", from);
  });

  socket.on("buzz", ({ from, to }) => {
    io.to(to).emit("buzz", from);
  });

  socket.on("wink", ({ to, emoji }) => {
    io.to(to).emit("wink", emoji);
  });

  socket.on("status_update", async ({ user, status }) => {
    await User.updateOne({ username: user }, { status });
    io.emit("users", await User.find());
  });

  socket.on("avatar_update", async ({ user, avatar }) => {
    await User.updateOne({ username: user }, { avatar });
    io.emit("users", await User.find());
  });

});

server.listen(10000);