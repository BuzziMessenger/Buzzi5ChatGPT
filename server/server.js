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
    origin: "*",
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json());
app.use(express.static("public"));

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/public/index.html");
});

// MongoDB
mongoose.connect(process.env.MONGO_URL)
  .then(() => console.log("MongoDB verbonden"))
  .catch(err => console.log("Mongo error:", err));

// Schema
const MessageSchema = new mongoose.Schema({
  from: String,
  to: String,
  text: String,
  time: Number
});

const Message = mongoose.model("Message", MessageSchema);

// Socket
io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("send_message", async (data) => {
    const message = new Message({
      from: data.from,
      to: data.to,
      text: data.text,
      time: Date.now()
    });

    await message.save();
    io.emit("receive_message", message);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected");
  });
});

// PORT (BELANGRIJK VOOR RENDER)
const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log("Server draait op port", PORT);
});