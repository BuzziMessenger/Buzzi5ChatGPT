import express from "express";
import http from "http";
import { Server } from "socket.io";
import mongoose from "mongoose";

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: "*" }
});

mongoose.connect("YOUR_MONGO_URI");

const User = mongoose.model("User", {
  username: { type: String, unique: true },
  password: String,
  online: Boolean
});

const Messages = mongoose.model("Message", {
  from: String,
  to: String,
  text: String,
  time: Number
});

io.on("connection", (socket) => {

  socket.on("register", async ({ user, pass, mode }) => {

    if (!user || !pass) return;

    if (mode === "register") {
      const exists = await User.findOne({ username: user });
      if (exists) return socket.emit("login_error");

      await User.create({ username: user, password: pass, online: true });
    }

    const found = await User.findOne({ username: user, password: pass });
    if (!found) return socket.emit("login_error");

    socket.username = user;
    socket.join(user);

    await User.updateOne({ username: user }, { online: true });

    socket.emit("login_success", { username: user });

    sendUsers();
  });

  socket.on("chat_message", async (data) => {
    await Messages.create(data);

    io.to(data.to).emit("chat_message", data);
    io.to(data.from).emit("chat_message", data);
  });

  socket.on("get_history", async ({ userA, userB }) => {

    const msgs = await Messages.find({
      $or: [
        { from: userA, to: userB },
        { from: userB, to: userA }
      ]
    });

    socket.emit("history", msgs);
  });

  socket.on("typing", ({ from, to }) => {
    io.to(to).emit("typing", { from });
  });

  socket.on("stop_typing", ({ from, to }) => {
    io.to(to).emit("stop_typing", { from });
  });

  socket.on("disconnect", async () => {
    if (socket.username) {
      await User.updateOne({ username: socket.username }, { online: false });
      sendUsers();
    }
  });

  function sendUsers() {
    User.find().then(users => {
      io.emit("users", users.map(u => ({
        username: u.username,
        status: u.online ? "online" : "offline"
      })));
    });
  }

});

server.listen(10000, () => console.log("BUZZI FINAL POLISH READY"));