const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

// CHAT ENDPOINT (DIT IS JE CODE)
app.post("/chat", (req, res) => {
  res.json({ reply: "Echo: " + req.body.message });
});

// test route (optioneel)
app.get("/", (req, res) => {
  res.send("Buzzi server werkt");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});