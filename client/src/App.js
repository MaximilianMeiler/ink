import {useState, useEffect} from 'react'
import './App.css';
import io from "socket.io-client";
import Card from './Card';
const socket = io.connect("http://localhost:4000"); //socket.socket.sessionid

function App() {
  const [room, setRoom] = useState(null)
  const [handHover, setHandHover] = useState(-1)
  const [handSelection, setHandSelection] = useState(-1);
  const [draw, setDraw] = useState([]);
  const [discard, setDiscard] = useState([]);

  useEffect(() => {
    socket.on("serverUpdate", (newRoom) => {
      console.log("new room from server:", newRoom)
      setRoom(newRoom);

      if (newRoom.gameState === "roundStart0" && newRoom.player0 === socket.id) {
        setDraw(newRoom.decks[0]);
        setDiscard([]);
        newRoom.gameState = "roundStart1";
        setSendRoom(newRoom);
      }
      if (newRoom.gameState === "roundStart1" && newRoom.player1 === socket.id) {
        setDraw(newRoom.decks[1]);
        setDiscard([]);
        console.log("TEST ")
        newRoom.gameState = "draw0";
        setSendRoom(newRoom);
      }
    })
  }, [socket])

  function setSendRoom(newRoom) {
    socket.emit("clientUpdate", newRoom);
    setRoom(newRoom);
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
        <div onClick={() => {
          setSendRoom({...room, gameState: (room.player0 === socket.id ? "draw1" : "draw0"), sacrifices: []}); //swap turns
        }}>Ring Bell</div>
        
        <div className='gameGrid'>
          {room.board.map((val, index) => {
            let trueIndex = index;
            if (room.player0 !== socket.id) { //if player B, flip board
              index = (index + 4) % 8;
              val = room.board[index]
            }

            return (
              <div className='gameSlot'>
                <img src='/card_slot_heightmap.png' alt='empty card slot' className='card cardSlot' style={trueIndex < 4 ? {transform: 'rotate(180deg)'} : {}}></img>
                {val && val.card ? 
                  <div style={{marginTop:"8px", marginLeft:"7.5px"}}>
                    <Card val={val}/>
                  </div>
                : <></>
                }
                {room.sacrifices.indexOf(index) > -1 ?
                  <img src='./sacrifice_mark.png' alt='sacrifice mark' className='card sacrificeMark'></img>
                : <></>
                }
                <img src='/card_slot_heightmap.png' alt='empty card slot' className='card cardSlot' style={{zIndex:"50", opacity:"0"}} onClick={() => {
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
          })}
        </div>

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
              setDraw(newDraw)
              setSendRoom({...room, hands: newHands, gameState: "play0"})
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
              setSendRoom({...room, hands: newHands, gameState: "play0"})
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
