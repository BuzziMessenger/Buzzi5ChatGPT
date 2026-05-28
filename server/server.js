const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

app.post("/chat", (req, res) => {
  const msg = req.body.message;

  // simpele reply (later kun je AI toevoegen)
  res.json({
    reply: "Ontvangen: " + msg
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});