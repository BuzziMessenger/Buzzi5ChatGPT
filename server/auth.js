const bcrypt = require("bcrypt");

async function register(db, user, pass) {
  if (!db.users[user]) {
    const hash = await bcrypt.hash(pass, 10);

    db.users[user] = {
      name: user,
      pass: hash,
      status: "online",
      avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${user}`
    };
  }

  const ok = await bcrypt.compare(pass, db.users[user].pass);
  return ok;
}

module.exports = { register };