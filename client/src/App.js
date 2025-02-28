import {useState, useEffect} from 'react'
import './App.css';
import io from "socket.io-client";
import Card from './Card';
import {allCards, allSigils} from './cardList';
const socket = io.connect("https://isolated-cris-mmeiler-73d53aab.koyeb.app/"); //socket.socket.sessionid

function App() {
  const [room, setRoom] = useState(null)
  const [handHover, setHandHover] = useState(-1)
  const [hoverSection, setHoverSection] = useState(-1)
  const [handSelection, setHandSelection] = useState(-1);
  const [hoverHint, setHoverHint] = useState("");
  const [draw, setDraw] = useState([]);
  const [scribes, setScribes] = useState([{open: false, index: -1}, {open: false, index: -1}, 0])

  const calcTrueDamage = (board, index, bones, hands, recur = false) => {
    return Math.max(board[index].damage, //SIGILS - antdamage, belldamage, carddamage, mirrordamage, bonedamage
      board[index].sigils.indexOf("antdamage") > -1 ? [...Array(4)].reduce((acc, v, i) => acc + (board[i+(Math.floor(index / 4) * 4)] && board[i+(Math.floor(index / 4) * 4)].sigils.indexOf("antdamage") > -1 ? 1 : 0), 0) : 0, 
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
      newBoard[(index + 4) % 8] = newBoard[guarding]; //FIXME - this has to be animated manually
      newBoard[guarding] = null;
    }
    if (placedCard.sigils.indexOf("drawrabbits") > -1) { //SIGILS - drawrabbits
      let newSigils = Array.from(placedCard.sigils);
      newSigils.splice(newSigils.indexOf("drawrabbits"), 1);
      newHands[newRoom.player0 === socket.id ? 0 : 1].push({
        card: "rabbit",
        name: "Rabbit",
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
          name: "Rabbit",
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
      if (newSigils.indexOf("antdamage") > 0) {newSigils.splice(0, 0, "antdamage")};
      newHands[newRoom.player0 === socket.id ? 0 : 1].push({
        card: "ant",
        name: "Worker Ant",
        costType:"blood",
        cost: 1,
        sigils: newSigils,
        defaultSigils: 1,
        damage: 0,
        health: 2,
        tribe: "insect",
        rare: false,
        clone: {
          card: "ant",
          name: "Worker Ant",
          costType:"blood",
          cost: 1,
          sigils: newSigils,
          defaultSigils: 0,
          damage: 0,
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
        name: "Chime",
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
          name: "Chime",
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
        name: "Dam",
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
          name: "Dam",
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
      } else if (newRoom.gameState === "roundStart1" && newRoom.player1 === socket.id) {
        setDraw(shuffleArray(newRoom.decks[1]));
        newRoom.gameState = newRoom.round % 2 === 0 ? "draw0" : "draw1";
        setSendRoom(newRoom);
      } else {
        setRoom(newRoom);
      }
    })
  }, [socket])

  useEffect(() => {
    if (room && (room.gameState === "simulating0" || room.gameState === "simulating1")) {
      console.log("simulating...", structuredClone(room.animationLog))
      if (room.animationLog.length > 0) {
        let anim = room.animationLog[0];
        let flip = (room.player1 === socket.id)
        let trueIndex = (anim.index + (flip ? 4 : 0)) % 8
        if (anim.action === "lunge") {
          document.querySelector(".gameGrid").children.item(trueIndex).children.item(1).style.setProperty("margin-top", `${18 + (trueIndex<4 ? 113 : -113)}px`)
          document.querySelector(".gameGrid").children.item(trueIndex).children.item(1).style.setProperty("margin-left", `${14.5 + (anim.aim)*154}px`) 
          document.querySelector(".gameGrid").children.item(trueIndex).children.item(1).style.setProperty("z-index", `10`)
          setTimeout(() => {
            document.querySelector(".gameGrid").children.item(trueIndex).children.item(1).style.setProperty("margin-top", `18px`)
            document.querySelector(".gameGrid").children.item(trueIndex).children.item(1).style.setProperty("margin-left", `14.5px`)
            setTimeout(() => {
              document.querySelector(".gameGrid").children.item(trueIndex).children.item(1).style.setProperty("z-index", `0`) 

              let newLog = room.animationLog;
              newLog.splice(0, 1);
              setRoom({...room, animationLog: newLog})
            }, 100)
          }, 100)
        } else if (anim.action === "updateScale") {
          document.querySelector(".scaleArrow").style.setProperty("top", -22+6 + (5-Math.min(Math.max((anim.scale * (room.player0 === socket.id ? 1 : -1)), -5), 5))*(44))
          setTimeout(() => {
            let temp = anim.scale
            let newLog = room.animationLog;
            newLog.splice(0, 1);
            setRoom({...room, animationLog: newLog, scale: temp});
          }, 200)
        } else if (anim.action === "updateCard") { //todo: create death/place animations
          let newBoard = room.board;
          newBoard[anim.index] = anim.card;

          let newLog = room.animationLog;
          newLog.splice(0, 1);
          setRoom({...room, animationLog: newLog, board: newBoard})
        } else if (anim.action === "updateHand") { //todo: create add/remove animations
          let newHands = room.hands;
          if (anim.index !== undefined) {
            newHands[anim.player].splice(anim.index, 1); 
          } else {
            newHands[anim.player].push(anim.card)
          }

          let newLog = room.animationLog;
          newLog.splice(0, 1);
          setRoom({...room, animationLog: newLog, hands: newHands})
        } else if (anim.action === "shift") {
          document.querySelector(".gameGrid").children.item(trueIndex).children.item(1).style.setProperty("margin-left", `${14.5 + (anim.target - anim.index)*154}px`)
          document.querySelector(".gameGrid").children.item(trueIndex).children.item(1).style.setProperty("z-index", `10`)
          setTimeout(() => {
            let newBoard = room.board;
            newBoard[anim.target] = structuredClone(newBoard[anim.index])
            newBoard[anim.index] = null;

            
            let temp = document.querySelector(".gameGrid").children.item(trueIndex).children.item(1).style.getPropertyValue("transition");
            document.querySelector(".gameGrid").children.item(trueIndex).children.item(1).style.setProperty("transition", ``)
            document.querySelector(".gameGrid").children.item(trueIndex).children.item(1).style.setProperty("margin-left", `14.5px`)
            document.querySelector(".gameGrid").children.item(trueIndex).children.item(1).style.setProperty("transition", temp)
            document.querySelector(".gameGrid").children.item(trueIndex).children.item(1).style.setProperty("z-index", `0`) 

            let newLog = room.animationLog;
            newLog.splice(0, 1);
            setRoom({...room, animationLog: newLog})
          }, 100)
        } else if (anim.action === "updateBones") {
          let newBones = room.bones;
          newBones[anim.player] += anim.count;

          let newLog = room.animationLog;
          newLog.splice(0, 1);
          setRoom({...room, animationLog: newLog, bones: newBones})
        } else if (anim.action === "flip") {
          
          document.querySelector(".gameGrid").children.item(trueIndex).children.item(1).style.setProperty("transform", `rotateY(90deg)`)
          setTimeout(() => {

            let newBoard = room.board;
            newBoard[anim.index] = anim.card;

            let newLog = room.animationLog;
            newLog.splice(0, 1);
            setRoom({...room, animationLog: newLog, board: newBoard})

            document.querySelector(".gameGrid").children.item(trueIndex).children.item(1).style.setProperty("transform", `rotateY(0deg)`)
          }, 200)
          
        } else if (anim.action === "newDeck") {
          let newDecks = room.decks;
          newDecks[anim.player] = anim.deck;

          let newLog = room.animationLog;
          newLog.splice(0, 1);
          setRoom({...room, animationLog: newLog, decks: newDecks})
        } else { //this should never run but it prevents the game from hanging
          let newLog = room.animationLog;
          newLog.splice(0, 1);
          setRoom({...room, animationLog: newLog})
        }

      } else {
        //check if the round ends
        if (room.scale * (room.gameState === "simulating0" ? 1 : -1) <= -5) {
          //restart game if scale is tipped at end of turn
          setSendRoom({...room, 
            gameState:"drafting", 
            board: [null, null, null, null, null, null, null, null], 
            scale: 0,
            lit0: true,
            lit1: true,
            animationLog: [],
            hands: [[],[]],
            bones: [0, 0],
            sacrifices: [],
            draft: {
              phase: -1, //we need to use setRoom here so the backend gives us cards
              options: []
          }})
        } else {
          setRoom({...room, gameState: (room.gameState === "simulating0" ? "draw1" : "draw0"), animationLog: []}) //TEMP
        }
      }
    }
  }, [room])


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

  let blankCard = {
    card: "blank",
    name: "Skip draw",
    costType: "bone",
    cost: 0,
    sigils: [],
    damage: -1,
    health: -1
  }

  return (
    <div className="App">

      {room ? <div>
        
        <div style={{display: "flex", justifyContent: "space-between", alignItems: "center", padding:"10px", gap: "10px", maxHeight: "27.5px"}}>
          <div>{hoverHint}</div>
          <div style={{display: "flex", alignItems: "center", gap: "10px"}}>
            <div>Room: {room ? room.id : ""}</div>
            <button onClick={() => {
              if (room) {
                socket.emit("clientRoomLeave", room.id)
              }
              setRoom(null);
            }}>Leave room</button>
          </div>
        </div>

        {(room.gameState === "awaitingPlayers") ? <div>
          Waiting for other players...
        </div> : <></>}

        {(room.gameState === "drafting") ? 
          <div>
            <div>Drafts remaining: {2*Math.min(room.round, 4) - Math.floor(room.draft.phase / 3)}</div>
            <div style={{position: 'relative', paddingTop: "190px"}}> 
              {room.decks[room.player0 === socket.id ? 1 : 0].map((card, index) => {
                let s = room.decks[room.player0 === socket.id ? 1 : 0].length
                let l = 295 - (index * 295/(s - 1));
                let m;
                handHover !== s-1 && index <= handHover && hoverSection === 0 ? m = 5 + (125 * s - 420)/(s - 1) : m = 0;

                return <div 
                  style={{position:"absolute", left: l, paddingLeft: m, top:`${index === handSelection ? "-10" : "0"}px`, transition: "padding .1s ease-in-out"}}
                  onMouseEnter={() => {setHandHover(index); setHoverSection(0);}}
                  onMouseLeave={() => {setHandHover(-1); setHoverSection(-1);}}
                >
                  <Card val={card} setHoverHint={setHoverHint}/>
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
                        <Card val={card} setHoverHint={setHoverHint}/>
                      </div>
                      <img src='/card_slot.png' alt='empty card slot' className='card cardSlot' style={{zIndex:"50", opacity:"0"}} onClick={() => {
                        if (room.draft.phase % 2 === (room.player0 === socket.id ? 0 : 1)) {
                          let newDecks = room.decks;
                          let newIndex = newDecks[room.player0 === socket.id ? 0 : 1].reduce((acc, val) => {return Math.max(acc, val.index)}, -1) + 1
                          newDecks[room.player0 === socket.id ? 0 : 1].push({...card, index: newIndex});
                          let newDraw = room.draft;
                          newDraw.options[index] = null;
                          if (newDraw.phase === (2 * Math.min(room.round, 4) * 3 - 2)) { //4, 10, etc
                            setSendRoom({...room, decks: newDecks, gameState: "scribing"})
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
                  {room.draft.phase % 2 === (room.player0 === socket.id ? 0 : 1) ? <Card val={blankCard} setHoverHint={setHoverHint}/> : <></>}
                </div>
                <img src='/card_slot.png' alt='empty card slot' className='card cardSlot' style={{zIndex:"50", opacity:"0"}} onClick={() => {
                  if (room.draft.phase % 2 === (room.player0 === socket.id ? 0 : 1)) {
                    if (room.draft.phase === (2 * Math.min(room.round, 4) * 3 - 2)) {
                      setSendRoom({...room, gameState: "scribing"})
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
                  style={{position:"absolute", left: l, paddingLeft: m, top:`${index === handSelection ? "-10" : "0"}px`, transition: "padding .1s ease-in-out"}}
                  onMouseEnter={() => {setHandHover(index); setHoverSection(1);}}
                  onMouseLeave={() => {setHandHover(-1); setHoverSection(-1);}}
                >
                  <Card val={card} setHoverHint={setHoverHint}/>
                </div>
              })}
            </div>
          </div>
        : <></>}

        {(["draw0", "draw1", "play0", "play1", "roundStart0", "roundStart1", "simulating0", "simulating1"].indexOf(room.gameState) > -1) ? <div>

          <div className='gameBoard'>
            <div className='bellArea'>
              <div className='scaleBack'></div>
              {[...Array(11)].map((v,i) => <div className='scaleSlot' style={{top: i*44, backgroundColor: i === 0 ? 'darkgreen' : i === 10 ? 'darkred' : 'black'}}></div>)}
              <div className='bellHead' onClick={() => {
              // setSendRoom({...room, gameState: (room.player0 === socket.id ? "draw1" : "draw0"), sacrifices: []}); //swap turns
              if (room.gameState === (room.player0 === socket.id ? "play0" : "play1")) {
                socket.emit("bellRung", room.id);
              }
              }}>
                <img src='/ability_belldamage.png' alt='bell icon'/>
              </div>
              <div className='scaleArrow' style={{top: -22+6 + (5-Math.min(Math.max((room.scale * (room.player0 === socket.id ? 1 : -1)), -5), 5))*(44)}}>{Math.abs(room.scale) > 5 ? `+${Math.abs(room.scale)-5}` : ""}</div>
            </div>

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
                      <div style={{position: "relative", marginTop:"18px", marginLeft:"14.5px", transition: "margin-top .1s ease-out, margin-left .1s ease-out, transform .2s"}}>
                        <Card val={{...val,
                          damage: calcTrueDamage(room.board, index, room.bones, room.hands)
                        }} setHoverHint={setHoverHint}/>
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
                        } else if (val && val.card && ((val.card !== "dam" && val.card !== "dausbell") || val.sigils.indexOf("tripleblood") > -1 || val.sigils.indexOf("sacrificial") > -1 || val.sigils.indexOf("morsel") > -1)) { //toggle sacrifices for selected card, terrain cant be sacrificed
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

            <div className='boneDisplay'>
              <img src='/starterdeck_icon_bones.png' style={{filter: "brightness(0%)"}} alt='Bone count'/>
              &nbsp;x {room.bones[room.player0 === socket.id ? 0 : 1]}
            </div>
          </div>
        
          <div style={{height: "0px"}}>
            {((room.player0 === socket.id && room.player0) || room.player1) && room.hands[room.player0 === socket.id ? 0 : 1] ? 
              <div className='handContainer'> 
                {room.hands[room.player0 === socket.id ? 0 : 1].map((card, index) => {
                  let s = room.hands[room.player0 === socket.id ? 0 : 1].length
                  let l = 295 - (index * 295/(s - 1));
                  let m;

                  handHover !== s-1 && index <= handHover ? m = 5 + (125 * s - 420)/(s - 1) : m = 0;
                  handSelection !== s-1 && index <= handSelection && handHover !== handSelection ? m = m + 5 + (125 * s - 420)/(s - 1) : m = m;

                  return <div 
                    style={{position:"absolute", left: l, paddingLeft: m, top:`${index === handSelection ? "-10" : "0"}px`, transition: "padding .1s ease-in-out, top .05s ease-in-out"}}
                    onMouseEnter={() => setHandHover(index)}
                    onMouseLeave={() => setHandHover(-1)}
                    onClick={() => {
                      index === handSelection ? setHandSelection(-1) : setHandSelection(index)
                      setSendRoom({...room, sacrifices: []});
                    }}
                  >
                    <Card val={card} setHoverHint={setHoverHint}/>
                  </div>
                })}
              </div>
            : <></>
            }

            {room.gameState === (room.player0 === socket.id ? "draw0" : "draw1") ? 
              <div className='drawContainer'>
                <div className='cardContainer' onClick={() => {
                  if (draw.length <= 0) {return}
                  let newHands = room.hands;
                  let drawnCard = structuredClone(draw[0]);
                  let randomIndex = drawnCard.sigils.indexOf("randomability"); //SIGILS - randomability
                  if (randomIndex >= 0) {
                    //FIXME - this should not be done client side
                    drawnCard.sigils.splice(randomIndex, 1, Object.keys(allSigils)[Math.floor(Math.random() * allSigils.length-9)]) //update when new sigils added
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
                    name: "Squirrel",
                    costType: "bone",
                    cost: 0,
                    sigils: [],
                    damage: 0,
                    health: 1,
                    clone: {
                      card: "squirrel",
                      name: "Squirrel",
                      costType: "bone",
                      cost: 0,
                      sigils: [],
                      damage: 0,
                      health: 1,
                    }
                  });
                  setSendRoom({...room, hands: newHands, gameState: (room.player0 === socket.id ? "play0" : "play1")})
                })}>
                    {[...Array(8)].map((card, index) => {
                      let s = 8
                      let t = 20 - index * 20 / (s-1);
                      return <img src='/card_back_squirrel.png' alt='card back' className='card cardBacking' style={{top: t, left:"0px"}}></img>
                    })}
                  </div>
              </div>
            : <></>}
          </div>
        
        </div>
        : <></>}

        {(room.gameState === "scribing") ? <div>
          <div>Inscriptions remaining: {Math.min(room.round, 4) - scribes[2]}</div>
          <div className='inscGrid'>
            <div>Select Sacrifice</div>
            <div>Select Host</div>
            <div style={{color: "darkred"}}>{scribes[0].index === -1 ? "Skip" : scribes[1].index === -1 ? "Remove" : "Inscribe"}</div>
            <div className='gameSlot'>
              <img src='/card_slot_sacrifice.png' alt='empty sacrifice slot' className='card cardSlot'></img>
              <div style={{marginTop:"18px", marginLeft:"14.5px"}}>
                {scribes[0].index !== -1 ? <Card val={room.decks[room.player0 === socket.id ? 0 : 1][scribes[0].index]} setHoverHint={setHoverHint}/> : <></>}
              </div>
              <img src='/card_slot.png' alt='empty card slot' className='card cardSlot' style={{zIndex:"50", opacity:"0"}} onClick={() => {
                setScribes([{open: !scribes[0].open, index: scribes[0].index}, {open: false, index: scribes[1].index}, scribes[2]]);
              }}></img>
            </div>
            <div className='gameSlot'>
              <img src='/card_slot_host.png' alt='empty host slot' className='card cardSlot'></img>
              <div style={{marginTop:"18px", marginLeft:"14.5px"}}>
              {scribes[1].index !== -1 ? <Card val={room.decks[room.player0 === socket.id ? 0 : 1][scribes[1].index]} setHoverHint={setHoverHint}/> : <></>}
              </div>
              <img src='/card_slot.png' alt='empty card slot' className='card cardSlot' style={{zIndex:"50", opacity:"0"}} onClick={() => {
                setScribes([{open: false, index: scribes[0].index}, {open: !scribes[1].open, index: scribes[1].index}, scribes[2]]);
              }}></img>
            </div>
            <div className='gameSlot'>
              <img src='/card_slot_right.png' alt='continue button' className='card cardSlot'></img>
              <img src='/card_slot.png' alt='empty card slot' className='card cardSlot' style={{zIndex:"50", opacity:"0"}} onClick={() => {
                let newDecks = room.decks;
                if (scribes[0].index !== -1) {
                  let newDeck = room.decks[room.player0 === socket.id ? 0 : 1];
                  if (scribes[1].index !== -1) {
                    newDeck[scribes[1].index].sigils = newDeck[scribes[1].index].sigils.concat(newDeck[scribes[0].index].sigils)
                  }
                  newDeck.splice(scribes[0].index, 1);

                  newDecks[room.player0 === socket.id ? 0 : 1] = newDeck;
                  setRoom({...room, decks: newDecks})
                }
                let inscribedCount = scribes[2]+1;
                setScribes([{open: false, index: -1}, {open: false, index: -1}, scribes[2]+1]);
                
                if (inscribedCount === room.round) {
                  socket.emit("newDeck", {...room, decks: newDecks});
                  setRoom({...room, gameState: "awaitingPlayers"}) //this will never be sent to the backend
                  setScribes([{open: false, index: -1}, {open: false, index: -1}, 0]);
                }
              }}></img>
            </div>
          </div>

          {scribes[0].open || scribes[1].open ? 
          <div style={{position: 'relative', paddingTop: "190px", marginLeft: "calc(50% - 231px + 14.5px)"}}> 
            {room.decks[room.player0 === socket.id ? 0 : 1].filter((card,i) => card.sigils.length === card.defaultSigils && i !== scribes[0].index && i !== scribes[1].index).concat({...blankCard, name: "None"}).map((card, index) => {
              let s = room.decks[room.player0 === socket.id ? 0 : 1].filter((card,i) => card.sigils.length === card.defaultSigils && i !== scribes[0].index && i !== scribes[1].index).length + 1
              let l = 295 - (index * 295/(s - 1));
              let m;
              handHover !== s-1 && index <= handHover && hoverSection === 0 ? m = 5 + (125 * s - 420)/(s - 1) : m = 0;

              return <div 
                style={{position:"absolute", left: l, paddingLeft: m, top:`${index === handSelection ? "-10" : "0"}px`, transition: "padding .1s ease-in-out, top .05s ease-in-out"}}
                onMouseEnter={() => {setHandHover(index); setHoverSection(0);}}
                onMouseLeave={() => {setHandHover(-1); setHoverSection(-1);}}
                onClick={() => {
                  setScribes([{open: false, index: scribes[0].open ? room.decks[room.player0 === socket.id ? 0 : 1].indexOf(card) : scribes[0].index}, 
                              {open: false, index: scribes[1].open ? room.decks[room.player0 === socket.id ? 0 : 1].indexOf(card) : scribes[1].index}, scribes[2]])
                }}
              >
                <Card val={card} setHoverHint={setHoverHint}/>
              </div>
            })}
          </div> : <></>}

        </div> : <></>}

      </div> : <div style={{display: "flex", alignItems: "center", justifyContent: "center", height:"100vh", flexDirection: "column"}}>
        <img src='logo.png' alt='Inscryption Online logo' style={{scale: "2", marginBottom: "40px"}}></img>
        <div>Welcome to Inscryption Online!</div>
        <div>To get started, enter a room code to create/join a room:</div>

        <div style={{display: "flex", alignItems: "center", marginTop: "20px"}}>
          <div style={{fontSize: "30px"}}>&nbsp;Join room:&nbsp;</div>
          <input type='text' id="roomInput" style={{fontSize: "30px"}}></input>
          <button onClick={() => {
            if (room) {
              socket.emit("clientRoomLeave", room.id)
            }
            socket.emit("clientRoomJoin", document.getElementById('roomInput').value)
          }} style={{fontSize: "30px"}}>Join</button>
        </div>
      </div>}
    </div>
  );
}

export default App;
