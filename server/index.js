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

function shuffleArray(input) {
  let array = input.slice(0);
  for (var i = array.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var temp = array[i];
      array[i] = array[j];
      array[j] = temp;
  }
  return array;
}

const calcTrueDamage = (board, index, bones, hands, recur = false) => {
  return Math.max(board[index].damage, //SIGILS - antdamage, belldamage, carddamage, mirrordamage, bonedamage
    board[index].sigils.indexOf("antdamage") > -1 ? [...Array(4)].reduce((acc, v, i) => acc + (board[i+(Math.floor(index / 4) * 4)] && board[i+(Math.floor(index / 4) * 4)].sigils.indexOf("antdamage") > -1 ? 1 : 0), 0) : 0, 
    board[index].sigils.indexOf("belldamage") > -1 ? 4 - index % 4 + (Math.floor(index/4) === Math.floor((index-1)/4) && board[index-1] && board[index-1].sigils.indexOf("loud") > -1 ? 1 : 0) + (Math.floor(index/4) === Math.floor((index+1)/4) && board[index+1] && board[index+1].sigils.indexOf("loud") > -1 ? 1 : 0) : 0, 
    board[index].sigils.indexOf("carddamage") > -1 ? hands[index < 4 ? 1 : 0].length : 0, 
    board[index].sigils.indexOf("mirrordamage") > -1 && board[(index + 4) % 8] && !recur ? calcTrueDamage(board, (index + 4) % 8, bones, true) : 0, 
    board[index].sigils.indexOf("bonedamage") > -1 ? Math.floor(bones[index < 4 ? 1 : 0] / 2) : 0 
  )
  //SIGILS - buffneighbours, debuffenemy
  + (index % 4 !== 0 && board[index-1] && board[index-1].sigils.indexOf("buffneighbours") >= 0 ? 1 : 0)
  + (index % 4 !== 3 && board[index+1] && board[index+1].sigils.indexOf("buffneighbours") >= 0 ? 1 : 0)
  + (board[(index + 4) % 8] && board[(index + 4) % 8].sigils.indexOf("debuffenemy") > -1 ? -1 : 0)
  + (board[index].sigils.indexOf("sacdamage") > -1 ? board[index].sacBonus : 0)
}


const placeSelectedCard = (index, placedCard = null, newRoom = null) => {

  //try not to use this, but it's here in case
  if (index < 0 || index > 7) {return;}

  let newHands = newRoom.hands;
  let newBones = newRoom.bones;
  let newBoard = newRoom.board;
  
  let damageBonus = 0;
  let healthBonus = 0;
  let offset = newRoom.player0 === socket.id ? 0 : 4;

  newBoard[index] = {
                      ...placedCard, 
                      damage: placedCard.damage + damageBonus,
                      health: placedCard.health + healthBonus
                    }; //place selected card

  let guarding = -1; //SIGILS - guardog
  for (let i = 0; i < 4; i++) {
    if (newRoom.board[i + offset] && newRoom.board[i + offset].sigils.indexOf("guarddog") > -1 && guarding < 0) {
      guarding = i + offset;
    }
  }
  if (!newBoard[(index + 4) % 8] && guarding > -1) { //rush over guarding cards to opposing spot
    newBoard[(index + 4) % 8] = newBoard[guarding];
    newBoard[guarding] = null;
  }
  if (placedCard.sigils.indexOf("drawrabbits") > -1) { //SIGILS - drawrabbits
    let newSigils = Array.from(placedCard.sigils);
    newSigils.splice(newSigils.indexOf("drawrabbits"), 1);
    newHands[newRoom.player0 === socket.id ? 0 : 1].push({
      card: "rabbit",
      name: "Rabbit",
      costType:"bone",
      cost: 0,
      sigils: newSigils,
      defaultSigils: 0,
      damage: 0,
      health: 1,
      tribe: "none",
      rare: false,
      clone: {
        card: "rabbit",
        name: "Rabbit",
        costType:"bone",
        cost: 0,
        sigils: newSigils,
        defaultSigils: 0,
        damage: 0,
        health: 1,
        tribe: "none",
        rare: false,
      }
    })
  }
  if (placedCard.sigils.indexOf("drawant") > -1) { //SIGILS - drawant
    let newSigils = Array.from(placedCard.sigils);
    newSigils.splice(newSigils.indexOf("drawant"), 1);
    if (newSigils.indexOf("antdamage") > 0) {newSigils.splice(0, 0, "antdamage")};
    newHands[newRoom.player0 === socket.id ? 0 : 1].push({
      card: "ant",
      name: "Worker Ant",
      costType:"blood",
      cost: 1,
      sigils: newSigils,
      defaultSigils: 1,
      damage: 0,
      health: 2,
      tribe: "insect",
      rare: false,
      clone: {
        card: "ant",
        name: "Worker Ant",
        costType:"blood",
        cost: 1,
        sigils: newSigils,
        defaultSigils: 0,
        damage: 0,
        health: 2,
        tribe: "insect",
        rare: false,
      }
    })
  }
  if (placedCard.sigils.indexOf("drawcopy") > -1) {//SIGILS - drawcopy
    let newSigils = Array.from(placedCard.sigils);
    newSigils.splice(newSigils.indexOf("drawcopy"), 1);
    newHands[newRoom.player0 === socket.id ? 0 : 1].push({
      ...placedCard.clone, 
      clone: {...placedCard.clone, sigils: newSigils},
      sigils: newSigils
    })
  }

  //chimes get the "loud" sigil, which they can pass on to derived cards
  if (placedCard.sigils.indexOf("createbells") > -1) { //SIGILS - createbells
    let newSigils = Array.from(placedCard.sigils);
    newSigils.splice(newSigils.indexOf("createbells"), 1);
    newSigils.splice(0, 0, "loud");
    let chimeCard = {
      card: "dausbell",
      name: "Chime",
      costType:"bone",
      cost: 0,
      sigils: newSigils,
      defaultSigils: 1,
      damage: 0,
      health: 1,
      tribe: "none",
      rare: false,
      clone: {
        card: "dausbell",
        name: "Chime",
        costType:"bone",
        cost: 0,
        sigils: newSigils,
        defaultSigils: 1,
        damage: 0,
        health: 1,
        tribe: "none",
        rare: false,
      }
    }
    if (Math.floor(index / 4) === Math.floor((index+1) / 4) && !newBoard[index+1]) {
      newRoom = placeSelectedCard(index+1, chimeCard, newRoom);
    }
    if (Math.floor(index / 4) === Math.floor((index-1) / 4) && !newBoard[index-1]) {
      newRoom = placeSelectedCard(index-1, chimeCard, newRoom);
    }
  }

  if (placedCard.sigils.indexOf("createdams") > -1) { //SIGILS - createdams
    let newSigils = Array.from(placedCard.sigils);
    newSigils.splice(newSigils.indexOf("createdams"), 1);
    let damCard = {
      card: "dam",
      name: "Dam",
      costType:"bone",
      cost: 0,
      sigils: newSigils,
      defaultSigils: 0,
      damage: 0,
      health: 2,
      tribe: "none",
      rare: false,
      clone: {
        card: "dam",
        name: "Dam",
        costType:"bone",
        cost: 0,
        sigils: newSigils,
        defaultSigils: 0,
        damage: 0,
        health: 2,
        tribe: "none",
        rare: false,
      }
    }
    if (Math.floor(index / 4) === Math.floor((index+1) / 4) && !newBoard[index+1]) {
      newRoom = placeSelectedCard(index+1, damCard, newRoom);
    }
    if (Math.floor(index / 4) === Math.floor((index-1) / 4) && !newBoard[index-1]) {
      newRoom = placeSelectedCard(index-1, damCard, newRoom);
    }
  }

  //SIGILS - sacdamage
  [...Array(4)].forEach((val, i) => {
    if (newBoard[i + 4-offset]) {
      if (!newBoard[i + 4-offset].sacBonus) {newBoard[i + 4-offset].sacBonus = 0}
      newBoard[i + 4-offset].sacBonus += newRoom.sacrifices.length
    }
  })

  return {...newRoom, sacrifices: [], bones: newBones, board: newBoard, hands: newHands}
}

function simulateActivityLog(roomIndex, activityLog) {
  let newRoom = rooms[roomIndex]
  let newBones = newRoom.bones;
  let newScale = newRoom.scale;
  let newBoard = newRoom.board;
  let newHands = newRoom.hands;
  let indexMapping = [0, 1, 2, 3, 4, 5, 6, 7];
  rooms[roomIndex].animationLog = []
  animationLog = [] //shake, *updateCard*, flip, shift, lunge, place, remove, updateScale

  for (let logIndex = 0; logIndex < activityLog.length; logIndex++) {
    let entry = activityLog[logIndex];
    let originalIndex = entry.index;
    if (!entry.target) { //sharp attack
      entry.index = indexMapping[entry.index] //adjust for card movements
    }
    if (!newBoard[entry.index] && !entry.target) { //no card left to act
      continue;
    }

    if (entry.action.substr(0,6) === "attack") { //covers "attack", "attacksharp", "attacksharplethal"
      let target;
      if (entry.target) {
        target = entry.target; //erm should this mapping be applied
      } else {
        target = (entry.index + 4) % 8 + entry.aim;
        if (Math.floor(target / 4) !== Math.floor(((entry.index + 4) % 8) / 4)) { //null atk if it goes off of board
          continue;
        }
      }
      let trueDamage = entry.action.length > 6 ? 1 : //sharp attack
      calcTrueDamage(newBoard, entry.index, newBones, newHands);

      if (trueDamage < 1) {
        //do nothing
      } else if (newBoard[target] && (entry.action.length > 6 || 
        ((newBoard[entry.index].sigils.indexOf("flying") < 0 || newBoard[target].sigils.indexOf("reach") > -1) &&
         (newBoard[target].sigils.indexOf("submerge") < 0 && newBoard[target].sigils.indexOf("submergesquid") < 0))))
      { //SIGILS - flying, reach, submerge

        let shieldIndex = newBoard[target].sigils.indexOf("deathshield"); //SIGILS - deathshield
        if (entry.action === "attack") {
          animationLog.push({action: "lunge", index: entry.index, aim: entry.aim})
        } else {
          animationLog.push({action: "shake",  index: target})
        }

        if (shieldIndex > -1) {
          if (shieldIndex < newBoard[target].defaultSigils) {
            newBoard[target].defaultSigils--;
          }
          newBoard[target].sigils.splice(shieldIndex, 1);
          animationLog.push({action: "updateCard", index: target, card: structuredClone(newBoard[target])})
        } else {
          if (newBoard[target].sigils.indexOf("tailonhit") > -1) { //SIGILS - tailonhit
            let newSigils = Array.from(newBoard[target].sigils);
            newSigils.splice(newSigils.indexOf("tailonhit"), 1);
            let tailCard = {
              card: newBoard[target].tribe === "insect" ? "insect_tail" : newBoard[target].tribe === "canine" ? "canine_tail" : newBoard[target].tribe === "avian" ? "bird_tail" : "skink_tail",
              name: newBoard[target].tribe === "insect" ? "Wriggling Leg" : newBoard[target].tribe === "canine" ? "Furry Tail" : newBoard[target].tribe === "avian" ? "Tail Feathers" : "Wriggling Tail",
              costType:"bone",
              cost: 0,
              sigils: newSigils,
              defaultSigils: 0,
              damage: 0,
              health: 2,
              tribe: newBoard[target].tribe,
              rare: false,
              clone: {
                card: newBoard[target].tribe === "insect" ? "insect_tail" : newBoard[target].tribe === "canine" ? "canine_tail" : newBoard[target].tribe === "avian" ? "bird_tail" : "skink_tail",
                name: newBoard[target].tribe === "insect" ? "Wriggling Leg" : newBoard[target].tribe === "canine" ? "Furry Tail" : newBoard[target].tribe === "avian" ? "Tail Feathers" : "Wriggling Tail",
                costType:"bone",
                cost: 0,
                sigils: newSigils,
                defaultSigils: 0,
                damage: 0,
                health: 2,
                tribe: newBoard[target].tribe,
                rare: false
              }
            }

            if (Math.floor(target / 4) === Math.floor((target+1) / 4) && !newBoard[target+1]) { //empty slot
              newBoard[target+1] = {...newBoard[target], sigils: newSigils}; //does a copy need to be made?
              newBoard[target] = tailCard;
              for (let j = 0; j < indexMapping.length; j++) {
                if (indexMapping[j] === target) {
                  indexMapping[j] += 1;
                }
              } //make any actions by the target actually occur at the new location
              animationLog.push({action: "shift", index: target, target: target+1})
              animationLog.push({action: "updateCard", index: target+1, card: structuredClone(newBoard[target+1])})
              animationLog.push({action: "updateCard", index: target, card: null})
              animationLog.push({action: "place", index: target, card: structuredClone(tailCard)})
              animationLog.push({action: "updateCard", index: target, card: structuredClone(tailCard)})
            } else if (Math.floor(target / 4) === Math.floor((target-1) / 4) && !newBoard[target-1]) {
              newBoard[target-1] = {...newBoard[target], sigils: newSigils};
              newBoard[target] = tailCard;
              for (let j = 0; j < indexMapping.length; j++) {
                if (indexMapping[j] === target) {
                  indexMapping[j] -= 1;
                }
              }
              animationLog.push({action: "shift", index: target, target: target-1})
              animationLog.push({action: "updateCard", index: target-1, card: structuredClone(newBoard[target-1])})
              animationLog.push({action: "updateCard", index: target, card: null})
              animationLog.push({action: "place", index: target, card: structuredClone(tailCard)})
              animationLog.push({action: "updateCard", index: target, card: structuredClone(tailCard)})
            }
          }

          if (entry.action === "attack") {
            animationLog.push({action: "lunge", index: entry.index, aim: entry.aim})
          } else {
            animationLog.push({action: "shake",  index: target}) //now the new tail target
          }
          newBoard[target].health -= trueDamage; //FIXME - should deathtouch not kill a deathshield?
          animationLog.push({action: "updateCard", index: target, card: structuredClone(newBoard[target])})
        }

        if (newBoard[target].sigils.indexOf("beesonhit") > -1) { //SIGILS - beesonhit
          let newSigils = Array.from(newBoard[target].sigils);
          newSigils.splice(newSigils.indexOf("beesonhit"), 1);
          newSigils.splice(0, 0, "flying");
          newHands[target < 4 ? 1 : 0].push({ //newHands is never applied - is this all unnecessary and passed by reference????
            card: "bee",
            name: "Bee",
            costType:"bone",
            cost: 0,
            sigils: newSigils,
            defaultSigils: 1,
            damage: 1,
            health: 1,
            tribe: "insect",
            rare: false,
            clone: {
              card: "bee",
              name: "Bee",
              costType:"bone",
              cost: 0,
              sigils: newSigils,
              defaultSigils: 0,
              damage: 1,
              health: 1,
              tribe: "insect",
              rare: false,
            }
          })
        }

        
        if (newBoard[entry.index] && newBoard[target].sigils.indexOf("sharp") > -1) { //SIGILS - sharp
          activityLog.splice(logIndex+1, 0, {
            index: target, //careful - this may be null at next iteration
            action: newBoard[target].sigils.indexOf("deathtouch") > -1 ? "attacksharplethal" : "attacksharp", //deathtouch + sharp synergy
            target: entry.index
          })
        } //FIXME - is it the sharper or the sharp target that shakes?

        if (newBoard[entry.index] && newBoard[target].sigils.indexOf("loud") > -1) { //SIGILS - loud/createbells
          let offset = Math.floor(target / 4) * 4; //check for createbells on all cards of the side attacked

          // eslint-disable-next-line no-loop-func
          [...Array(4)].forEach((val, index) => {
            if (newBoard[(index + offset) % 8] && newBoard[index + offset].sigils.indexOf("createbells") > -1) {
              activityLog.splice(logIndex+1, 0, {
                index: index+offset,
                action: "attack",
                target: entry.index
              })
            }
          });
        }

        if (newBoard[target].health <= 0 || (entry.action === "attacksharplethal" || (newBoard[entry.index] && newBoard[entry.index].sigils.indexOf("deathtouch") > -1))) { //SIGILS - deathtouch, gainattackkonkill
          newBones[target < 4 ? 1 : 0] += newBoard[target].sigils.indexOf("quadruplebones") > -1 ? 4 : 1; //SIGILS - quadruplebones

          //FIXME - somehow this is coded so that the permanent buffs are not set in until a round ends, not when a card is redrawn from the deck. But I think I like that?
          if (newBoard[target].sigils.indexOf("drawcopyondeath") > -1) { //SIGILS - drawcopyondeath, buffondeath
            let undeadCard = {
              ...newBoard[target].clone, 
              damage: newBoard[target].clone.damage + (newBoard[target].sigils.indexOf("buffondeath") > -1 ? 1 : 0),
              health: newBoard[target].clone.damage + (newBoard[target].sigils.indexOf("buffondeath") > -1 ? 1 : 0)
            }
            undeadCard.clone = structuredClone(undeadCard);
            newRoom.hands[target < 4 ? 1 : 0].push(undeadCard) 
            if (newBoard[target].index !== undefined) {
              let matchingCard = newRoom.decks[target < 4 ? 1 : 0].findIndex((c) => c.index === newBoard[target].index);
              if (newBoard[target].sigils.indexOf("buffondeath") > -1) {
                newRoom.decks[target < 4 ? 1 : 0][matchingCard].damage = Math.max(newRoom.decks[target < 4 ? 1 : 0][matchingCard].damage, undeadCard.damage);
                newRoom.decks[target < 4 ? 1 : 0][matchingCard].health = Math.max(newRoom.decks[target < 4 ? 1 : 0][matchingCard].health, undeadCard.health);
              }
            }
          }
          let scavenging = 0; //SIGILS - opponentbones (stacks)
          let offset = target < 4 ? 4 : 0;
          for (let index = 0; index < 4; index++) {
            if (newBoard[index + offset] && newBoard[index + offset].sigils.indexOf("opponentbones") > -1) {
              scavenging++;
            }
          }
          newBones[target < 4 ? 0 : 1] += scavenging * (newBoard[target].sigils.indexOf("quadruplebones") > -1 ? 4 : 1);

          newBoard[target] = null; //SIGILS - gainattackonkill, gainattackonkillpermanent
          if (newBoard[entry.index] && newBoard[entry.index].sigils.indexOf("gainattackonkill") > -1) {
            newBoard[entry.index].damage++;
            animationLog.push({action: "updateCard", index: entry.index, card: structuredClone(newBoard[entry.index])})
          }
          if (newBoard[entry.index] && newBoard[entry.index].sigils.indexOf("gainattackonkillpermanent") > -1) {
            newBoard[entry.index].damage++;
            animationLog.push({action: "updateCard", index: entry.index, card: structuredClone(newBoard[entry.index])})
            if (newBoard[entry.index].index !== undefined) {
              let matchingCard = newRoom.decks[entry.index < 4 ? 1 : 0].findIndex((c) => c.index === newBoard[entry.index].index);
              newRoom.decks[entry.index < 4 ? 1 : 0][matchingCard].damage = Math.max(newRoom.decks[entry.index < 4 ? 1 : 0][matchingCard].damage, newBoard[entry.index].damage);
            }
          }

          let corpseIndex = -1;
          newHands[target < 4 ? 1 : 0].forEach((card, j) => {
            if (card.sigils.indexOf("corpseeater") > -1 && corpseIndex < 0) { //SIGILS - corpseeater
              corpseIndex = j; //first in hand always used
            }
          })
          if (corpseIndex > -1) {
            newRoom = placeSelectedCard(target, newHands[target < 4 ? 1 : 0][corpseIndex], newRoom);
            animationLog.push({action: "place", index: target, card: structuredClone(newHands[target < 4 ? 1 : 0][corpseIndex])})
            animationLog.push({action: "updateCard", index: target, card: structuredClone(newHands[target < 4 ? 1 : 0][corpseIndex])})
            //FIXME - hand selection is managed clientside tho????
            newHands[target < 4 ? 1 : 0].splice(corpseIndex, 1); //remove selected card from hand
          } 

        }
      } else {
        //SIGILS - whackamole
        let offset = target < 4 ? 0 : 4;
        let moleIndex = -1;
        for (let i = 0; i < 4; i++) { //FIXME - add priority to submerge / reach moles?
          if (newRoom.board[i + offset] && newRoom.board[i + offset].sigils.indexOf("whackamole") > -1 && moleIndex < 0) {
            moleIndex = i + offset;
          }
        }
        if (moleIndex > -1) {
          let temp = newBoard[target]
          newBoard[target] = newBoard[moleIndex];
          newBoard[moleIndex] = null;
          newBoard[moleIndex] = temp; //FIXME - what is this line doing?? shouldn't target always be null?
          logIndex--;
          animationLog.push({action: "shift", index: moleIndex, target: target})
          animationLog.push({action: "updateCard", index: moleIndex, card: null})
          animationLog.push({action: "updateCard", index: target, card: structuredClone(newBoard[target])})
        } else {
          if (entry.action === "attack") {
            animationLog.push({action: "lunge", index: entry.index, aim: entry.aim})
          }
          newScale += trueDamage * (target < 4 ? 1 : -1);
          animationLog.push({action: "updateScale", scale: newScale})
        }
      }
    } else if (entry.action === "transform") { 
      let newSigils = Array.from(newBoard[entry.index].sigils);
      newSigils.splice(newSigils.indexOf("submergesquid"), 1); //SIGILS - evolve

      if (entry.rand < .333) {
        newSigils.splice(0, 0, "loud")
        newSigils.splice(0, 0, "belldamage")
        newBoard[entry.index] = {
          card: "squidbell",
          name: "Bell Tentacle",
          costType:"blood",
          cost: 2,
          sigils: newSigils,
          defaultSigils: 2,
          damage: 0,
          health: 3,
          tribe: "none",
          rare: false,
          clone: {
            card: "squidbell",
            name: "Bell Tentacle",
            costType:"blood",
            cost: 2,
            sigils: newSigils,
            defaultSigils: 2,
            damage: 0,
            health: 3,
            tribe: "none",
            rare: false
          }
        }
      } else if (entry.rand < .667) {
        newSigils.splice(0, 0, "carddamage")
        newBoard[entry.index] = {
          card: "squidcards",
          name: "Card Tentacle",
          costType:"blood",
          cost: 1,
          sigils: newSigils,
          defaultSigils: 1,
          damage: 0,
          health: 1,
          tribe: "none",
          rare: false,
          clone: {
            card: "squidcards",
            name: "Card Tentacle",
            costType:"blood",
            cost: 1,
            sigils: newSigils,
            defaultSigils: 1,
            damage: 0,
            health: 1,
            tribe: "none",
            rare: false
          }
        }
      } else {
        newSigils.splice(0, 0, "mirrordamage")
        newBoard[entry.index] = {
          card: "squidmirror",
          name: "Mirror Tentacle",
          costType:"blood",
          cost: 1,
          sigils: newSigils,
          defaultSigils: 1,
          damage: 0,
          health: 1,
          tribe: "none",
          rare: false, 
          clone: {
            card: "squidmirror",
            name: "Mirror Tentacle",
            costType:"blood",
            cost: 1,
            sigils: newSigils,
            defaultSigils: 0,
            damage: 0,
            health: 1,
            tribe: "none",
            rare: false, 
          }
        }
      }

    } else if (entry.action === "evolve") {
      let newSigils = Array.from(newBoard[entry.index].sigils);
      newSigils.splice(newSigils.indexOf("evolve"), 1); //SIGILS - evolve

      if (newBoard[entry.index].card === "wolfcub") {
        newBoard[entry.index].card = "wolf";
        newBoard[entry.index].name = "Wolf";
        newBoard[entry.index].damage += 2;
        newBoard[entry.index].health += 1;
        newBoard[entry.index].sigils = newSigils;
        newBoard[entry.index].defaultSigils = 0;
      } else if (newBoard[entry.index].card === "deercub") {
        newBoard[entry.index].card = "deer";
        newBoard[entry.index].name = "Elk";
        newBoard[entry.index].damage += 1;
        newBoard[entry.index].health += 3;
        newBoard[entry.index].sigils = newSigils;
        newBoard[entry.index].defaultSigils = 1;
      } else if (newBoard[entry.index].card === "ravenegg") {
        newBoard[entry.index].card = "raven";
        newBoard[entry.index].name = "Raven";
        newBoard[entry.index].damage += 2;
        newBoard[entry.index].health += 1;
        newBoard[entry.index].sigils = ["flying", ...newSigils];
      } else if (newBoard[entry.index].card === "mothman_1") {
        newBoard[entry.index].card = "mothman_2"; //FIXME - is it actually called this? I dont have internet rn lol
        newBoard[entry.index].name = "Strange Pupa";
        newBoard[entry.index].sigils = ["evolve", ...newSigils];
      } else if (newBoard[entry.index].card === "mothman_2") {
        newBoard[entry.index].card = "mothman_3";
        newBoard[entry.index].name = "Mothman";
        newBoard[entry.index].damage += 7;
        newBoard[entry.index].sigils = ["flying", ...newSigils];
      } else if (newBoard[entry.index].card === "direwolfcub") {
        newBoard[entry.index].card = "direwolf";
        newBoard[entry.index].name = "Dire Wolf";
        newBoard[entry.index].damage += 1;
        newBoard[entry.index].health += 4;
        newSigils.splice(newSigils.indexOf("bonedigger"), 1);
        newBoard[entry.index].defaultSigils = 1;
        newBoard[entry.index].sigils = ["doublestrike", ...newSigils];
      } else if (newBoard[entry.index].card === "tadpole") {
        newBoard[entry.index].card = "bullfrog";
        newBoard[entry.index].name = "Bullfrog";
        newBoard[entry.index].damage += 1;
        newBoard[entry.index].health += 1;
        newBoard[entry.index].defaultSigils = 1;
        newSigils.splice(newSigils.indexOf("submerge"), 1);
        newBoard[entry.index].sigils = ["reach", ...newSigils];
      } else if (newBoard[entry.index].card === "ant" || newBoard[entry.index].card === "antflying") {
        if (newBoard[entry.index].card === "antflying") {
          newSigils.splice(newSigils.indexOf("flying"), 1);
        }
        newBoard[entry.index].card = "antqueen";
        newBoard[entry.index].name = "Ant Queen";
        newBoard[entry.index].health += 2;
        newBoard[entry.index].defaultSigils = 1;
        newBoard[entry.index].sigils = ["drawant", ...newSigils];
        //deviation - draw ant for fun?
        //SIGILS - drawant
        newRoom.hands[entry.index < 4 ? 1 : 0].push({ //modifies newRoom directly?
          card: "ant",
          name: "Worker Ant",
          costType:"blood",
          cost: 1,
          sigils: newSigils,
          defaultSigils: 1,
          damage: 0,
          health: 2,
          tribe: "insect",
          rare: false,
          clone: {
            card: "ant",
            name: "Worker Ant",
            costType:"blood",
            cost: 1,
            sigils: newSigils,
            defaultSigils: 0,
            damage: 0,
            health: 2,
            tribe: "insect",
            rare: false
          }
        })
      } else if (newBoard[entry.index].card === "deer") {
        newBoard[entry.index].card = "moose";
        newBoard[entry.index].damage += 1;
        newBoard[entry.index].health += 3;
        newSigils.splice(newSigils.indexOf("strafe"), 1);
        newBoard[entry.index].sigils = [...newSigils, "strafepush"];
      } else if (newBoard[entry.index].card === "mole") {
        newBoard[entry.index].card = "moleman";
        newBoard[entry.index].defaultSigils = 2;
        newBoard[entry.index].health += 2;
        newBoard[entry.index].sigils = [...newSigils, "reach"];
      } else if (newBoard[entry.index].card === "mantis") {
        newBoard[entry.index].card = "mantisgod";
        newSigils.splice(newSigils.indexOf("splitstrike"), 1);
        newBoard[entry.index].sigils = [...newSigils, "tristrike"];
      } else {
        newBoard[entry.index].health += 2;
        if (newBoard[entry.index].damage > -3) { //fix: no special damage
          newBoard[entry.index].damage += 1;
        }
        if (newBoard[entry.index].sigils.indexOf("evolve") < newBoard[entry.index].defaultSigils)  {
          newBoard[entry.index].defaultSigils -= 1;
        }
        newBoard[entry.index].sigils = newSigils;
      }
    } else if (entry.action === "strafe") {
      if (newBoard[entry.index].sigils.indexOf("strafeleft") > -1) {
        if (entry.index % 4 !== 0 && !newBoard[entry.index-1]) { //move
          newBoard[entry.index-1] = newBoard[entry.index];
          newBoard[entry.index] = null;
          indexMapping[originalIndex] -= 1;
        } else if (!entry.swapped) {
          newBoard[entry.index].sigils = newBoard[entry.index].sigils.map((val, i) => {
            return val === "strafeleft" ? "strafe" : 
                   val === "strafepushleft" ? "strafepush" : 
                   val === "strafeswapleft" ? "strafeswap" : val;
          })
          activityLog.splice(logIndex+1, 0, {...entry, 
            index: originalIndex,
            swapped: true
          })
        }
      } else {
        if (entry.index % 4 !== 3 && !newBoard[entry.index+1]) { //move
          newBoard[entry.index+1] = newBoard[entry.index];
          newBoard[entry.index] = null;
          indexMapping[originalIndex] += 1;
        } else if (!entry.swapped) {
          newBoard[entry.index].sigils = newBoard[entry.index].sigils.map((val, i) => {
            return val === "strafe" ? "strafeleft" : 
                   val === "strafepush" ? "strafepushleft" : 
                   val === "strafeswap" ? "strafeswapleft" : val;
          })
          activityLog.splice(logIndex+1, 0, {...entry, 
            index: originalIndex,
            swapped: true
          })
        }
      }
    } else if (entry.action === "strafepush") {
      if (newBoard[entry.index].sigils.indexOf("strafepushleft") > -1) {
        let searchIndex = entry.index;
        let stack = [];
        while (Math.floor(searchIndex / 4) === Math.floor(entry.index / 4) && newBoard[searchIndex]) {
          stack.push(searchIndex);
          searchIndex--;
        }
        stack.reverse();
        searchIndex++;
        if (searchIndex % 4 !== 0) { //pushing possible
          for (const i of stack) {
            newBoard[i-1] = newBoard[i];
            newBoard[i] = null;
            for (let j = 0; j < indexMapping.length; j++) {
              if (indexMapping[j] === i) {
                indexMapping[j] -= 1
              } 
            }
          }
        } else if (!entry.swapped) {
          newBoard[entry.index].sigils = newBoard[entry.index].sigils.map((val, i) => {
            return val === "strafeleft" ? "strafe" : 
                   val === "strafepushleft" ? "strafepush" : 
                   val === "strafeswapleft" ? "strafeswap" : val;
          })
          activityLog.splice(logIndex+1, 0, {...entry, 
            index: originalIndex,
            swapped: true
          })
        }
      } else {
        let searchIndex = entry.index;
        let stack = [];
        while (Math.floor(searchIndex / 4) === Math.floor(entry.index / 4) && newBoard[searchIndex]) {
          stack.push(searchIndex);
          searchIndex++;
        }
        stack.reverse();
        searchIndex--;
        if (searchIndex % 4 !== 3) { //pushing possible
          for (const i of stack) {
            newBoard[i+1] = newBoard[i];
            newBoard[i] = null;
            for (let j = 0; j < indexMapping.length; j++) {
              if (indexMapping[j] === i) {
                indexMapping[j] += 1
              } 
            }
          }
        } else if (!entry.swapped) {
          newBoard[entry.index].sigils = newBoard[entry.index].sigils.map((val, i) => {
            return val === "strafe" ? "strafeleft" : 
                   val === "strafepush" ? "strafepushleft" : 
                   val === "strafeswap" ? "strafeswapleft" : val;
          })
          activityLog.splice(logIndex+1, 0, {...entry, 
            index: originalIndex,
            swapped: true
          })
        }
      }
    } else if (entry.action === "strafeswap") {
      if (newBoard[entry.index].sigils.indexOf("strafeswapleft") > -1) {
        if (entry.index % 4 !== 0) {
          let temp = newBoard[entry.index-1];
          newBoard[entry.index-1] = newBoard[entry.index];
          newBoard[entry.index] = temp;
          for (let j = 0; j < indexMapping.length; j++) {
            if (indexMapping[j] === entry.index-1) {
              indexMapping[j] += 1
            }
          }
          indexMapping[originalIndex] -= 1;
        } else if (!entry.swapped) {
          newBoard[entry.index].sigils = newBoard[entry.index].sigils.map((val, i) => {
            return val === "strafeleft" ? "strafe" : 
                   val === "strafepushleft" ? "strafepush" : 
                   val === "strafeswapleft" ? "strafeswap" : val;
          })
          activityLog.splice(logIndex+1, 0, {...entry, 
            index: originalIndex,
            swapped: true
          })
        }
      } else {
        if (entry.index % 4 !== 3) {
          let temp = newBoard[entry.index+1];
          newBoard[entry.index+1] = newBoard[entry.index];
          newBoard[entry.index] = temp;
          for (let j = 0; j < indexMapping.length; j++) {
            if (indexMapping[j] === entry.index-1) {
              indexMapping[j] -= 1
            }
          }
          indexMapping[originalIndex] += 1;
        } else if (!entry.swapped) {
          newBoard[entry.index].sigils = newBoard[entry.index].sigils.map((val, i) => {
            return val === "strafe" ? "strafeleft" : 
                   val === "strafepush" ? "strafepushleft" : 
                   val === "strafeswap" ? "strafeswapleft" : val;
          })
          activityLog.splice(logIndex+1, 0, {...entry, 
            index: originalIndex,
            swapped: true
          })
        }
      }
    }
  }

  [...Array(4)].forEach((val, i) => {
    let offset = newRoom.gameState === "simulating0" ? 4 : 0;
    if (newBoard[i+offset]) {
      newBoard[i + offset].sacBonus = 0;
    }
  })

  if (newScale * (newRoom.gameState === "simulating0" ? 1 : -1) <= -5) {
    //restart game if scale is tipped at end of turn
    rooms[roomIndex] = {...newRoom, 
      gameState:"drafting", 
      board: [null, null, null, null, null, null, null, null], 
      scale: 0,
      lit0: true,
      lit1: true,
      animationLog: [],
      hands: [[],[]],
      bones: [0, 0],
      sacrifices: [],
      draft: {
        phase: -1, //draw new cards for draft
        options: []
      }}
  } else {
    rooms[roomIndex] = {...newRoom, board: newBoard, scale: newScale, bones: newBones, gameState: (newRoom.gameState === "simulating0" ? "draw1" : "draw0"), animationLog: []} //TEMP
  }
}

io.on("connection", (socket) => {
  console.log("New user:", socket.id)

  socket.on("newDeck", (newRoom) => {
    rooms[newRoom.id].decks[newRoom.player0 === socket.id ? 0 : 1] = newRoom.decks[newRoom.player0 === socket.id ? 0 : 1];
    doubleConf[newRoom.id][newRoom.player0 === socket.id ? 0 : 1] = true;
    if (doubleConf[newRoom.id][0] && doubleConf[newRoom.id][1]) {
      doubleConf[newRoom.id] = [false, false];

      rooms[newRoom.id].gameState = "roundStart0";
      rooms[newRoom.id].round = Math.min(rooms[newRoom.id].round+1, 4); //cap at 4 scribes / 8 drafts for now?
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
        animationLog: [],
        player0: socket.id,
        player1: null,
        hands: [[],[]],
        decks: [
          [
            {
              card: "stoat",
              name: "Stoat",
              costType:"blood",
              cost: 1,
              sigils: [],
              defaultSigils: 0,
              damage: 1,
              health: 2,
              tribe: "none",
              rare: false,
              index: 0
            },
            {
              card: "bullfrog",
              name: "Bullfrog",
              costType:"blood",
              cost: 1,
              sigils: ["reach"],
              defaultSigils: 1,
              damage: 1,
              health: 2,
              tribe: "reptile",
              rare: false,
              index: 1
            },
            {
              card: "wolf",
              name: "Wolf",
              costType:"blood",
              cost: 2,
              sigils: [],
              defaultSigils: 0,
              damage: 3,
              health: 2,
              tribe: "canine",
              rare: false,
              index: 3
            }
          ],
          [
            {
              card: "stoat",
              name: "Stoat",
              costType:"blood",
              cost: 1,
              sigils: [],
              defaultSigils: 0,
              damage: 1,
              health: 2,
              tribe: "none",
              rare: false,
              index: 0
            },
            {
              card: "bullfrog",
              name: "Bullfrog",
              costType:"blood",
              cost: 1,
              sigils: ["reach"],
              defaultSigils: 1,
              damage: 1,
              health: 2,
              tribe: "reptile",
              rare: false,
              index: 1
            },
            {
              card: "wolf",
              name: "Wolf",
              costType:"blood",
              cost: 2,
              sigils: [],
              defaultSigils: 0,
              damage: 3,
              health: 2,
              tribe: "canine",
              rare: false,
              index: 3
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
    rooms[room].animationLog = []
    activityLog = [];

    //attacks
    [...Array(4)].forEach((val, index) => {
      if (rooms[room].board[index + offset] /*&& rooms[room].board[index + offset].damage > 0*/) { //second clause was originally commented out? 
                                                                                                   //this was for alpha you silly billy
        let sigils = rooms[room].board[index + offset].sigils;
  
        if (sigils.indexOf("splitstrike") < 0 && sigils.indexOf("tristrike") < 0) {
          activityLog.push({
            index: index + offset,
            action: "attack",
            aim: 0
          })  
        }

        if (sigils.indexOf("splitstrike") > -1) { //SIGILS - splitstrike
          activityLog.push({
            index: index + offset,
            action: "attack",
            aim: -1 
          })  
          activityLog.push({
            index: index + offset,
            action: "attack",
            aim: 1
          })  
        }
        //must be done twice for them to stack
        if (sigils.indexOf("tristrike") > -1) { //SIGILS - tristrike
          activityLog.push({
            index: index + offset,
            action: "attack",
            aim: -1 
          })  
          activityLog.push({ //this is isolated to avoid bugs when stacked with splitstrike
            index: index + offset,
            action: "attack",
            aim: 0
          })  
          activityLog.push({
            index: index + offset,
            action: "attack",
            aim: 1
          })  
        }

        if (sigils.indexOf("doublestrike") >= 0) { //SIGILS - doublestrike
          activityLog.push({
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
          activityLog.push({
            index: index + offset,
            action: "strafeswap",
            swapped: false
          })
        }
        if (sigils.indexOf("strafepush") > -1 || sigils.indexOf("strafepushleft") > -1) { //SIGILS - strafepush
          activityLog.push({
            index: index + offset,
            action: "strafepush",
            swapped: false
          })
        }
        if (sigils.indexOf("strafe") > -1 || sigils.indexOf("strafeleft") > -1) { //SIGILS - strafeswap
          activityLog.push({
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
        activityLog.push({
          index: (index + offset + 4) % 8,
          action: "transform",
          rand: Math.random()
        })  
      }
    });

    //evolutions
    [...Array(4)].forEach((val, index) => {
      if (rooms[room].board[(index + offset + 4) % 8] && rooms[room].board[(index + offset + 4) % 8].sigils.indexOf("evolve") > -1) {
        activityLog.push({
          index: (index + offset + 4) % 8,
          action: "evolve"
        })  
      }
    });

    rooms[room].gameState = rooms[room].gameState == "play1" ? "simulating1" : "simulating0";
    simulateActivityLog(room, activityLog)
    io.to(room).emit("serverUpdate", rooms[room]);
  })
})

function getCardsForDraft(n) {
  return shuffleArray(Object.values(allCards)).slice(0,n);
}

server.listen(4000, () => {
  console.log("Server started!")
})