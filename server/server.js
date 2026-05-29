import express from "express";
import http from "http";
import { Server } from "socket.io";
import mongoose from "mongoose";

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: "*" },
  transports: ["polling", "websocket"]
});

mongoose.connect("mongodb+srv://Buzzi:BuzziMessenger@buzzimessenger.yoprloo.mongodb.net/buzzi_db?retryWrites=true&w=majority");

const User = mongoose.model("User", {
  username: { type: String, unique: true },
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

  socket.on("register", async ({ user, pass, mode }) => {

    if (!user || !pass) {
      return socket.emit("login_error", "missing_fields");
    }

    try {

      if (mode === "register") {
        const exists = await User.findOne({ username: user });

        if (exists) {
          return socket.emit("login_error", "user_exists");
        }

        await User.create({
          username: user,
          password: pass,
          status: "online"
        });
      }

      const found = await User.findOne({ username: user });

      if (!found) {
        return socket.emit("login_error", "user_not_found");
      }

      if (found.password !== pass) {
        return socket.emit("login_error", "wrong_password");
      }

      socket.username = user;
      socket.join(user);

      await User.updateOne({ username: user }, { status: "online" });

      socket.emit("login_success", { username: user });

      const users = await User.find();
      io.emit("users", users.map(u => ({
        username: u.username,
        status: u.status
      })));

    } catch (e) {
      console.log(e);
      socket.emit("login_error", "server_error");
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

});

server.listen(10000, () => {
  console.log("BUZZI V2 ONLINE");
});