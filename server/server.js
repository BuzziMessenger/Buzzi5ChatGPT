```js id="serverjs-v2"
// ========================================
// Buzzi Messenger Rebuild v2 - server.js
// ========================================

import express from "express";
import http from "http";
import mongoose from "mongoose";
import { Server } from "socket.io";

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*"
  }
});

// ===============================
// MONGODB
// ===============================

mongoose.connect(
  "mongodb+srv://Buzzi:BuzziMessenger@buzzimessenger.yoprloo.mongodb.net/buzzi_db?retryWrites=true&w=majority"
);

console.log("MongoDB verbonden");

// ===============================
// MODELS
// ===============================

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

// ===============================
// SOCKET
// ===============================

io.on("connection", (socket) => {

  console.log("Nieuwe verbinding");

  // LOGIN / REGISTER
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

    // REGISTER
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
        avatar:
          "https://api.dicebear.com/7.x/fun-emoji/svg?seed=default",
        status: "online",
        lastSeen: Date.now()
      });

    }

    // LOGIN
    if (
      !found ||
      found.password !== pass
    ) {
      return socket.emit(
        "error_msg",
        "Onjuiste login"
      );
    }

    socket.username = found.username;

    socket.join(found.username);

    await User.updateOne(
      { username: found.username },
      {
        status: "online",
        lastSeen: Date.now()
      }
    );

    socket.emit("login_ok", found);

    const users = await User.find();

    io.emit("users", users);

  });

  // MESSAGE
  socket.on("msg", async (m) => {

    const msg = await Message.create({
      ...m,
      read: false
    });

    io.to(m.to).emit("msg", msg);
    io.to(m.from).emit("msg", msg);

  });

  // HISTORY
  socket.on("history", async ({ a, b }) => {

    const msgs = await Message.find({
      $or: [
        { from: a, to: b },
        { from: b, to: a }
      ]
    });

    socket.emit("history", msgs);

  });

  // TYPING
  socket.on("typing", ({ to, from }) => {

    io.to(to).emit("typing", from);

  });

  // STATUS
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

  // AVATAR
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

  // DISCONNECT
  socket.on("disconnect", async () => {

    if (!socket.username) return;

    await User.updateOne(
      { username: socket.username },
      {
        status: "offline",
        lastSeen: Date.now()
      }
    );

    const users = await User.find();

    io.emit("users", users);

  });

});

// ===============================
// USERS SYNC
// ===============================

setInterval(async () => {

  const users = await User.find();

  io.emit("users", users);

}, 5000);

// ===============================
// START SERVER
// ===============================

server.listen(10000, () => {

  console.log(
    "Buzzi Messenger Rebuild v2 draait"
  );

});
```
