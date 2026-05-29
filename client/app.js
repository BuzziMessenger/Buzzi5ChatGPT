const socket = io("https://buzzimessenger.onrender.com/");

let me;
let active;

socket.emit("auth", {
  user: prompt("user"),
  pass: prompt("pass")
});

socket.on("login_ok", u => me = u.username);

socket.on("users", users => {

  sidebar.innerHTML = "";

  users.forEach(u => {

    if(u.username === me) return;

    const d = document.createElement("div");
    d.className = "user";
    d.innerText = u.username;

    d.onclick = () => openChat(u.username);

    sidebar.appendChild(d);
  });

});

function openChat(u){
  active = u;
  messages.innerHTML = "";
}

function send(){
  socket.emit("msg", {
    from: me,
    to: active,
    text: msg.value,
    time: Date.now()
  });

  msg.value = "";
}

socket.on("msg", m => {

  const d = document.createElement("div");
  d.className = "msg " + (m.from === me ? "me" : "other");
  d.innerText = m.text;

  messages.appendChild(d);
});

function buzz(){
  socket.emit("buzz", { from: me, to: active });
}

function wink(e){
  socket.emit("wink", { to: active, emoji:e });
}