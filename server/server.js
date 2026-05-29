```js
import express from "express";
import http from "http";
import { Server } from "socket.io";
import mongoose from "mongoose";

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: "*" }
});

mongoose.connect(
  "mongodb+srv://Buzzi:BuzziMessenger@buzzimessenger.yoprloo.mongodb.net/buzzi_db?retryWrites=true&w=majority"
);

/* =========================
   MODELS
========================= */

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

/* =========================
   ONLINE USERS
========================= */

const onlineUsers = {};

/* =========================
   SOCKET
========================= */

io.on("connection", (socket) => {

  socket.on("auth", async ({ user, pass, mode }) => {

    if (!user || !pass) {
      return socket.emit("error_msg", "Vul alle velden in");
    }

    let found = await User.findOne({ username: user });

    if (mode === "register") {

      if (found) {
        return socket.emit("error_msg", "Gebruiker bestaat al");
      }

      found = await User.create({
        username: user,
        password: pass,
        status: "online",
        avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=chat1"
      });

    }

    if (!found || found.password !== pass) {
      return socket.emit("error_msg", "Onjuiste login");
    }

    socket.username = found.username;

    onlineUsers[found.username] = socket.id;

    socket.join(found.username);

    await User.updateOne(
      { username: found.username },
      { status: "online" }
    );

    socket.emit("login_ok", found);

    const users = await User.find();

    io.emit("users", users);

  });

  /* =========================
     BERICHTEN
  ========================= */

  socket.on("msg", async (m) => {

    const msg = await Message.create({
      ...m,
      read: false
    });

    io.to(m.to).emit("msg", msg);
    io.to(m.from).emit("msg", msg);

  });

  /* =========================
     HISTORY
  ========================= */

  socket.on("history", async ({ a, b }) => {

    const msgs = await Message.find({
      $or: [
        { from: a, to: b },
        { from: b, to: a }
      ]
    });

    socket.emit("history", msgs);

  });

  /* =========================
     TYPING
  ========================= */

  socket.on("typing", ({ to, from }) => {
    io.to(to).emit("typing", from);
  });

  /* =========================
     STATUS
  ========================= */

  socket.on("status_update", async ({ user, status }) => {

    await User.updateOne(
      { username: user },
      { status }
    );

    const users = await User.find();

    io.emit("users", users);

  });

  /* =========================
     AVATAR
  ========================= */

  socket.on("avatar_update", async ({ user, avatar }) => {

    await User.updateOne(
      { username: user },
      { avatar }
    );

    const users = await User.find();

    io.emit("users", users);

  });

  /* =========================
     DISCONNECT
  ========================= */

  socket.on("disconnect", async () => {

    if (!socket.username) return;

    delete onlineUsers[socket.username];

    await User.updateOne(
      { username: socket.username },
      { status: "offline" }
    );

    const users = await User.find();

    io.emit("users", users);

  });

});

server.listen(10000, () => {
  console.log("BUZZI FINAL ONLINE");
});
```
