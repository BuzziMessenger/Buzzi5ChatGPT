io.on("connection", (socket) => {

  socket.on("login_success", (u) => {
    socket.username = u.username;
    socket.join(u.username); // 🔥 BELANGRIJK (fixes everything)
  });

  socket.on("typing", ({ from, to }) => {
    io.to(to).emit("typing", { from });
  });

  socket.on("stop_typing", ({ from, to }) => {
    io.to(to).emit("stop_typing", { from });
  });

  socket.on("message_seen", ({ from, to }) => {
    io.to(to).emit("message_seen", { from, to });
  });

});