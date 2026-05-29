io.on("connection", (socket) => {

  console.log("user connected");

  socket.on("login_success", (u) => {
    socket.username = u.username;
    socket.join(u.username);
  });

  // USERS UPDATE (optioneel bestaande logica laten)
  socket.on("get_users", async () => {
    // jouw bestaande DB users emit hier
  });

  // CHAT MESSAGE ROUTING
  socket.on("chat_message", (data) => {
    io.to(data.to).emit("chat_message", data);
    io.to(data.from).emit("chat_message", data);
  });

  // TYPING
  socket.on("typing", ({ from, to }) => {
    io.to(to).emit("typing", { from });
  });

  socket.on("stop_typing", ({ from, to }) => {
    io.to(to).emit("stop_typing", { from });
  });

  // SEEN
  socket.on("message_seen", ({ from, to }) => {
    io.to(to).emit("message_seen", { from, to });
  });

});