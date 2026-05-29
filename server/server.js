const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");

const { load, save } = require("./db");
const { register } = require("./auth");
const { sendMessage, history } = require("./chat");

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

let db = load();

function sync() {
  save(db);
  io.emit("users", db.users);
}

io.on("connection", (socket) => {

  socket.on("register", async ({ user, pass }) => {
    const ok = await register(db, user, pass);

    if (!ok) return socket.emit("login_fail");

    socket.name = user;

    db.users[user].status = "online";
    sync();

    socket.emit("login_success", db.users[user]);
  });

  socket.on("chat_message", (msg) => {
    const full = sendMessage(db, msg);

    sync();
    io.emit("chat_message", full);
  });

  socket.on("get_history", ({ userA, userB }) => {
    socket.emit("history", history(db, userA, userB));
  });

  socket.on("disconnect", () => {
    if (!socket.name) return;

    if (db.users[socket.name]) {
      db.users[socket.name].status = "offline";
    }

    sync();
  });

});

server.listen(3000, () => {
  console.log("BUZZI GOD MODE V8 RUNNING");
});