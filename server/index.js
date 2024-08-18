const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors')

const {allCards} = require('./cardList');

const app = express();
app.use(cors())

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000"
  }
})

/*
  awaitingPlayers
  drafting

  draw0
  draw1
  play0
  play1
  
  roundStart0
  roundStart1

  simulating0
  simulating1
*/

let rooms = {};

io.on("connection", (socket) => {
  console.log("New user:", socket.id)

  socket.on("clientUpdate", (newRoom) => {
    console.log("update on room", newRoom)

    if (newRoom.draft.phase === -1) { //start new draft
      newRoom.draft.phase = 0;
      newRoom.draft.options = getCardsForDraft(6)
    }
    if (newRoom.draft.phase === 2) { //restart draft
      newRoom.draft.phase = 3;
      newRoom.draft.options = getCardsForDraft(6);
    }

    rooms[newRoom.id] = newRoom;
    io.to(newRoom.id).emit("serverUpdate", newRoom);
  })


  socket.on("clientRoomJoin", (room) => {
    console.log(socket.id, "attempts to join room", room)
    if (!rooms[room]) { //first player joins room (room created)
      rooms[room] = {
        id: room,
        gameState: "awaitingPlayers",
        board: [null, null, null, null, null, null, null, null], //0-3 - 1's cards, 4-7 - 0's cards
        scale: 0,
        lit0: true,
        lit1: true,
        activityLog: [],
        player0: socket.id,
        player1: null,
        hands: [[],[]],
        decks: [
          [
            {
              card: "warren",
              costType:"blood",
              cost: 1,
              sigils: ["drawrabbits", "drawcopyondeath"],
              defaultSigils: 1,
              damage: 0,
              health: 2,
              tribe: "none",
              rare: false,
              index: 0
            }
          ],
          [
            {
              card: "opossum",
              costType: "bone",
              cost: 0,
              sigils: [],
              defaultSigils: 0,
              damage: 1,
              health: 1,
              index: 0,
            },
            {
              card: "bullfrog",
              costType: "blood",
              cost: 2,
              sigils: ["reach", "beesonhit"],
              defaultSigils: 1,
              damage: 1,
              health: 2,
              index: 1,
            },
            {
              card: "stoat",
              costType: "blood",
              cost: 0,
              sigils: ["sacrificial"],
              defaultSigils: 0,
              damage: 1,
              health: 2,
              index: 2,
            }
          ]
        ],
        bones: [0, 0],
        sacrifices: [],
        draft: {
          phase: 0,
          options: []
        }
      }
      socket.join(room);
      io.to(room).emit("serverUpdate", rooms[room]);
    } else if (rooms[room].player0 == socket.id || rooms[room].player1 == socket.id) { 
      //player already in room
    } else if (rooms[room].player0 && !rooms[room].player1) { //player joins pre-existing room
      rooms[room].player1 = socket.id;
      socket.join(room);
      rooms[room].gameState = "drafting";
      rooms[room].draft.phase = 0;
      rooms[room].draft.options = getCardsForDraft(6)
      io.to(room).emit("serverUpdate", rooms[room]);
    } else if (rooms[room].player1 && !rooms[room].player0) {
      rooms[room].player0 = socket.id;
      socket.join(room);
      rooms[room].gameState = "drafting";
      rooms[room].draft.phase = 0;
      rooms[room].draft.options = getCardsForDraft(6)
      io.to(room).emit("serverUpdate", rooms[room]);
    } else {
      //room is full
    }
  })

  socket.on("clientRoomLeave", (id) => {
    console.log(socket.id, "attempts to leave room", id)
    if (!rooms[id].player0 || !rooms[id].player1) { //last person leaves room
      delete rooms[id];
    } else {
      if (rooms[id].player0 == socket.id) {
        delete rooms[id].player0;
      } else if (rooms[id].player1 == socket.id){
        delete rooms[id].player1;
      }
    }
    socket.leave(id);
    io.to(id).emit("serverUpdate", {...rooms[id], gameState:"awaitingPlayers"});
  })

  socket.on("disconnect", () => {
    //remove player from everywhere (same thing as clientRoomLeave but dumber)
    Object.keys(rooms).forEach((room) => {
      if (rooms[room].player0 == socket.id) {
        delete rooms[room].player0;
        io.to(room).emit("serverUpdate", {...rooms[room], gameState:"awaitingPlayers"});
      } else if (rooms[room].player1 == socket.id) {
        delete rooms[room].player1;
        io.to(room).emit("serverUpdate", {...rooms[room], gameState:"awaitingPlayers"});
      }
      if (!rooms[room].player0 && !rooms[room].player1) {
        delete rooms[room];
      }
    })
  })

  socket.on("bellRung", (room) => { //generate activity log once bell is rung?
    let offset = rooms[room].gameState == "play1" ? 0 : 4;
    rooms[room].activityLog = [];

    //attacks
    [...Array(4)].forEach((val, index) => {
      if (rooms[room].board[index + offset] /*&& rooms[room].board[index + offset].damage > 0*/) {
        let sigils = rooms[room].board[index + offset].sigils;
  
        rooms[room].activityLog.push({
          index: index + offset,
          action: "attack"
        })  
        if (sigils.indexOf("doublestrike") >= 0) { //SIGILS - doublestrike
          rooms[room].activityLog.push({
            index: index + offset,
            action: "attack"
          })  
        }
        if (sigils.indexOf("bonedigger") >= 0) { //SIGILS - bonedigger
          rooms[room].bones[index < 4 ? 1 : 0]++;
        }
      }
    });

    //evolutions
    [...Array(4)].forEach((val, index) => {
      if (rooms[room].board[(index + offset + 4) % 8] && rooms[room].board[(index + offset + 4) % 8].sigils.indexOf("evolve") > -1) {
        rooms[room].activityLog.push({
          index: (index + offset + 4) % 8,
          action: "evolve"
        })  
      }
    })

    rooms[room].gameState = rooms[room].gameState == "play1" ? "simulating1" : "simulating0";
    console.log("bell rung for room", room);
    io.to(room).emit("serverUpdate", rooms[room]);
  })
})

function getCardsForDraft(n) {
  let cards = [];
  for (let x = 0; x < n; x++) {
    cards.push(Object.values(allCards)[Math.floor(Math.random() * Object.values(allCards).length)])
  }
  return cards;
}

server.listen(4000, () => {
  console.log("Server started!")
})