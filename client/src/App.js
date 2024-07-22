import {useState, useEffect} from 'react'
import './App.css';
import io from "socket.io-client";
import Card from './Card';
const socket = io.connect("http://localhost:4000"); //socket.socket.sessionid

function App() {
  const [room, setRoom] = useState(null)
  const [handHover, setHandHover] = useState(-1)
  const [handSelection, setHandSelection] = useState(-1);

  useEffect(() => {
    socket.on("serverUpdate", (newRoom) => {
      console.log("new room from server:", newRoom)
      setRoom(newRoom);
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
            setSendRoom({...room, gameState: (room.player0 === socket.id ? "turn1" : "turn0"), sacrifices: []}); //swap turns
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
                    if (trueIndex > 3 && handSelection > -1 && room.gameState === (room.player0 === socket.id ? "turn0" : "turn1")) { //interactable slots
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
        </div> : <></>}

      {room && ((room.player0 === socket.id && room.player0) || room.player1) && room.hands[room.player0 === socket.id ? 0 : 1] ? 
        <div style={{position: 'relative'}}>
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
              onClick={() => {index === handSelection ? setHandSelection(-1) : setHandSelection(index)}}
            >
              <Card val={card}/>
            </div>
          })}
        </div>
      : <></>
      }
    </div>
  );
}

export default App;
