const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors')

const app = express();
app.use(cors())

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000"
  }
})

let serverBoard = [-1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1]

io.on("connection", (socket) => {
  console.log("New user: ", socket.id)

  socket.emit("newServerBoard", serverBoard);
  socket.on("newClientBoard", (newBoard) => {
    serverBoard = newBoard;
    socket.broadcast.emit("newServerBoard", newBoard);
  })
})


server.listen(4000, () => {
  console.log("Server started!")
})