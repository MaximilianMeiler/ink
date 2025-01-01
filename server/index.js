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
    origin: "https://ink-seven.vercel.app"
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
let doubleConf = {}

io.on("connection", (socket) => {
  console.log("New user:", socket.id)

  socket.on("newDeck", (newRoom) => {
    rooms[newRoom.id].decks[newRoom.player0 === socket.id ? 0 : 1] = newRoom.decks[newRoom.player0 === socket.id ? 0 : 1];
    doubleConf[newRoom.id][newRoom.player0 === socket.id ? 0 : 1] = true;
    if (doubleConf[newRoom.id][0] && doubleConf[newRoom.id][1]) {
      doubleConf[newRoom.id] = [false, false];

      rooms[newRoom.id].gameState = "roundStart0";
      rooms[newRoom.id].round = min(rooms[newRoom.id].round+1, 4); //cap at 4 scribes / 8 drafts for now?
      io.to(newRoom.id).emit("serverUpdate", rooms[newRoom.id]);
    }
  })

  socket.on("clientUpdate", (newRoom) => {
    console.log("update on room", newRoom)

    if (newRoom.draft.phase === -1) { //start new draft
      newRoom.draft.phase++;
      newRoom.draft.options = getCardsForDraft(6)
    }
    if (newRoom.draft.phase % 3 === 2) { //restart draft
      newRoom.draft.phase++;
      newRoom.draft.options = getCardsForDraft(6);
    } 

    rooms[newRoom.id] = newRoom;
    io.to(newRoom.id).emit("serverUpdate", newRoom);
  })


  socket.on("clientRoomJoin", (room) => {
    console.log(socket.id, "attempts to join room", room)
    if (!rooms[room]) { //first player joins room (room created)
      doubleConf[room] = [false, false]
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
              card: "stoat",
              costType:"blood",
              cost: 1,
              sigils: [],
              defaultSigils: 0,
              damage: 1,
              health: 2,
              tribe: "none",
              rare: false
            },
            {
              card: "bullfrog",
              costType:"blood",
              cost: 1,
              sigils: ["reach"],
              defaultSigils: 1,
              damage: 1,
              health: 2,
              tribe: "reptile",
              rare: false
            },
            {
              card: "wolf",
              costType:"blood",
              cost: 2,
              sigils: [],
              defaultSigils: 0,
              damage: 3,
              health: 2,
              tribe: "canine",
              rare: false
            }
          ],
          [
            {
              card: "stoat",
              costType:"blood",
              cost: 1,
              sigils: [],
              defaultSigils: 0,
              damage: 1,
              health: 2,
              tribe: "none",
              rare: false
            },
            {
              card: "bullfrog",
              costType:"blood",
              cost: 1,
              sigils: ["reach"],
              defaultSigils: 1,
              damage: 1,
              health: 2,
              tribe: "reptile",
              rare: false
            },
            {
              card: "wolf",
              costType:"blood",
              cost: 2,
              sigils: [],
              defaultSigils: 0,
              damage: 3,
              health: 2,
              tribe: "canine",
              rare: false
            }
          ]
        ],
        bones: [0, 0],
        sacrifices: [],
        draft: {
          phase: 0,
          options: []
        },
        round: 1,
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

  //FIXME - activity log should reflect all things that require an animation. move simulation logic here from frontend
  socket.on("bellRung", (room) => { //generate activity log once bell is rung?
    let offset = rooms[room].gameState == "play1" ? 0 : 4;
    rooms[room].activityLog = [];

    //attacks
    [...Array(4)].forEach((val, index) => {
      if (rooms[room].board[index + offset] /*&& rooms[room].board[index + offset].damage > 0*/) { //second clause was originally commented out? 
                                                                                                   //this was for alpha you silly billy
        let sigils = rooms[room].board[index + offset].sigils;
  
        if (sigils.indexOf("splitstrike") < 0 && sigils.indexOf("tristrike") < 0) {
          rooms[room].activityLog.push({
            index: index + offset,
            action: "attack",
            aim: 0
          })  
        }

        if (sigils.indexOf("splitstrike") > -1) { //SIGILS - splitstrike
          rooms[room].activityLog.push({
            index: index + offset,
            action: "attack",
            aim: -1 
          })  
          rooms[room].activityLog.push({
            index: index + offset,
            action: "attack",
            aim: 1
          })  
        }
        //must be done twice for them to stack
        if (sigils.indexOf("tristrike") > -1) { //SIGILS - tristrike
          rooms[room].activityLog.push({
            index: index + offset,
            action: "attack",
            aim: -1 
          })  
          rooms[room].activityLog.push({ //this is isolated to avoid bugs when stacked with splitstrike
            index: index + offset,
            action: "attack",
            aim: 0
          })  
          rooms[room].activityLog.push({
            index: index + offset,
            action: "attack",
            aim: 1
          })  
        }

        if (sigils.indexOf("doublestrike") >= 0) { //SIGILS - doublestrike
          rooms[room].activityLog.push({
            index: index + offset,
            action: "attack",
            aim: 0
          })  
        }
      }
    });

    //fixme - new cards such as tails never take a move action
    [...Array(4)].forEach((val, index) => {
      if (rooms[room].board[index + offset]) {
        let sigils = rooms[room].board[index + offset].sigils;

        //this really needs to just be consolidated into one "move" action later
        if (sigils.indexOf("strafeswap") > -1 || sigils.indexOf("strafeswapleft") > -1) { //SIGILS - strafeswap
          rooms[room].activityLog.push({
            index: index + offset,
            action: "strafeswap",
            swapped: false
          })
        }
        if (sigils.indexOf("strafepush") > -1 || sigils.indexOf("strafepushleft") > -1) { //SIGILS - strafepush
          rooms[room].activityLog.push({
            index: index + offset,
            action: "strafepush",
            swapped: false
          })
        }
        if (sigils.indexOf("strafe") > -1 || sigils.indexOf("strafeleft") > -1) { //SIGILS - strafeswap
          rooms[room].activityLog.push({
            index: index + offset,
            action: "strafe",
            swapped: false
          })
        }
      }
    });

    [...Array(4)].forEach((val, index) => {
      if (rooms[room].board[index + offset]) {
        let sigils = rooms[room].board[index + offset].sigils;
  
        if (sigils.indexOf("bonedigger") >= 0) { //SIGILS - bonedigger
          rooms[room].bones[index < 4 ? 1 : 0]++;
        }
      }
    });

    [...Array(4)].forEach((val, index) => {
      if (rooms[room].board[(index + offset + 4) % 8] && rooms[room].board[(index + offset + 4) % 8].sigils.indexOf("submergesquid") > -1) {
        rooms[room].activityLog.push({
          index: (index + offset + 4) % 8,
          action: "transform",
          rand: Math.random()
        })  
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
    });

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