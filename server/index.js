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
  console.log("New user:", socket.id)

  socket.on("clientUpdate", (newRoom) => {
    rooms[newRoom.id] = newRoom;
    io.to(newRoom.id).emit("serverUpdate", newRoom);
  })

  socket.on("clientRoomJoin", (room) => {
    console.log(socket.id, "attempts to join room", room)
    if (!rooms[room]) { //first player joins room (room created)
      rooms[room] = {
        id: room,
        board: [null, null, null, null, null, null, null, null],
        player0: socket.id,
        player1: null,
        hands: [
          [
            {
              card: "squirrel",
              costType: "blood",
              cost: 0,
              sigils: [],
              damage: 0,
              health: 0
            },
            {
              card: "beehive",
              costType: "blood",
              cost: 1,
              sigils: ["beesonhit"],
              damage: 0,
              health: 2
            }
          ],
          [
            {
              card: "squirrel",
              costType: "blood",
              cost: 0,
              sigils: [],
              damage: 0,
              health: 0
            },
            {
              card: "beehive",
              costType: "blood",
              cost: 1,
              sigils: ["beesonhit"],
              damage: 0,
              health: 2
            }
          ]
        ],
        bones: [0, 0],
        sacrifices: []
      }
      socket.join(room);
      io.to(room).emit("serverUpdate", rooms[room]);
    } else if (rooms[room].player0 == socket.id || rooms[room].player1 == socket.id) { 
      //player already in room
    } else if (rooms[room].player0 && !rooms[room].player1) { //player joins pre-existing room
      rooms[room].player1 = socket.id;
      socket.join(room);
      io.to(room).emit("serverUpdate", rooms[room]);
    } else if (rooms[room].player1 && !rooms[room].player0) {
      rooms[room].player0 = socket.id;
      socket.join(room);
      io.to(room).emit("serverUpdate", rooms[room]);
    } else {
      //room is full
    }
  })

  socket.on("clientRoomLeave", (id) => {
    console.log(socket.id, "attempts to leave room", id)
    console.log(rooms[id]);
    if (!rooms[id].player0 || !rooms[id].player1) { //last person leaves room
      delete rooms[id];
    } else {
      if (rooms[id].player0 == socket.id) {
        delete rooms[id].player0;
      } else if (rooms[id].player1 == socket.id){
        delete rooms[id].player1;
        console.log(rooms[id]);
      }
    }
    socket.leave(id);
  })

  socket.on("disconnect", () => {
    //remove player from everywhere (same thing as clientRoomLeave but dumber)
    Object.keys(rooms).forEach((room) => {
      rooms[room].player0 == socket.id ? delete rooms[room].player0 : delete rooms[room].player1;
      if (!rooms[room].player0 && !rooms[room].player1) {
        delete rooms[room];
      }
    })
  })
})


server.listen(4000, () => {
  console.log("Server started!")
})