```js
// ================================
// server.js
// Buzzi Messenger Stable Base v1
// ================================

import express from "express";
import http from "http";
import { Server } from "socket.io";
import mongoose from "mongoose";

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*"
  }
});

/* ================================
   MONGODB
================================ */

mongoose.connect(
  "mongodb+srv://Buzzi:BuzziMessenger@buzzimessenger.yoprloo.mongodb.net/buzzi_db?retryWrites=true&w=majority"
);

console.log("MongoDB verbonden");

/* ================================
   MODELS
================================ */

const User = mongoose.model("User", {
  username: String,
  password: String,
  status: String,
  avatar: String
});

const Message = mongoose.model("Message", {
  from: String,
  to: String,
  text: String,
  time: Number,
  read: Boolean
});

/* ================================
   SOCKET.IO
================================ */

io.on("connection", (socket) => {

  console.log("Nieuwe gebruiker verbonden");

  /* LOGIN / REGISTER */
  socket.on("auth", async ({ user, pass, mode }) => {

    if (!user || !pass) {
      return socket.emit(
        "error_msg",
        "Vul alle velden in"
      );
    }

    let found = await User.findOne({
      username: user
    });

    /* REGISTER */
    if (mode === "register") {

      if (found) {
        return socket.emit(
          "error_msg",
          "Gebruiker bestaat al"
        );
      }

      found = await User.create({
        username: user,
        password: pass,
        status: "online",
        avatar:
          "https://api.dicebear.com/7.x/bottts/svg?seed=default"
      });

    }

    /* LOGIN */
    if (
      !found ||
      found.password !== pass
    ) {
      return socket.emit(
        "error_msg",
        "Onjuiste login"
      );
    }

    /* AVATAR FIX */
    if (!found.avatar) {

      found.avatar =
        "https://api.dicebear.com/7.x/bottts/svg?seed=default";

      await found.save();

    }

    socket.username = found.username;

    socket.join(found.username);

    await User.updateOne(
      { username: found.username },
      { status: "online" }
    );

    socket.emit("login_ok", found);

    const users = await User.find();

    io.emit("users", users);

  });

  /* BERICHT */
  socket.on("msg", async (m) => {

    const msg = await Message.create({
      ...m,
      read: false
    });

    io.to(m.to).emit("msg", msg);
    io.to(m.from).emit("msg", msg);

  });

  /* GESCHIEDENIS */
  socket.on("history", async ({ a, b }) => {

    const msgs = await Message.find({
      $or: [
        { from: a, to: b },
        { from: b, to: a }
      ]
    });

    socket.emit("history", msgs);

  });

  /* TYPING */
  socket.on("typing", ({ to, from }) => {

    io.to(to).emit("typing", from);

  });

  /* STATUS */
  socket.on(
    "status_update",
    async ({ user, status }) => {

      await User.updateOne(
        { username: user },
        { status }
      );

      const users = await User.find();

      io.emit("users", users);

    }
  );

  /* AVATAR */
  socket.on(
    "avatar_update",
    async ({ user, avatar }) => {

      await User.updateOne(
        { username: user },
        { avatar }
      );

      const users = await User.find();

      io.emit("users", users);

    }
  );

  /* DISCONNECT */
  socket.on("disconnect", async () => {

    if (!socket.username) return;

    await User.updateOne(
      { username: socket.username },
      { status: "offline" }
    );

    const users = await User.find();

    io.emit("users", users);

  });

});

/* ================================
   USERS SYNC
================================ */

setInterval(async () => {

  const users = await User.find();

  io.emit("users", users);

}, 5000);

/* ================================
   START SERVER
================================ */

server.listen(10000, () => {

  console.log(
    "Buzzi Messenger server draait op poort 10000"
  );

});
```
