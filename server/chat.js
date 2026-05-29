function key(a, b) {
  return [a, b].sort().join("-");
}

function sendMessage(db, msg) {
  const k = key(msg.from, msg.to);

  if (!db.messages[k]) db.messages[k] = [];

  const full = {
    ...msg,
    time: Date.now(),
    status: "sent"
  };

  db.messages[k].push(full);

  return full;
}

function history(db, a, b) {
  const k = key(a, b);
  return db.messages[k] || [];
}

module.exports = { sendMessage, history };