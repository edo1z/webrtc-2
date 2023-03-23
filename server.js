const WebSocket = require("ws");
const server = new WebSocket.Server({ port: 3001 });

server.on("connection", (socket) => {
  console.log("Client connected");
  socket.on("message", (message) => {
    server.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  });
  socket.on("close", () => {
    console.log("Client disconnected");
  });
});

console.log("WebSocket server is running on ws://localhost:3001");
