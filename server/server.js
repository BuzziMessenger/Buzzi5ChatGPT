import express from "express";
import http from "http";
import cors from "cors";
import { Server } from "socket.io";

const app = express();
app.use(cors());
app.use(express.static("public"));

const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: "*" }
});

const users = new Map();   // username -> {id, status}
const messages = [];       // simple memory

function emitUsers(){
  io.emit("users", Array.from(users.entries()).map(([name,u])=>({
    username:name,
    status:u.status
  })));
}

io.on("connection", (socket) => {

  socket.on("login", (username) => {
    socket.username = username;

    users.set(username, {
      id: socket.id,
      status: "online"
    });

    emitUsers();

    socket.emit("history", messages);
  });

  socket.on("disconnect", () => {
    if (!socket.username) return;

    const u = users.get(socket.username);
    if (u) u.status = "offline";

    emitUsers();
  });

  // CHAT
  socket.on("msg", ({from,to,text}) => {
    const msg = {from,to,text,time:Date.now()};
    messages.push(msg);

    const target = users.get(to);

    if (target?.id) io.to(target.id).emit("msg", msg);
    io.to(socket.id).emit("msg", msg);
  });

  // BUZZ (MSN NUDGE)
  socket.on("buzz", ({to}) => {
    const t = users.get(to);
    if (t?.id) io.to(t.id).emit("buzz");
  });

  // WINK
  socket.on("wink", ({to,emoji}) => {
    const t = users.get(to);
    if (t?.id) io.to(t.id).emit("wink", emoji);
  });

});

server.listen(10000, () => console.log("MSN clone running"));