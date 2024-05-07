/* Snake Game Server
 Chris Girouard and Joe Bereswill

 */


//This code is based off of Professor Femisters 'FruitSmashServer.js' code. 

// Constants

// let ROWS_IN_GRID = 8;
// let COLS_IN_GRID = 10;
const HOST = "neptune.cse.lehigh.edu";
const PORT = 4040;
let gameOn = false;
let started = false;
// let grid = null;

// Copied from: https://www.geeksforgeeks.org/how-to-create-a-guid-uuid-in-javascript/
function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'
    .replace(/[xy]/g, function (c) {
      const r = Math.random() * 16 | 0,
        v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
}


/****************
 * Player Class *
 ****************/

class Player {
  constructor(login, game) {
    this.name = login;
    this.score = 0;
    this.gameOver = game;
  }

}

// PlayerList Class

class PlayerList {

  constructor() {
    this.players = new Array();
    this.id2index = {};
    this.name2id = {};
    this.socket2index = {};
  }

  updateScore(id) {
    const index = this.id2index[id];
    console.log(`updateScore: this.id2index[${id}] = ${index}`)
    console.log(`before: ${this.players[index].score}`)
    this.players[index].score += 10;
    console.log(`after: ${this.players[index].score}`)
    updateStatus();
  }

  getWinner(){
      let winner = this.players[0];
      if(this.players.length === 1)
          return winner;

      for(let i = 0; i < this.players.length; i++) {
        if(this.players[i].score > winner.score)
            winner = this.players[i];
      }
      return winner;
  }

  changeGOStatus(id) {
    const index = this.id2index[id];
    this.players[index].gameOver = true;
    console.log(`Player ${this.players[index].name} Game Over`);
  
    const allPlayersGameOver = this.players.every(player => player.gameOver);
    if (allPlayersGameOver) {
      console.log("All players are Game Over");
      return true;
    } else {
      console.log("Not all players are Game Over");
      return false;
    }
  }
  
  
  resetBoard(){
    this.players.forEach(player => {
      //console.log(player.gameOver);
        player.score = 0;
        player.gameOver = false;
    });
    updateStatus();
    gameOn = false;
  }

  add(player, socket) {
    this.players.push(player);
    const id = uuidv4();
    this.id2index[id] = this.players.length - 1;
    this.name2id[player.name] = id;
    this.socket2index[socket.id] = this.players.length -1;
    console.log(`PlayerList:add(${player.name} ${player.score} ${id} ${this.id2index[id]} ${this.name2id[player.name]})`)
  }

  remove(socketId){
    if(socketId === ""){
      console.log("Invalid socket ID for removal");
      return;
    }
    const playerIndex = this.socket2index[socketId];
    if (playerIndex === undefined) {
      console.log(`Player with socket ID ${socketId} not found.`);
      return;
    }
    const player = this.players.splice(playerIndex, 1)[0];
    delete this.id2index[player.id];
    delete this.name2id[player.name];
    delete this.socket2index[socketId];
    console.log(`PlayerList:remove(${player.name})`);
    
  }

  length() {
    return this.players.length;
  }

  getRandomId(){
    const randomIndex = Math.floor(Math.random() * this.players.length);
    const randId = this.players[randomIndex];
    return randId
  }

  onList(id) {
    return id in this.id2index;
  }

  getId(name) {
    if (name in this.name2id) return this.name2id[name]
    else return "";
  }

  getName(id) {
    if (id in this.id2index) {
      const idx = this.id2index[id];
      return this.players[idx].name;
    } else {
      return "";
    }
  }



  dump() {
    for (i = 0; i < this.players.length; ++i) {
      const player = this.players[i];
      console.log(`${player.name} ${player.score}`)
    }
  }

}

const snakePlayers = new PlayerList();

function processLogin(socket, loginname) {
  console.log(`loginname: ${loginname}`);
  console.log(`type = ${typeof loginname}`)
  if ((loginname == null) || ((typeof loginname) !== "string") ) {
    socket.emit("debug", `ERROR: loginname is not a string`)
    return;
  } 
  let filteredName = loginname.replace(/[^a-zA-Z0-9 ]/g, "");
  if (filteredName.length <= 0) {
    console.log(`processLogin: Empty name rejected. Original text = ${loginname}`);
    socket.emit("debug", `ERROR: Filtered user name is empty. Original name is ${loginname}`)
  } else {
    let id = snakePlayers.getId(filteredName);
    while (id != "") {
      filteredName += "*";
      id = snakePlayers.getId(filteredName);
    }
    if(started){
      snakePlayers.add(new Player(filteredName, true), socket);

    }
    else{
      snakePlayers.add(new Player(filteredName, false), socket);
    }
    const newid = snakePlayers.getId(filteredName);
    console.log(
      `processLogin: name= ${loginname} filtered name= ${filteredName} new id=${newid}`);
    socket.emit("debug", `INFO: User ${filteredName} logged in with id ${newid}`)
    socket.emit("loginresponse",
      {
        id: newid
      }
    );
    updateStatus();
  }
}




function updateStatus() {
  const tmp = snakePlayers.players.map((t) => t)
  tmp.sort((a, b) => b.score - a.score);
  io.sockets.emit("playerslistupdate", tmp);
}


// Create and fill the grid

// Load the required libraries

const express = require('express');
const { createServer } = require('http');
const { join } = require('path');
const { Server } = require('socket.io');

const app = express();

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept");
  next();
})

const server = createServer(app)
  ;
const io = new Server(server, {
  cors: {
    origin: "*"
  }
});


//https://stackoverflow.com/questions/951021/what-is-the-javascript-version-of-sleep
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}






// Listen for connections on PORT
server.listen(PORT, HOST, () => { console.log(`Server running at http://${HOST}:${PORT}/`); });

// Load the required libraries




// Socket.IO code for setting up connection and sending initial hand and player list.
io.on("connection",
  function (socket) {
    const address = socket.handshake.address;
    console.log(`New connection from ${address}`);

    socket.on("login", (loginname) => {
      processLogin(socket, loginname);
      console.log(`Number of players: ${snakePlayers.length()}`);
      if(snakePlayers.length() >= 2 && !started){
        started = true;
        sleep(1000);
        io.emit("matchmade", true); // Emit to all connected clients
      }
      
    })
  

    socket.on("eatpellet", (id) => {
        console.log(`processing pellet eaten: userid= ${id}`);
        //const name = snakePlayers.getName(id);
        snakePlayers.updateScore(id);
    })

    socket.on("powerdown", (id) => {
        console.log("opponent will power down!");
        let randId = snakePlayers.getRandomId();
        while(randId === id )
          randId = snakePlayers.getRandomId();

        io.emit("playerPD", randId);
    })

    socket.on("gameover", (id) => {
      const name = snakePlayers.getName(id);
      ///console.log(`Player ${name} is done!`);
      const done = snakePlayers.changeGOStatus(id);
      
      console.log(done);
      if(done){
        //console.log(name)
        const ret = snakePlayers.getWinner();
        const retName = ret.name;
        //console.log(retName);
        snakePlayers.resetBoard();
        io.emit("winner", retName);
        sleep(4000);
        io.emit("newgame", true);
      }
    })

    socket.on("disconnect", () => {
      snakePlayers.remove(socket.id);
      console.log(`player disconnected: ${socket.id}`);
      updateStatus();
    })

    
    updateStatus();
  }
);
