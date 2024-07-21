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
      <div className='gameGrid'>
        {room ? room.board.map((val, index) => {
          let trueIndex = index;
          if (room.playerA !== socket.id) { //if player B, flip board
            index = (index + 4) % 8;
            val = room.board[index]
          }

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
              }} style={trueIndex < 4 ? {transform: 'rotate(180deg)'} : {}}></img>
              {val && val.card ? 
                <div style={{marginTop:"8px", marginLeft:"7.5px"}}>
                  <Card val={val}/>
                </div>
              : <></>
              }
            </div>
          )
        }) : <></>}
      </div>

      {room && room.playerA && room.handA && room.playerA === socket.id ? 
        <div style={{position: 'relative'}}>
          {room.handA.map((card, index) => {
            let l = 295 - (index * 295/(room.handA.length - 1));
            let m;
            index <= handHover ? m = 5 + (125 * room.handA.length - 420)/(room.handA.length-1) : m = 0;
            index <= handSelection && handHover !== handSelection ? m = m + 5 + (125 * room.handA.length - 420)/(room.handA.length-1) : m = m;

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
      : room && room.playerB && room.handB ?
        <div>hello player B</div>
      : <></>
      }
    </div>
  );
}

export default App;
