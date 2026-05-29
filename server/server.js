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

/**
 * USERS STATE (locked core)
 * username -> { id, status }
 */
const users = new Map();

function broadcastUsers(){
  io.emit("users", Array.from(users.entries()).map(([username, data]) => ({
    username,
    status: data.status
  })));
}

io.on("connection", (socket) => {

  // AUTH
  socket.on("auth", ({ user }) => {
    socket.user = user;

    users.set(user, {
      id: socket.id,
      status: "online"
    });

    broadcastUsers();
  });

  // DISCONNECT → OFFLINE FIX
  socket.on("disconnect", () => {
    if (socket.user) {
      const u = users.get(socket.user);
      if (u) {
        u.status = "offline";
        u.id = null;
      }
    }
    broadcastUsers();
  });

  // MESSAGE CORE
  socket.on("msg", (data) => {
    const target = users.get(data.to);

    if (target?.id) {
      io.to(target.id).emit("msg", data);
    }

    io.to(socket.id).emit("msg", data);
  });

  // TYPING
  socket.on("typing", ({ to, from }) => {
    const target = users.get(to);
    if (target?.id) io.to(target.id).emit("typing", from);
  });

  // BUZZ
  socket.on("buzz", ({ to, from }) => {
    const target = users.get(to);
    if (target?.id) io.to(target.id).emit("buzz", from);
  });

  // WINK
  socket.on("wink", ({ to, emoji }) => {
    const target = users.get(to);
    if (target?.id) io.to(target.id).emit("wink", emoji);
  });

});

server.listen(process.env.PORT || 10000);