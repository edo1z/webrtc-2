const express = require("express");
const app = express();
const http = require("http").Server(app);
const path = require("path");

const messages_for_offer = [];
const messages_for_answer = [];

app.use(express.static(path.join(__dirname)));

app.get("/offer", (req, res) => {
  res.sendFile(path.join(__dirname, "index_offer.html"));
});

app.get("/answer", (req, res) => {
  res.sendFile(path.join(__dirname, "index_answer.html"));
});

app.get("/message/offer", (req, res) => {
  if (messages_for_offer.length > 0) {
    res.send(JSON.stringify(messages_for_offer.shift()));
  } else {
    res.send("");
  }
});

app.get("/message/answer", (req, res) => {
  if (messages_for_answer.length > 0) {
    res.send(JSON.stringify(messages_for_answer.shift()));
  } else {
    res.send("");
  }
});

app.post("/message/offer", express.json(), (req, res) => {
  messages_for_offer.push(req.body);
  res.send("OK");
});

app.post("/message/answer", express.json(), (req, res) => {
  messages_for_answer.push(req.body);
  res.send("OK");
});

http.listen(3001, () => {
  console.log("Server is running on http://localhost:3001");
});
