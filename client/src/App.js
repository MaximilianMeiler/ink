import {useState, useEffect} from 'react'
import './App.css';
import io from "socket.io-client";
import Card from './Card';
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
        simulateActivityLog(newRoom);
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
    console.log("simulating room", newRoom)

    newRoom.activityLog.forEach((entry) => {
      //TODO: add animations
      if (entry.action === "attack") {
        let target = (entry.index + 4) % 8; //0>4, 3>7, 4>0, 7->3
        if (newRoom.board[target]) {
          newBoard[target].health -= newBoard[entry.index].damage /2; //have to half this for some reason
          if (newBoard[target].health <= 0) {
            newBones[target < 4 ? 1 : 0]++;
            newBoard[target] = null;
          }
        } else {
          newScale += newRoom.board[entry.index].damage * (target < 4 ? 1 : -1);
        }
      }
    })

    console.log("new room after simulation",{...newRoom, board: newBoard, scale: newScale, bones: newBones, gameState: (newRoom.gameState === "simulating0" ? "draw1" : "draw0")})
    setRoom({...newRoom, board: newBoard, scale: newScale, bones: newBones, gameState: (newRoom.gameState === "simulating0" ? "draw1" : "draw0"), activityLog: []}) //TEMP
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
                          newDecks[room.player0 === socket.id ? 0 : 1].push(card);
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
          <div>{room.scale}</div>
          <div>Bones: P0-{room.bones[0]} P1-{room.bones[1]}</div>

          <div className='gameGrid'>
            {room.board ? room.board.map((val, index) => {
              let trueIndex = index;
              if (room.player0 !== socket.id) { //if player B, flip board
                index = (index + 4) % 8;
                val = room.board[index]
              }

              return (
                <div className='gameSlot'>
                  <img src='/card_slot.png' alt='empty card slot' className='card cardSlot' style={trueIndex < 4 ? {transform: 'rotate(180deg)'} : {}}></img>
                  {val && val.card ? 
                    <div style={{marginTop:"18px", marginLeft:"14.5px"}}>
                      <Card val={val}/>
                    </div>
                  : <></>
                  }
                  {room.sacrifices.indexOf(index) > -1 ?
                    <img src='./sacrifice_mark.png' alt='sacrifice mark' className='card sacrificeMark'></img>
                  : <></>
                  }
                  <img src='/card_slot.png' alt='empty card slot' className='card cardSlot' style={{zIndex:"50", opacity:"0"}} onClick={() => {
                    if (trueIndex > 3 && handSelection > -1 && room.gameState === (room.player0 === socket.id ? "play0" : "play1")) { //interactable slots
                      if ((!val || !val.card) &&
                        (
                          (room.hands[room.player0 === socket.id ? 0 : 1][handSelection].costType === "bone" && 
                          room.hands[room.player0 === socket.id ? 0 : 1][handSelection].cost <= room.bones[room.player0 === socket.id ? 0 : 1])
                        || 
                          (room.hands[room.player0 === socket.id ? 0 : 1][handSelection].costType === "blood" && 
                          room.hands[room.player0 === socket.id ? 0 : 1][handSelection].cost <= room.sacrifices.length)
                        )) 
                      { //empty slot - place selected card
                        let newBones = room.bones;
                        newBones[room.player0 === socket.id ? 0 : 1] += room.sacrifices.length; //change for bony boys
                        let newBoard = room.board;
                        newBoard[index] = room.hands[room.player0 === socket.id ? 0 : 1][handSelection]; //place selected card
                        room.sacrifices.forEach((i) => {
                          newBoard[i] = null; //kill sacrificial cards
                        });
                        let newHands = room.hands;
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
                health: 0
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
