import {useState, useEffect} from 'react'
import './App.css';
import io from "socket.io-client";
const socket = io.connect("http://localhost:4000");

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
      {room ? room.board.map((val, index) => {
        return <div onClick={() => {
          let newRoom = room;
          newRoom.board[index] = 0;
          setSendRoom(newRoom)
        }
        }>{val}</div>

        // return (
          
        // )
      }) : <></>}
    </div>
  );
}

export default App;
