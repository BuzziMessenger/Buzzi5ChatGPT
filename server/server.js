const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");
const mongoose = require("mongoose");
require("dotenv").config();

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*"
  }
});

app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGO_URL)
  .then(() => console.log("MongoDB verbonden"))
  .catch(err => console.log("Mongo error:", err));

const MessageSchema = new mongoose.Schema({
  from: String,
  text: String,
  time: Number
});

const Message = mongoose.model("Message", MessageSchema);

let onlineUsers = {};

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("add_user", (username) => {
    onlineUsers[socket.id] = username;

    io.emit("update_users", Object.values(onlineUsers));
    io.emit("user_joined", username);
  });

  socket.on("send_message", async (data) => {
    const message = new Message({
      from: data.from,
      text: data.text,
      time: Date.now()
    });

    await message.save();

    io.emit("receive_message", message);
  });

  socket.on("nudge", (from) => {
    io.emit("nudge", from);
  });

  socket.on("disconnect", () => {
    const username = onlineUsers[socket.id];

    if (username) {
      io.emit("user_left", username);
    }

    delete onlineUsers[socket.id];

    io.emit("update_users", Object.values(onlineUsers));
  });
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log("Server draait op port", PORT);
});