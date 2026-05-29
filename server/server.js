import express from "express";
import http from "http";
import mongoose from "mongoose";
import cors from "cors";
import { Server } from "socket.io";

const app = express();
app.use(cors());

const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: "*" }
});

// ================= DB =================
mongoose.connect(process.env.MONGO_URL);

// ================= USERS =================
const User = mongoose.model("User", {
  username: String,
  password: String,
  avatar: String,
  status: String
});

// ================= SOCKET =================
io.on("connection", (socket) => {

  socket.on("auth", async ({ user, pass }) => {

    let u = await User.findOne({ username: user });

    if (!u) {
      u = await User.create({
        username: user,
        password: pass,
        avatar: "",
        status: "online"
      });
    }

    if (u.password !== pass) return;

    socket.username = u.username;
    socket.join(u.username);

    u.status = "online";
    await u.save();

    socket.emit("login_ok", u);
    io.emit("users", await User.find());
  });

  socket.on("msg", (data) => {
    io.to(data.to).emit("msg", data);
    io.to(data.from).emit("msg", data);
  });

  socket.on("buzz", ({ to, from }) => {
    io.to(to).emit("buzz", from);
  });

  socket.on("wink", ({ to, emoji }) => {
    io.to(to).emit("wink", emoji);
  });

  socket.on("disconnect", async () => {
    if (!socket.username) return;

    await User.updateOne(
      { username: socket.username },
      { status: "offline" }
    );

    io.emit("users", await User.find());
  });

});

server.listen(process.env.PORT || 10000);