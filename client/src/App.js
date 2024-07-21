import {useState, useEffect} from 'react'
import './App.css';
import io from "socket.io-client";
const socket = io.connect("http://localhost:4000"); //socket.socket.sessionid

function App() {
  const [board, setBoard] = useState([]) //sync'ed with server
  const [hand, setHand] = useState([])
  const [room, setRoom] = useState(null)

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
      <div className='gameGrid'>
        {room ? room.board.map((val, index) => {
          return (
            <div className='gameSlot'>
              <img src='/card_slot_heightmap.png' alt='empty card slot' className='card cardSlot' onClick={() => {
                let newRoom = room;
                newRoom.board[index] = {
                  card: "beehive",
                  costType: "blood",
                  cost: 1,
                  sigils: ["beesonhit"],
                  damage: 0,
                  health: 2
                };
                setSendRoom(newRoom)
              }}></img>
              {val && val.card ? 
                <div>
                  <img src='/card_empty_sprite.png' alt='blank card' className='card cardBacking'></img>
                  <div className='card cardHeader'>{val.card}</div>
                  <img src={`/portrait_${val.card}.png`} alt={`${val.card} portrait`} className='card cardPortrait'></img>
                  <img src={`/cost_${val.cost}${val.costType}.png`} alt={`${val.card} cost`} className='card cardCost'></img>
                  <div className='card cardDamage'>{val.damage}</div>
                  <div className='card cardHealth'>{val.health}</div>
                  {val.sigils && val.sigils.length > 0 ? 
                    <img src={`/ability_${val.sigils[0]}.png`} alt={`${val.sigils[0]} sigil`} className='card cardSigil1'></img>
                  : val.sigils && val.sigils.length > 1 ?
                    <></>
                  : val.sigils && val.sigils.length > 2 ?
                    <></>
                  : val.sigils && val.sigils.length > 3 ?
                    <></>
                  : <></>
                  }
                </div>
              : <></>
              }
            </div>
          )
        }) : <></>}
      </div>
    </div>
  );
}

export default App;
