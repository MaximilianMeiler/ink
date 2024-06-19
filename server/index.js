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

let rooms = {};

io.on("connection", (socket) => {
  console.log("New user: ", socket.id)

  socket.on("newClientBoard", (newBoard, room) => {
    rooms[room].board = newBoard;
    socket.to(room).emit("newServerBoard", newBoard);
    console.log(rooms)
  })

  socket.on("clientRoomJoin", (room) => {
    socket.join(room);
    if (!rooms[room]) { //first player joins room (room created)
      rooms[room] = {
        board: [-1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
        players: [socket.id]
      }
    } else { //player joins pre-existing room
      rooms[room].players = [...rooms[room].players, socket.id];
    }
    socket.emit("newServerBoard", rooms[room].board);
  })

  socket.on("clientRoomLeave", (room) => {
    console.log(room)
    if (rooms[room].players.length <= 1) { //last person leaves room
      delete rooms[room];
    } else {
      rooms[room].players = rooms[room].players.filter((p) => p != socket.id);
    }
  })

  socket.on("disconnect", () => {
    //remove player from everywhere (same thing as clientRoomLeave but dumber)
    Object.keys(rooms).forEach((room) => {
      rooms[room].players = rooms[room].players.filter((p) => p != socket.id);
      if (rooms[room].players.length < 1) {
        delete rooms[room];
      }
    })
  })
})


server.listen(4000, () => {
  console.log("Server started!")
})