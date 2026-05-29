const fs = require("fs");

const FILE = "./store.json";

function load() {
  if (!fs.existsSync(FILE)) {
    return {
      users: {},
      messages: {},
      friends: {},
      requests: {}
    };
  }
  return JSON.parse(fs.readFileSync(FILE));
}

function save(db) {
  fs.writeFileSync(FILE, JSON.stringify(db, null, 2));
}

module.exports = { load, save };