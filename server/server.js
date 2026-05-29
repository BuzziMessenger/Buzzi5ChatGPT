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
  password: String
});

io.on("connection", (socket) => {

  console.log("connected");

  socket.on("register", async ({ user, pass, mode }) => {

    if (!user || !pass) return;

    try {

      if (mode === "register") {
        const exists = await User.findOne({ username: user });
        if (exists) return socket.emit("login_error", "Bestaat al");

        await User.create({ username: user, password: pass });
      }

      const found = await User.findOne({ username: user, password: pass });
      if (!found) return socket.emit("login_error", "Fout login");

      socket.username = user;
      socket.join(user);

      socket.emit("login_success", { username: user });

      sendUsers();

    } catch (e) {
      console.log(e);
    }
  });

  socket.on("chat_message", (data) => {
    io.to(data.to).emit("chat_message", data);
    io.to(data.from).emit("chat_message", data);
  });

  socket.on("typing", ({ from, to }) => {
    io.to(to).emit("typing", { from });
  });

  socket.on("stop_typing", ({ from, to }) => {
    io.to(to).emit("stop_typing", { from });
  });

  function sendUsers() {
    User.find().then(users => {
      io.emit("users", users.map(u => ({
        username: u.username,
        status: "online"
      })));
    });
  }

});

server.listen(10000, () => console.log("BUZZI SNAPSHOT RUNNING"));