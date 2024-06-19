import {useState, useEffect} from 'react'
import './App.css';
import io from "socket.io-client";
const socket = io.connect("http://localhost:4000");

function App() {
  const [board, setBoard] = useState([]) //sync'ed with server
  const [hand, setHand] = useState([])
  const [room, setRoom] = useState(null)

  useEffect(() => {
    socket.on("newServerBoard", (newBoard) => {
      setBoard(newBoard);
    })
  }, [socket])

  function setSendBoard(newBoard) {
    socket.emit("newClientBoard", newBoard, room);
    setBoard(newBoard)
  }

  return (
    <div className="App">
      <div style={{display: "flex"}}>
        <p>Join room: </p>
        <input type='text' id="roomInput"></input>
        <button onClick={() => {
          setRoom(document.getElementById('roomInput').value);
          socket.emit("clientRoomJoin", document.getElementById('roomInput').value)
        }}>Join</button>
        <button onClick={() => {
          setRoom(null);
          setBoard([]);
          if (room) {
            socket.emit("clientRoomLeave", room)
          }
        }}>Leave room</button>
      </div>
      <div>Room: {room}</div>
      {board.map((val, index) => {
        return <div onClick={() => setSendBoard(board.map((v, i) => {return i === index ? 0 : v}))}>{val}</div>
      })}
    </div>
  );
}

export default App;
