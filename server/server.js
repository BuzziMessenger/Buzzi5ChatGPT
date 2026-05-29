import express from "express";
import http from "http";
import { Server } from "socket.io";
import mongoose from "mongoose";

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET","POST"]
  }
});

/* ================= DB ================= */
mongoose.connect("YOUR_MONGO_URI");

const UserSchema = new mongoose.Schema({
  username: { type: String, unique: true },
  password: String
});

const User = mongoose.model("User", UserSchema);

/* ================= SOCKET ================= */
io.on("connection", (socket) => {

  console.log("user connected");

  socket.on("register", async (data) => {

    const { user, pass, mode } = data;

    if (!user || !pass) return;

    try {

      if (mode === "register") {

        const exists = await User.findOne({ username: user });

        if (exists) {
          socket.emit("login_error", { msg: "User bestaat al" });
          return;
        }

        await User.create({ username: user, password: pass });

      }

      const found = await User.findOne({ username: user, password: pass });

      if (!found) {
        socket.emit("login_error", { msg: "Login fout" });
        return;
      }

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

  socket.on("message_seen", ({ from, to }) => {
    io.to(to).emit("message_seen", { from, to });
  });

  /* USERS LIST */
  async function sendUsers() {

    const users = await User.find();

    io.emit("users",
      users.map(u => ({
        username: u.username,
        status: "online"
      }))
    );
  }

});

server.listen(10000, () => {
  console.log("BUZZI RUNNING");
});