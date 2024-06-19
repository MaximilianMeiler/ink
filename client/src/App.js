import {useState, useEffect} from 'react'
import './App.css';
import io from "socket.io-client";
const socket = io.connect("http://localhost:4000");

function App() {
  const [board, setBoard] = useState([-1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1])

  useEffect(() => {
    socket.on("newServerBoard", (newBoard) => {
      setBoard(newBoard)
    })
  }, [socket])

  function setSendBoard(newBoard) {
    socket.emit("newClientBoard", newBoard);
    setBoard(newBoard)
  }

  return (
    <div className="App">
      {board.map((val, index) => {
        return <div onClick={() => setSendBoard(board.map((v, i) => {return i === index ? 0 : v}))}>{val}</div>
      })}
    </div>
  );
}

export default App;
