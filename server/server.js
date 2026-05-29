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
  status: { type: String, default: "online" }
});

const Message = mongoose.model("Message", {
  from: String,
  to: String,
  text: String,
  time: Number
});

io.on("connection", (socket) => {

  socket.on("register", async ({ user, pass, mode }) => {

    if (!user || !pass) {
      socket.emit("login_error", "missing");
      return;
    }

    try {

      if (mode === "register") {
        const exists = await User.findOne({ username: user });
        if (exists) {
          socket.emit("login_error", "exists");
          return;
        }

        await User.create({ username: user, password: pass });
      }

      const found = await User.findOne({ username: user, password: pass });

      if (!found) {
        socket.emit("login_error", "wrong");
        return;
      }

      socket.username = user;
      socket.join(user);

      await User.updateOne({ username: user }, { status: "online" });

      socket.emit("login_success", { username: user });

      sendUsers();

    } catch (e) {
      console.log(e);
      socket.emit("login_error", "server");
    }
  });

  socket.on("chat_message", async (data) => {
    const msg = await Message.create(data);

    io.to(data.to).emit("chat_message", msg);
    io.to(data.from).emit("chat_message", msg);
  });

  socket.on("get_history", async ({ userA, userB }) => {

    const msgs = await Message.find({
      $or: [
        { from: userA, to: userB },
        { from: userB, to: userA }
      ]
    });

    socket.emit("history", msgs);
  });

  socket.on("disconnect", async () => {
    if (socket.username) {
      await User.updateOne(
        { username: socket.username },
        { status: "offline" }
      );
      sendUsers();
    }
  });

  function sendUsers() {
    User.find().then(users => {
      io.emit("users", users.map(u => ({
        username: u.username,
        status: u.status
      })));
    });
  }

});

server.listen(10000, () => {
  console.log("BUZZI STABLE RUNNING");
});