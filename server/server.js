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

// USERS STATE
const users = new Map(); // username -> {id, status}

io.on("connection", (socket) => {

  // AUTH / JOIN
  socket.on("auth", ({ user }) => {

    socket.user = user;
    users.set(user, { id: socket.id, status: "online" });

    io.emit("users", Array.from(users.entries()).map(([name, data]) => ({
      username: name,
      status: data.status
    })));
  });

  // DISCONNECT → OFFLINE
  socket.on("disconnect", () => {

    if (socket.user) {
      users.set(socket.user, { id: null, status: "offline" });
    }

    io.emit("users", Array.from(users.entries()).map(([name, data]) => ({
      username: name,
      status: data.status
    })));
  });

  // MESSAGE
  socket.on("msg", (data) => {
    io.to(users.get(data.to)?.id).emit("msg", data);
    io.to(socket.id).emit("msg", data);
  });

  // TYPING
  socket.on("typing", ({ to, from }) => {
    io.to(users.get(to)?.id).emit("typing", from);
  });

  // BUZZ
  socket.on("buzz", ({ to, from }) => {
    io.to(users.get(to)?.id).emit("buzz", from);
  });

  // WINK
  socket.on("wink", ({ to, emoji }) => {
    io.to(users.get(to)?.id).emit("wink", emoji);
  });

});
server.listen(process.env.PORT || 10000);