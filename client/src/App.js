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

    newRoom.activityLog.forEach((entry) => {
      //TODO: add animations
      if (entry.action === "attack") {
        let target = (entry.index + 4) % 8; //0>4, 3>7, 4>0, 7->3
        let trueDamage = newBoard[entry.index].damage //SIGILS - buffneighbours,
          + (entry.index % 4 !== 0 && newBoard[entry.index-1] && newBoard[entry.index-1].sigils.indexOf("buffneighbours") >= 0 ? 1 : 0)
          + (entry.index % 4 !== 3 && newBoard[entry.index+1] && newBoard[entry.index+1].sigils.indexOf("buffneighbours") >= 0 ? 1 : 0)

        if (trueDamage < 1) {
          //do nothing
        } else if (newBoard[target] && (newBoard[entry.index].sigils.indexOf("flying") < 0 || newBoard[target].sigils.indexOf("reach") > -1)) { //SIGILS - flying, reach
          
          let shieldIndex = newBoard[target].sigils.indexOf("deathshield"); //SIGILS - deathshield
          if (shieldIndex > -1) {
            if (shieldIndex < newBoard[target].defaultSigils) {
              newBoard[target].defaultSigils--;
            }
            newBoard[target].sigils.splice(shieldIndex, 1);
          } else {
            newBoard[target].health -= trueDamage;
          }

          if (newBoard[target].sigils.indexOf("beesonhit") > -1) { //SIGILS - beesonhit
            let newSigils = Array.from(newBoard[target].sigils);
            newSigils.splice(newSigils.indexOf("beesonhit"), 1, "flying")
            newHands[target < 4 ? 1 : 0].push({ //newHands is never applied - is this all unnecessary and passed by reference????
              card: "bee",
              costType:"bone",
              cost: 0,
              sigils: newSigils,
              defaultSigils: 0,
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
          if (newBoard[target].health <= 0 || newBoard[entry.index].sigils.indexOf("deathtouch") > -1) { //SIGILS - deathtouch, gainattackkonkill
            newBones[target < 4 ? 1 : 0]++;
            if (newBoard[target].sigils.indexOf("drawcopyondeath") > -1) { //SIGILS - drawcopyondeath
              if (newBoard[target].clone) {
                newRoom.hands[target < 4 ? 1 : 0].push({...newBoard[target].clone, clone: newBoard[target].clone}) //screw it, just gonna change stuff straight through newRoom
              } else {
                newRoom.hands[target < 4 ? 1 : 0].push(newRoom.decks[target < 4 ? 1 : 0].find((c) => c.index === newBoard[target].index)) 
              }
            }
            let scavenging = 0; //SIGILS - opponentbones (stacks)
            let offset = target < 4 ? 4 : 0;
            for (let index = 0; index < 4; index++) {
              if (newBoard[index + offset] && newBoard[index + offset].sigils.indexOf("opponentbones") > -1) {
                scavenging++;
              }
            }
            newBones[target < 4 ? 0 : 1] += scavenging

            newBoard[target] = null;
            if (newBoard[entry.index].sigils.indexOf("gainattackonkill") > -1) {
              newBoard[entry.index].damage++;
            }
          }
        } else {
          newScale += trueDamage * (target < 4 ? 1 : -1);
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
          newBoard[entry.index].defaultSigils -= 1;
          newBoard[entry.index].sigils = newSigils;
        }
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
      console.log("new room after simulation",{...newRoom, board: newBoard, scale: newScale, bones: newBones, gameState: (newRoom.gameState === "simulating0" ? "draw1" : "draw0")})
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
                index <= handHover && hoverSection === 0 ? m = 5 + (125 * s - 420)/(s - 1) : m = 0;

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
                index <= handHover && hoverSection === 1 ? m = 5 + (125 * s - 420)/(s - 1) : m = 0;

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

        {(room.gameState !== "drafting" && room.gameState !== "awaitingPlayers") ? <div>
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
                      <Card val={{...val, //SIGILS - buffneighbours,
                        damage: val.damage 
                          + (index % 4 !== 0 && room.board[index-1] && room.board[index-1].sigils.indexOf("buffneighbours") >= 0 ? 1 : 0)
                          + (index % 4 !== 3 && room.board[index+1] && room.board[index+1].sigils.indexOf("buffneighbours") >= 0 ? 1 : 0)
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
                          room.hands[room.player0 === socket.id ? 0 : 1][handSelection].cost <= room.sacrifices.length)
                        )) 
                      { //empty slot - place selected card
                        let newBones = room.bones;
                        newBones[room.player0 === socket.id ? 0 : 1] += room.sacrifices.length; //fix - should be based on state and not socket id...
                        let scavenging = 0; //SIGILS - opponentbones (stacks), guarddog
                        let guarding = -1;
                        let offset = room.player0 === socket.id ? 0 : 4;
                        for (let i = 0; i < 4; i++) {
                          if (room.board[i + offset] && room.board[i + offset].sigils.indexOf("opponentbones") > -1) {
                            scavenging++;
                          }
                          if (room.board[i + offset] && room.board[i + offset].sigils.indexOf("guarddog") > -1 && guarding < 0) {
                            guarding = i + offset;
                          }
                        }
                        newBones[room.player0 === socket.id ? 1 : 0] += scavenging * room.sacrifices.length

                        if (room.hands[room.player0 === socket.id ? 0 : 1][handSelection].costType === "bone") {
                          newBones[room.player0 === socket.id ? 0 : 1] -= room.hands[room.player0 === socket.id ? 0 : 1][handSelection].cost;
                        }
                        let newBoard = room.board;
                        let damageBonus = 0;
                        let healthBonus = 0;
                        room.sacrifices.forEach((i) => {
                          if (newBoard[i].sigils.indexOf("morsel") > -1) { //SIGILS - morsel
                            damageBonus += newBoard[i].damage;
                            healthBonus += newBoard[i].health;
                          }
                          if (newBoard[i].sigils.indexOf("sacrificial") < 0) { //SIGILS - sacrificial
                            if (newBoard[i].sigils.indexOf("drawcopyondeath") > -1) { //SIGILS - drawcopyondeath
                              if (newBoard[i].clone) {
                                room.hands[room.player0 === socket.id ? 0 : 1].push({...newBoard[i].clone, clone: newBoard[i].clone}) //screw it, just gonna change stuff straight through newRoom
                              } else {
                                room.hands[room.player0 === socket.id ? 0 : 1].push(room.decks[room.player0 === socket.id ? 0 : 1].find((c) => c.index === newBoard[i].index)) 
                              }
                            }
                            newBoard[i] = null; //kill sacrificial cards
                          }
                        });
                        newBoard[index] = {
                                            ...room.hands[room.player0 === socket.id ? 0 : 1][handSelection], 
                                            damage: room.hands[room.player0 === socket.id ? 0 : 1][handSelection].damage + damageBonus,
                                            health: room.hands[room.player0 === socket.id ? 0 : 1][handSelection].health + healthBonus
                                          }; //place selected card
                        if (!newBoard[(index + 4) % 8]) { //rush over guarding cards to opposing spot
                          newBoard[(index + 4) % 8] = newBoard[guarding];
                          newBoard[guarding] = null;
                        }
                        let newHands = room.hands;
                        if (room.hands[room.player0 === socket.id ? 0 : 1][handSelection].sigils.indexOf("drawrabbits") > -1) { //SIGILS - drawrabbits
                          let newSigils = Array.from(room.hands[room.player0 === socket.id ? 0 : 1][handSelection].sigils);
                          newSigils.splice(newSigils.indexOf("drawrabbits"), 1);
                          newHands[room.player0 === socket.id ? 0 : 1].push({
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
                        } else if (room.hands[room.player0 === socket.id ? 0 : 1][handSelection].sigils.indexOf("drawant") > -1) { //SIGILS - drawant
                          let newSigils = Array.from(room.hands[room.player0 === socket.id ? 0 : 1][handSelection].sigils);
                          newSigils.splice(newSigils.indexOf("drawant"), 1);
                          newHands[room.player0 === socket.id ? 0 : 1].push({
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
                        newHands[room.player0 === socket.id ? 0 : 1].splice(handSelection, 1); //remove selected card from hand
                        setHandSelection(-1);

                        //place sacrificed cards in the discard pile?

                        setSendRoom({...room, sacrifices: [], bones: newBones, board: newBoard, hands: newHands});
                      } else if (val && val.card) { //toggle sacrifices for selected card
                        let newSac = room.sacrifices;
                        let dying = room.sacrifices.indexOf(index) > -1 
                        if (dying) {
                          newSac.splice(newSac.indexOf(index), 1);
                          setSendRoom({...room, sacrifices: newSac});
                        } else if (room.hands[room.player0 === socket.id ? 0 : 1][handSelection].costType === "bone" || room.sacrifices.length >= room.hands[room.player0 === socket.id ? 0 : 1][handSelection].cost) { 
                          //stop unecessary killing, change for goat
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
        </div>
        : <></>}
        

        

        {((room.player0 === socket.id && room.player0) || room.player1) && room.hands[room.player0 === socket.id ? 0 : 1] ? 
          <div style={{position: 'relative', marginBottom: "190px"}}> 
            {room.hands[room.player0 === socket.id ? 0 : 1].map((card, index) => {
              let s = room.hands[room.player0 === socket.id ? 0 : 1].length
              let l = 295 - (index * 295/(s - 1));
              let m;
              index <= handHover ? m = 5 + (125 * s - 420)/(s - 1) : m = 0;
              index <= handSelection && handHover !== handSelection ? m = m + 5 + (125 * s - 420)/(s - 1) : m = m;

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
              let drawnCard = draw[0];
              let randomIndex = drawnCard.sigils.indexOf("randomability"); //SIGILS - randomability
              if (randomIndex >= 0) {
                drawnCard.sigils.splice(randomIndex, 1, allSigils[Math.floor(Math.random() * allSigils.length)])
              }
              newHands[room.player0 === socket.id ? 0 : 1].push(draw[0]);
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

      </div> : <></>}
    </div>
  );
}

export default App;
