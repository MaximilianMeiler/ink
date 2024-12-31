import {useState, useEffect} from 'react'
import './App.css';
import io from "socket.io-client";
import Card from './Card';
import {allCards, allSigils} from './cardList';
const socket = io.connect("http://localhost:4000"); //socket.socket.sessionid

function App() {
  const [room, setRoom] = useState(null)
  const [handHover, setHandHover] = useState(-1)
  const [hoverSection, setHoverSection] = useState(-1)
  const [handSelection, setHandSelection] = useState(-1);
  const [draw, setDraw] = useState([]);

  const calcTrueDamage = (board, index, bones, hands, recur = false) => {
    return Math.max(board[index].damage, //SIGILS - antdamage, belldamage, carddamage, mirrordamage, bonedamage
      board[index].sigils.indexOf("antdamage") > -1 ? [...Array(4)].reduce((acc, v, i) => acc + (board[i+(Math.floor(index / 4) * 4)] && ["ant","antqueen","antflying","amalgam"].indexOf(board[i+(Math.floor(index / 4) * 4)].name) > -1 ? 1 : 0), 0) : 0, 
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

    if (!newRoom) {
      const ret = placeSelectedCard(index, placedCard, room);
      setSendRoom(ret);
      return null;
    }

    //try not to use this, but it's here in case
    if (index < 0 || index > 7) {return;}

    let newHands = newRoom.hands;
    let newBones = newRoom.bones;
    let newBoard = newRoom.board;
    
    let damageBonus = 0;
    let healthBonus = 0;
    let offset = newRoom.player0 === socket.id ? 0 : 4;

    if (!placedCard) { //placing selected card
      placedCard = newRoom.hands[newRoom.player0 === socket.id ? 0 : 1][handSelection];

      if (placedCard.costType === "bone") {
        newBones[newRoom.player0 === socket.id ? 0 : 1] -= placedCard.cost;
      } else {
        let boneGain = newRoom.sacrifices.reduce((acc, i) => acc + (newRoom.board[i].sigils.indexOf("quadruplebones") > -1 ? 4 : 1), 0) //SIGILS - quadruplebones
        newBones[newRoom.player0 === socket.id ? 0 : 1] += boneGain; //FIXME - should be based on state and not socket id...
        let scavenging = 0; //SIGILS - opponentbones (stacks)
        for (let i = 0; i < 4; i++) {
          if (newRoom.board[i + offset] && newRoom.board[i + offset].sigils.indexOf("opponentbones") > -1) {
            scavenging++;
          }
        }
        newBones[newRoom.player0 === socket.id ? 1 : 0] += scavenging * boneGain
    
        newRoom.sacrifices.forEach((i) => {
          if (newBoard[i].sigils.indexOf("morsel") > -1) { //SIGILS - morsel
            damageBonus += newBoard[i].damage;
            healthBonus += newBoard[i].health;
          }
          if (newBoard[i].sigils.indexOf("sacrificial") < 0) { //SIGILS - sacrificial
            if (newBoard[i].sigils.indexOf("drawcopyondeath") > -1) { //SIGILS - drawcopyondeath, buffondeath
              //i < 4 ? 1 : 0
              let undeadCard = {
                ...newBoard[i].clone, 
                clone: newBoard[i].clone,
                damage: newBoard[i].clone.damage + (newBoard[i].sigils.indexOf("buffondeath") > -1 ? 1 : 0),
                health: newBoard[i].clone.damage + (newBoard[i].sigils.indexOf("buffondeath") > -1 ? 1 : 0)
              }
              undeadCard.clone = structuredClone(undeadCard);
              newRoom.hands[newRoom.player0 === socket.id ? 0 : 1].push(undeadCard) 
              if (newBoard[i].index !== undefined) {
                let matchingCard = newRoom.decks[newRoom.player0 === socket.id ? 0 : 1].findIndex((c) => c.index === newBoard[i].index);
                if (newBoard[i].sigils.indexOf("buffondeath") > -1) {
                  newRoom.decks[newRoom.player0 === socket.id ? 0 : 1][matchingCard].damage = Math.max(newRoom.decks[newRoom.player0 === socket.id ? 0 : 1][matchingCard].damage, undeadCard.damage);
                  newRoom.decks[newRoom.player0 === socket.id ? 0 : 1][matchingCard].health = Math.max(newRoom.decks[newRoom.player0 === socket.id ? 0 : 1][matchingCard].health, undeadCard.health);
                }
              }
            }
            newBoard[i] = null; //kill sacrificial cards
          } else if (newBoard[i].sigils.indexOf("sacrificialswap") > -1) {
            if (newBoard[i].awakened) {
              if (newBoard[i].card === "jerseydevil") {
                newBoard[i].card = "jerseydevil_sleeping";
              }
              newBoard[i].awakened = false;
              newBoard[i].sigils.splice(0, 1)
              newBoard[i].damage -= 2;
              newBoard[i].defaultSigils -= 1;
            } else {
              if (newBoard[i].card === "jerseydevil_sleeping") {
                newBoard[i].card = "jerseydevil";
              }
              newBoard[i].awakened = true;
              newBoard[i].sigils.splice(0, 0, "flying")
              newBoard[i].damage += 2;
              newBoard[i].defaultSigils += 1;
            }
          }
        });
      }

      newHands[newRoom.player0 === socket.id ? 0 : 1].splice(handSelection, 1); //remove selected card from hand
      setHandSelection(-1);
    }

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
      newHands[newRoom.player0 === socket.id ? 0 : 1].push({
        card: "ant",
        costType:"blood",
        cost: 1,
        sigils: newSigils,
        defaultSigils: 0,
        damage: -5,
        health: 2,
        tribe: "insect",
        rare: false,
        clone: {
          card: "ant",
          costType:"blood",
          cost: 1,
          sigils: newSigils,
          defaultSigils: 0,
          damage: -5,
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

  useEffect(() => {
    socket.on("serverUpdate", (newRoom) => {
      console.log("new room from server:", newRoom)

      if (newRoom.gameState === "roundStart0" && newRoom.player0 === socket.id) {
        setDraw(shuffleArray(newRoom.decks[0]));
        newRoom.gameState = "roundStart1";
        setSendRoom(newRoom);
      } else
      if (newRoom.gameState === "roundStart1" && newRoom.player1 === socket.id) {
        setDraw(shuffleArray(newRoom.decks[1]));
        newRoom.gameState = "draw0";
        setSendRoom(newRoom);
      } else
      if (newRoom.gameState === "simulating0" || newRoom.gameState === "simulating1") {
        simulateActivityLog(structuredClone(newRoom));
      } else {
        setRoom(newRoom);
      }
    })
  }, [socket])


  function setSendRoom(newRoom) {
    socket.emit("clientUpdate", newRoom);
    setRoom(newRoom);
  }

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

  function simulateActivityLog(newRoom) {
    let newBones = newRoom.bones;
    let newScale = newRoom.scale;
    let newBoard = newRoom.board;
    let newHands = newRoom.hands;
    console.log("simulating room", newRoom)
    let indexMapping = [0, 1, 2, 3, 4, 5, 6, 7];

    for (let logIndex = 0; logIndex < newRoom.activityLog.length; logIndex++) {
      let entry = newRoom.activityLog[logIndex];
      let originalIndex = entry.index;
      if (!entry.target) { //sharp attack
        entry.index = indexMapping[entry.index] //adjust for card movements
      }
      if (!newBoard[entry.index] && !entry.target) { //no card left to act
        continue;
      }

      //TODO: add animations
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
          if (shieldIndex > -1) {
            if (shieldIndex < newBoard[target].defaultSigils) {
              newBoard[target].defaultSigils--;
            }
            newBoard[target].sigils.splice(shieldIndex, 1);
          } else {
            if (newBoard[target].sigils.indexOf("tailonhit") > -1) { //SIGILS - tailonhit
              let newSigils = Array.from(newBoard[target].sigils);
              newSigils.splice(newSigils.indexOf("tailonhit"), 1);
              let tailCard = {
                card: newBoard[target].tribe === "insect" ? "insect_tail" : newBoard[target].tribe === "canine" ? "canine_tail" : newBoard[target].tribe === "avian" ? "bird_tail" : "skink_tail",
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
              } else if (Math.floor(target / 4) === Math.floor((target-1) / 4) && !newBoard[target-1]) {
                newBoard[target-1] = {...newBoard[target], sigils: newSigils};
                newBoard[target] = tailCard;
                for (let j = 0; j < indexMapping.length; j++) {
                  if (indexMapping[j] === target) {
                    indexMapping[j] -= 1;
                  }
                }
              }
            }

            newBoard[target].health -= trueDamage; //FIXME - should deathtouch not kill a deathshield?
          }

          if (newBoard[target].sigils.indexOf("beesonhit") > -1) { //SIGILS - beesonhit
            let newSigils = Array.from(newBoard[target].sigils);
            newSigils.splice(newSigils.indexOf("beesonhit"), 1);
            newSigils.splice(0, 0, "flying");
            newHands[target < 4 ? 1 : 0].push({ //newHands is never applied - is this all unnecessary and passed by reference????
              card: "bee",
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
            newRoom.activityLog.splice(logIndex+1, 0, {
              index: target, //careful - this may be null at next iteration
              action: newBoard[target].sigils.indexOf("deathtouch") > -1 ? "attacksharplethal" : "attacksharp", //deathtouch + sharp synergy
              target: entry.index
            })
          }

          if (newBoard[entry.index] && newBoard[target].sigils.indexOf("loud") > -1) { //SIGILS - loud/createbells
            let offset = Math.floor(target / 4) * 4; //check for createbells on all cards of the side attacked

            // eslint-disable-next-line no-loop-func
            [...Array(4)].forEach((val, index) => {
              if (newBoard[(index + offset) % 8] && newBoard[index + offset].sigils.indexOf("createbells") > -1) {
                newRoom.activityLog.splice(logIndex+1, 0, {
                  index: index+offset,
                  action: "attack",
                  target: entry.index
                })
              }
            });
          }

          if (newBoard[target].health <= 0 || (entry.action === "attacksharplethal" || (newBoard[entry.index] && newBoard[entry.index].sigils.indexOf("deathtouch") > -1))) { //SIGILS - deathtouch, gainattackkonkill
            newBones[target < 4 ? 1 : 0] += newBoard[target].sigils.indexOf("quadruplebones") > -1 ? 4 : 1; //SIGILS - quadruplebones

            //FIXME - somehow this is coded so that the permanent buffs set in until a round ends, not when a card is redrawn from the deck. But I think I like that?
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
            }
            if (newBoard[entry.index] && newBoard[entry.index].sigils.indexOf("gainattackonkillpermanent") > -1) {
              newBoard[entry.index].damage++;
              if (newBoard[entry.index].index !== undefined) {
                let matchingCard = newRoom.decks[entry.index < 4 ? 1 : 0].findIndex((c) => c.index === newBoard[entry.index].index);
                newRoom.decks[entry.index < 4 ? 1 : 0][matchingCard].damage = Math.max(newRoom.decks[entry.index < 4 ? 1 : 0][matchingCard].damage, newBoard[entry.index].damage);
              }
            }

            let corpseIndex = -1;
            newHands[target < 4 ? 1 : 0].forEach((card, j) => {
              if (card.sigils.indexOf("corpseeater") > -1 && corpseIndex > 0) { //SIGILS - corpseeater
                corpseIndex = j; //first in hand always used
              }
            })
            if (corpseIndex > -1) {
              newRoom = placeSelectedCard(target, newHands[target < 4 ? 1 : 0][corpseIndex], newRoom);

              if (handSelection === corpseIndex) {
                setHandSelection(-1);
              }
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
            newBoard[moleIndex] = temp;
            logIndex--;
          } else {
            newScale += trueDamage * (target < 4 ? 1 : -1);
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
              costType:"blood",
              cost: 1,
              sigils: newSigils,
              defaultSigils: 0,
              damage: -8,
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
          newBoard[entry.index].damage += 2;
          newBoard[entry.index].health += 1;
          newBoard[entry.index].sigils = newSigils;
          newBoard[entry.index].defaultSigils = 0;
        } else if (newBoard[entry.index].card === "deercub") {
          newBoard[entry.index].card = "deer";
          newBoard[entry.index].damage += 1;
          newBoard[entry.index].health += 3;
          newBoard[entry.index].sigils = newSigils;
          newBoard[entry.index].defaultSigils = 1;
        } else if (newBoard[entry.index].card === "ravenegg") {
          newBoard[entry.index].card = "raven";
          newBoard[entry.index].damage += 2;
          newBoard[entry.index].health += 1;
          newBoard[entry.index].sigils = ["flying", ...newSigils];
        } else if (newBoard[entry.index].card === "mothman_1") {
          newBoard[entry.index].card = "mothman_2";
          newBoard[entry.index].sigils = ["evolve", ...newSigils];
        } else if (newBoard[entry.index].card === "mothman_2") {
          newBoard[entry.index].card = "mothman_3";
          newBoard[entry.index].damage += 7;
          newBoard[entry.index].sigils = ["flying", ...newSigils];
        } else if (newBoard[entry.index].card === "direwolfcub") {
          newBoard[entry.index].card = "direwolf";
          newBoard[entry.index].damage += 1;
          newBoard[entry.index].health += 4;
          newSigils.splice(newSigils.indexOf("bonedigger"), 1);
          newBoard[entry.index].defaultSigils = 1;
          newBoard[entry.index].sigils = ["doublestrike", ...newSigils];
        } else if (newBoard[entry.index].card === "tadpole") {
          newBoard[entry.index].card = "bullfrog";
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
          newBoard[entry.index].health += 2;
          newBoard[entry.index].defaultSigils = 1;
          newBoard[entry.index].sigils = ["drawant", ...newSigils];
          //deviation - draw ant for fun?
          //SIGILS - drawant
          newRoom.hands[entry.index < 4 ? 1 : 0].push({ //modifies newRoom directly?
            card: "ant",
            costType:"blood",
            cost: 1,
            sigils: newSigils,
            defaultSigils: 0,
            damage: -5,
            health: 2,
            tribe: "insect",
            rare: false
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
            newRoom.activityLog.splice(logIndex+1, 0, {...entry, 
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
            newRoom.activityLog.splice(logIndex+1, 0, {...entry, 
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
            newRoom.activityLog.splice(logIndex+1, 0, {...entry, 
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
            newRoom.activityLog.splice(logIndex+1, 0, {...entry, 
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
            newRoom.activityLog.splice(logIndex+1, 0, {...entry, 
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
            newRoom.activityLog.splice(logIndex+1, 0, {...entry, 
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
      setSendRoom({...newRoom, 
        gameState:"drafting", 
        board: [null, null, null, null, null, null, null, null], 
        scale: 0,
        lit0: true,
        lit1: true,
        activityLog: [],
        hands: [[],[]],
        bones: [0, 0],
        sacrifices: [],
        draft: {
          phase: -1, //draw new cards for draft
          options: []
        }})
    } else {
      console.log("new room after simulation",structuredClone({...newRoom, board: newBoard, scale: newScale, bones: newBones, gameState: (newRoom.gameState === "simulating0" ? "draw1" : "draw0")}))
      setRoom({...newRoom, board: newBoard, scale: newScale, bones: newBones, gameState: (newRoom.gameState === "simulating0" ? "draw1" : "draw0"), activityLog: []}) //TEMP
    }
  }

  let blankCard = {
    card: "blank",
    costType: "bone",
    cost: 0,
    sigils: [],
    damage: -1,
    health: -1
  }

  return (
    <div className="App">
      <div style={{display: "flex"}}>
        <p>Join room: </p>
        <input type='text' id="roomInput"></input>
        <button onClick={() => {
          if (room) {
            socket.emit("clientRoomLeave", room.id)
          }
          socket.emit("clientRoomJoin", document.getElementById('roomInput').value)
        }}>Join</button>
        <button onClick={() => {
          if (room) {
            socket.emit("clientRoomLeave", room.id)
          }
          setRoom(null);
        }}>Leave room</button>
      </div>
      <div>Room: {room ? room.id : ""}</div>

      {room ? <div>

        {(room.gameState === "drafting") ? 
          <div>
            <div style={{position: 'relative', paddingTop: "190px"}}> 
              {room.decks[room.player0 === socket.id ? 1 : 0].map((card, index) => {
                let s = room.decks[room.player0 === socket.id ? 1 : 0].length
                let l = 295 - (index * 295/(s - 1));
                let m;
                handHover !== s-1 && index <= handHover && hoverSection === 0 ? m = 5 + (125 * s - 420)/(s - 1) : m = 0;

                return <div 
                  style={{position:"absolute", left: l, paddingLeft: m, top:`${index === handSelection ? "-10" : "0"}px`}}
                  onMouseEnter={() => {setHandHover(index); setHoverSection(0);}}
                  onMouseLeave={() => {setHandHover(-1); setHoverSection(-1);}}
                >
                  <Card val={card}/>
                </div>
              })}
            </div>
            <div className='draftGrid'>
              {room.draft ? room.draft.options.map((card, index) => {
                return <div className='gameSlot'>
                  <img src='/card_queue_slot.png' alt='empty draft slot' className='card cardSlot' style={room.draft.phase % 2 !== (room.player0 === socket.id ? 0 : 1) ? {transform: 'rotate(180deg)'} : {}}></img>
                  { card ? 
                    <div>
                      <div style={{marginTop:"18px", marginLeft:"14.5px"}}>
                        <Card val={card}/>
                      </div>
                      <img src='/card_slot.png' alt='empty card slot' className='card cardSlot' style={{zIndex:"50", opacity:"0"}} onClick={() => {
                        if (room.draft.phase % 2 === (room.player0 === socket.id ? 0 : 1)) {
                          let newDecks = room.decks;
                          newDecks[room.player0 === socket.id ? 0 : 1].push({...card, index: newDecks[room.player0 === socket.id ? 0 : 1].length});
                          let newDraw = room.draft;
                          newDraw.options[index] = null;
                          if (newDraw.phase === 4) {
                            setSendRoom({...room, decks: newDecks, draft: newDraw, gameState: "roundStart0"})
                          } else {
                            newDraw.phase++;
                            setSendRoom({...room, decks: newDecks, draft: newDraw})
                          }
                        }
                      }}></img>
                    </div>
                  : <></>}
                </div>
              }) : <></>}
              <div className='gameSlot'>
                <img src='/card_queue_slot.png' alt='empty draft slot' className='card cardSlot' style={room.draft.phase % 2 !== (room.player0 === socket.id ? 0 : 1) ? {transform: 'rotate(180deg)'} : {}}></img>
                <div style={{marginTop:"18px", marginLeft:"14.5px"}}>
                  {room.draft.phase % 2 === (room.player0 === socket.id ? 0 : 1) ? <Card val={blankCard}/> : <></>}
                </div>
                <img src='/card_slot.png' alt='empty card slot' className='card cardSlot' style={{zIndex:"50", opacity:"0"}} onClick={() => {
                  if (room.draft.phase % 2 === (room.player0 === socket.id ? 0 : 1)) {
                    if (room.draft.phase === 4) {
                      setSendRoom({...room, gameState: "roundStart0"})
                    } else {
                      let newDraw = room.draft;
                      newDraw.phase++;
                      setSendRoom({...room, draft: newDraw})
                    }
                  }

                }}></img>
              </div>
            </div>
            
            <div style={{position: 'relative', marginBottom: "190px"}}> 
              {room.decks[room.player0 === socket.id ? 0 : 1].map((card, index) => {
                let s = room.decks[room.player0 === socket.id ? 0 : 1].length
                let l = 295 - (index * 295/(s - 1));
                let m;
                handHover !== s-1 && index <= handHover && hoverSection === 1 ? m = 5 + (125 * s - 420)/(s - 1) : m = 0;

                return <div 
                  style={{position:"absolute", left: l, paddingLeft: m, top:`${index === handSelection ? "-10" : "0"}px`}}
                  onMouseEnter={() => {setHandHover(index); setHoverSection(1);}}
                  onMouseLeave={() => {setHandHover(-1); setHoverSection(-1);}}
                >
                  <Card val={card}/>
                </div>
              })}
            </div>
          </div>
        : <></>}

        {(["draw0", "draw1", "play0", "play1", "roundStart0", "roundStart1", "simulating0", "simulating1"].indexOf(room.gameState) > -1) ? <div>
          <div onClick={() => {
            // setSendRoom({...room, gameState: (room.player0 === socket.id ? "draw1" : "draw0"), sacrifices: []}); //swap turns
            if (room.gameState === (room.player0 === socket.id ? "play0" : "play1")) {
              socket.emit("bellRung", room.id);
            }
          }}>Ring Bell</div>
          <div style={room.scale * (room.player0 === socket.id ? 1 : -1) <= -5 ? {color: "red"} : {}}>{room.scale}</div>
          <div>Bones: P0-{room.bones[0]} P1-{room.bones[1]}</div>

          <div className='gameGrid'>
            {room.board ? room.board.map((val, index) => {
              let trueIndex = index;
              if (room.player0 !== socket.id) { //if player B, flip board
                index = (index + 4) % 8;
                val = room.board[index]
              }

              console.log(index, room.board, room.board[index-1])

              return (
                <div className='gameSlot'>
                  <img src='/card_slot.png' alt='empty card slot' className='card cardSlot' style={trueIndex < 4 ? {transform: 'rotate(180deg)'} : {}}></img>
                  {val && val.card ? 
                    <div style={{marginTop:"18px", marginLeft:"14.5px"}}>
                      <Card val={{...val,
                        damage: calcTrueDamage(room.board, index, room.bones, room.hands)
                      }}/>
                    </div>
                  : <></>
                  }
                  {room.sacrifices.indexOf(index) > -1 ?
                    <img src='./sacrifice_mark.png' alt='sacrifice mark' className='card sacrificeMark'></img>
                  : <></>
                  }
                  <img src='/card_slot.png' alt='empty card slot' className='card cardSlot' style={{zIndex:"50", opacity:"0"}} onClick={() => {
                    if (trueIndex > 3 && handSelection > -1 && room.gameState === (room.player0 === socket.id ? "play0" : "play1")) { //interactable slots
                      if ((!val || (room.sacrifices.indexOf(index) > -1 && val.sigils.indexOf("sacrificial") < 0)) &&
                        (
                          (room.hands[room.player0 === socket.id ? 0 : 1][handSelection].costType === "bone" && 
                          room.hands[room.player0 === socket.id ? 0 : 1][handSelection].cost <= room.bones[room.player0 === socket.id ? 0 : 1])
                        || 
                          (room.hands[room.player0 === socket.id ? 0 : 1][handSelection].costType === "blood" && 
                          room.hands[room.player0 === socket.id ? 0 : 1][handSelection].cost <= room.sacrifices.reduce((acc, val) => { //SIGILS - tripleblood
                            if (room.board[val].sigils.indexOf("tripleblood") > -1) {
                              return acc + 3;
                            } else {
                              return acc + 1;
                            }
                          }, 0))
                        )) 
                      { //empty slot - place selected card
                        placeSelectedCard(index);
                      } else if (val && val.card && ((val.card !== "dam" && val.card !== "chime") || val.sigils.indexOf("tripleblood") > -1 || val.sigils.indexOf("sacrificial") > -1)) { //toggle sacrifices for selected card, terrain cant be sacrificed
                        let newSac = room.sacrifices;
                        let dying = room.sacrifices.indexOf(index) > -1 
                        if (dying) {
                          newSac.splice(newSac.indexOf(index), 1);
                          setSendRoom({...room, sacrifices: newSac});
                        } else if (room.hands[room.player0 === socket.id ? 0 : 1][handSelection].costType === "bone" || 
                          room.hands[room.player0 === socket.id ? 0 : 1][handSelection].cost <= room.sacrifices.reduce((acc, val) => { //SIGILS - tripleblood
                            if (room.board[val].sigils.indexOf("tripleblood") > -1) {
                              return acc + 3;
                            } else {
                              return acc + 1;
                            }
                          }, 0)
                        ) { 
                          //stop unecessary killing
                        } else {
                          newSac.push(index);
                          setSendRoom({...room, sacrifices: newSac});
                        }
                      }
                    }
                  }}></img>
                </div>
              )
            }) : <></>}
          </div>
        
          {((room.player0 === socket.id && room.player0) || room.player1) && room.hands[room.player0 === socket.id ? 0 : 1] ? 
            <div style={{position: 'relative', marginBottom: "190px"}}> 
              {room.hands[room.player0 === socket.id ? 0 : 1].map((card, index) => {
                let s = room.hands[room.player0 === socket.id ? 0 : 1].length
                let l = 295 - (index * 295/(s - 1));
                let m;

                handHover !== s-1 && index <= handHover ? m = 5 + (125 * s - 420)/(s - 1) : m = 0;
                handSelection !== s-1 && index <= handSelection && handHover !== handSelection ? m = m + 5 + (125 * s - 420)/(s - 1) : m = m;

                return <div 
                  style={{position:"absolute", left: l, paddingLeft: m, top:`${index === handSelection ? "-10" : "0"}px`}}
                  onMouseEnter={() => setHandHover(index)}
                  onMouseLeave={() => setHandHover(-1)}
                  onClick={() => {
                    index === handSelection ? setHandSelection(-1) : setHandSelection(index)
                    setSendRoom({...room, sacrifices: []});
                  }}
                >
                  <Card val={card}/>
                </div>
              })}
            </div>
          : <></>
          }

          {room.gameState === (room.player0 === socket.id ? "draw0" : "draw1") ? 
            <div>
              <div className='cardContainer' onClick={() => {
                if (draw.length <= 0) {return}
                let newHands = room.hands;
                let drawnCard = structuredClone(draw[0]);
                let randomIndex = drawnCard.sigils.indexOf("randomability"); //SIGILS - randomability
                if (randomIndex >= 0) {
                  drawnCard.sigils.splice(randomIndex, 1, allSigils[Math.floor(Math.random() * allSigils.length)])
                }
                drawnCard.clone = structuredClone(drawnCard); //FIXME? - all cards now have clones. Corresponding else statements / use of card "indexes" are redundant
                newHands[room.player0 === socket.id ? 0 : 1].push(drawnCard);
                let newDraw = draw;
                newDraw.splice(0, 1);
                if (newDraw.length === 0) { //when the draw pile runs dry, reshuffle the deck in
                  setDraw(shuffleArray(room.decks[room.player0 === socket.id ? 0 : 1]));
                } else {
                  setDraw(newDraw)
                }
                setSendRoom({...room, hands: newHands, gameState: (room.player0 === socket.id ? "play0" : "play1")})
              }}>
                {draw.map((card, index) => {
                  let s = draw.length
                  let t = 20 - index * 20 / (s-1);
                  return <img src='/card_back.png' alt='card back' className='card cardBacking' style={{top: t}}></img>
                })}
              </div> 
              <div className='cardContainer' onClick={(() => {
                let newHands = room.hands;
                newHands[room.player0 === socket.id ? 0 : 1].push({
                  card: "squirrel",
                  costType: "bone",
                  cost: 0,
                  sigils: [],
                  damage: 0,
                  health: 1
                });
                setSendRoom({...room, hands: newHands, gameState: (room.player0 === socket.id ? "play0" : "play1")})
              })}>
                  {[...Array(8)].map((card, index) => {
                    let s = 8
                    let t = 20 - index * 20 / (s-1) - 190;
                    return <img src='/card_back_squirrel.png' alt='card back' className='card cardBacking' style={{top: t, left:"125px"}}></img>
                  })}
                </div>
            </div>
          : <></>}
        
        </div>
        : <></>}

      </div> : <></>}
    </div>
  );
}

export default App;
