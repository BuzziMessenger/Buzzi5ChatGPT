const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");

const app = express();

app.use(cors());

app.get("/", (req, res) => {
  res.send("Buzzi Messenger Server Online");
});

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const users = {};

io.on("connection", (socket) => {

  console.log("Connected:", socket.id);

  socket.on("login", (username) => {

    users[socket.id] = {
      id: socket.id,
      username: username,
      status: "Online"
    };

    io.emit("users", Object.values(users));

    socket.emit("login_ok", {
      username: username
    });

  });

  socket.on("msg", (message) => {
    io.emit("msg", message);
  });

  socket.on("buzz", (data) => {
    io.emit("buzz", data);
  });

  socket.on("wink", (data) => {
    io.emit("wink", data);
  });

  socket.on("disconnect", () => {

    delete users[socket.id];

    io.emit("users", Object.values(users));

  });

});

const PORT = process.env.PORT || 10000;

server.listen(PORT, () => {
  console.log("Server gestart op poort", PORT);
});