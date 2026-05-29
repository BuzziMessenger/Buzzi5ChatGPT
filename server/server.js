import express from "express";
import http from "http";
import { Server } from "socket.io";
import mongoose from "mongoose";

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: "*" }
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

  socket.on("auth", async ({ user, pass, mode }) => {

    try {

      if (!user || !pass) {
        return socket.emit("error_msg", "Vul alle velden in");
      }

      if (mode === "register") {
        const exists = await User.findOne({ username: user });
        if (exists) return socket.emit("error_msg", "Gebruiker bestaat al");

        await User.create({ username: user, password: pass, status: "online" });
      }

      const found = await User.findOne({ username: user });

      if (!found || found.password !== pass) {
        return socket.emit("error_msg", "Onjuiste login gegevens");
      }

      socket.username = user;
      socket.join(user);

      await User.updateOne({ username: user }, { status: "online" });

      socket.emit("login_ok", { username: user });

      const users = await User.find();
      io.emit("users", users);

    } catch (e) {
      socket.emit("error_msg", "Server fout");
    }
  });

  socket.on("msg", async (data) => {
    const msg = await Message.create(data);
    io.to(data.to).emit("msg", msg);
    io.to(data.from).emit("msg", msg);
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

});

server.listen(10000, () => console.log("BUZZI PRO ONLINE"));