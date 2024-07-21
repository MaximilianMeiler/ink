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
        playerA: socket.id,
        handA: [
          {
            card: "beehive",
            costType: "blood",
            cost: 1,
            sigils: ["beesonhit"],
            damage: 0,
            health: 2
          },
          {
            card: "beehive",
            costType: "blood",
            cost: 1,
            sigils: ["beesonhit"],
            damage: 0,
            health: 2
          },
          {
            card: "beehive",
            costType: "blood",
            cost: 1,
            sigils: ["beesonhit"],
            damage: 0,
            health: 2
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
      }
      socket.join(room);
      io.to(room).emit("serverUpdate", rooms[room]);
    } else if (rooms[room].playerA == socket.id || rooms[room].playerB == socket.id) { 
      //player already in room
    } else if (rooms[room].playerA && !rooms[room].playerB) { //player joins pre-existing room
      rooms[room].playerB = socket.id;
      rooms[room].handB = [
        {
          card: "beehive",
          costType: "blood",
          cost: 1,
          sigils: ["beesonhit"],
          damage: 0,
          health: 2
        },
        {
          card: "beehive",
          costType: "blood",
          cost: 1,
          sigils: ["beesonhit"],
          damage: 0,
          health: 2
        }
      ];
      socket.join(room);
      io.to(room).emit("serverUpdate", rooms[room]);
    } else if (rooms[room].playerB && !rooms[room].playerA) {
      rooms[room].playerA = socket.id;
      rooms[room].handA = [
        {
          card: "beehive",
          costType: "blood",
          cost: 1,
          sigils: ["beesonhit"],
          damage: 0,
          health: 2
        },
        {
          card: "beehive",
          costType: "blood",
          cost: 1,
          sigils: ["beesonhit"],
          damage: 0,
          health: 2
        }
      ];
      socket.join(room);
      io.to(room).emit("serverUpdate", rooms[room]);
    } else {
      //room is full
    }
  })

  socket.on("clientRoomLeave", (id) => {
    console.log(socket.id, "attempts to leave room", id)
    console.log(rooms[id]);
    if (!rooms[id].playerA || !rooms[id].playerB) { //last person leaves room
      delete rooms[id];
    } else {
      if (rooms[id].playerA == socket.id) {
        delete rooms[id].playerA;
        // delete rooms[id].handA;
      } else if (rooms[id].playerB == socket.id){
        delete rooms[id].playerB;
        console.log(rooms[id]);
      }
    }
    socket.leave(id);
  })

  socket.on("disconnect", () => {
    //remove player from everywhere (same thing as clientRoomLeave but dumber)
    Object.keys(rooms).forEach((room) => {
      rooms[room].playerA == socket.id ? delete rooms[room].playerA : delete rooms[room].playerB;
      if (!rooms[room].playerA && !rooms[room].playerB) {
        delete rooms[room];
      }
    })
  })
})


server.listen(4000, () => {
  console.log("Server started!")
})