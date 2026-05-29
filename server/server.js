import express from "express";
import http from "http";
import cors from "cors";
import { Server } from "socket.io";

const app = express();
app.use(cors());

const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: "*" }
});

// state (simple memory for V20 stability)
const users = new Map();

io.on("connection", (socket) => {

  socket.on("auth", ({ user }) => {
    socket.user = user;
    users.set(user, socket.id);

    io.emit("users", Array.from(users.keys()));
  });

  socket.on("msg", (data) => {
    const target = users.get(data.to);
    if (target) io.to(target).emit("msg", data);

    io.to(socket.id).emit("msg", data);
  });

  socket.on("typing", ({ to, from }) => {
    const target = users.get(to);
    if (target) io.to(target).emit("typing", from);
  });

  socket.on("buzz", ({ to, from }) => {
    const target = users.get(to);
    if (target) io.to(target).emit("buzz", from);
  });

  socket.on("wink", ({ to, emoji }) => {
    const target = users.get(to);
    if (target) io.to(target).emit("wink", emoji);
  });

  socket.on("media", ({ to, file }) => {
    const target = users.get(to);
    if (target) io.to(target).emit("media", file);
  });

});

server.listen(process.env.PORT || 10000);