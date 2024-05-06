/* FruitSmash Game Server
 Chris Girouard and Joe Bereswill

 */

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

// function createGrid() {
//   grid = new Array(8);
//   let r = 0, c = 0;
//   for (r = 0; r < 8; ++r) {
//     grid[r] = new Array(10);
//     for (c = 0; c < 10; ++c)
//       grid[r][c] = 0;
//   }
// }

// function initGrid() {
//   let r = 0, c = 0;
//   for (r = 0; r < 8; ++r) {
//     for (c = 0; c < 10; ++c)
//       grid[r][c] = Math.floor(Math.random() * 7) + 1;
//   }
// }

// function log(fcn, ctx, e) {
//   console.log(fcn + ': Error on input (' + ctx + ') ' + e.toString());
// }

/****************
 * Player Class *
 ****************/

class Player {
  constructor(login) {
    this.name = login;
    this.score = 0;
    this.gameOver = false;
  }
}

// PlayerList Class

class PlayerList {

  constructor() {
    this.players = new Array();
    this.id2index = {};
    this.name2id = {};
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

  add(player) {
    this.players.push(player);
    const id = uuidv4();
    this.id2index[id] = this.players.length - 1;
    this.name2id[player.name] = id;
    console.log(`PlayerList:add(${player.name} ${player.score} ${id} ${this.id2index[id]} ${this.name2id[player.name]})`)
  }

  remove(id){
    const playerIndex = this.id2index[id];
    const player = this.players.splice(playerIndex, 1)[0];
    delete this.id2index[id];
    delete this.name2[player.name];
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
    snakePlayers.add(new Player(filteredName));
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

// function replaceTriple(row1, col1, row2, col2, row3, col3) {
//   grid[row1][col1] = Math.floor(Math.random() * 7) + 1;
//   grid[row2][col2] = Math.floor(Math.random() * 7) + 1;
//   grid[row3][col3] = Math.floor(Math.random() * 7) + 1;
// }

// function isScore(image1Col, image1Row, image2Col, image2Row) {
//   if (image1Col < 0 || image1Col > 9 || image2Col < 0 || image2Col > 9 || 
//       image1Row < 0 || image1Row > 7 || image2Row < 0 || image2Row > 7) {
//     socket.emit("debug", `ERROR: row and/or col numbers out of range.`);
//     return false;
//   }

// }


/*
 * isTriple is adapted from Shawn Thieke's client code
 *
 */
// function isTriple(socket, firstSelect_column, firstSelect_row, secondSelect_column, secondSelect_row) {
//   if (firstSelect_column < 0 || firstSelect_column > 9 || secondSelect_column < 0 || secondSelect_column > 9 || firstSelect_row < 0 || firstSelect_row > 7 || secondSelect_row < 0 || secondSelect_row > 7) {
//     socket.emit("debug", `ERROR: row and/or col numbers out of range.`);
//     return false;
//   }
//   //store start array values
//   const origional1 = grid[firstSelect_row][firstSelect_column];
//   const origional2 = grid[secondSelect_row][secondSelect_column];
//   //perform swap in array
//   grid[firstSelect_row][firstSelect_column] = origional2;
//   grid[secondSelect_row][secondSelect_column] = origional1;
//   //check new location of firstSelect
//   for (var x = firstSelect_column - 2; x <= firstSelect_column; x++) {
//     //check that we are in the array bounds
//     if (x >= 0 && x + 2 < grid[firstSelect_row].length) {
//       if (grid[firstSelect_row][x] === grid[firstSelect_row][x + 1] &&
//         grid[firstSelect_row][x] === grid[firstSelect_row][x + 2]) {
//         //reset the array, we have found a match
//         //grid[firstSelect_row][firstSelect_column] = origional1;
//         //grid[secondSelect_row][secondSelect_column] = origional2;
//         replaceTriple(firstSelect_row, x, firstSelect_row, x + 1, firstSelect_row, x + 2);
//         return true;
//       }
//     }
//   }
//   for (let y = firstSelect_row - 2; y <= firstSelect_row; y++) {
//     //check that we are in the array bounds
//     if (y >= 0 && y + 2 < grid.length) {
//       if (grid[y][firstSelect_column] === grid[y + 1][firstSelect_column] && grid[y][firstSelect_column] === grid[y + 2][firstSelect_column]) {
//         //reset the array, we have found a match
//         //grid[firstSelect_row][firstSelect_column] = origional1;
//         //grid[secondSelect_row][secondSelect_column] = origional2;
//         replaceTriple(y, firstSelect_column, y + 1, firstSelect_column, y + 2, firstSelect_column);
//         return true;
//       }
//     }
//   }
//   //check new locations for second select
//   for (let x = secondSelect_column - 2; x <= secondSelect_column; x++) {
//     //check that we are in the array bounds
//     if (x >= 0 && x + 2 < grid[secondSelect_row].length) {
//       if (grid[secondSelect_row][x] === grid[secondSelect_row][x + 1] && grid[secondSelect_row][x] === grid[secondSelect_row][x + 2]) {
//         //reset the array, we have found a match
//         //grid[firstSelect_row][firstSelect_column] = origional1;
//         //grid[secondSelect_row][secondSelect_column] = origional2;
//         replaceTriple(secondSelect_row, x, secondSelect_row, x + 1, secondSelect_row, x + 2);
//         return true;
//       }
//     }
//   }
//   for (let y = secondSelect_row - 2; y <= secondSelect_row; y++) {
//     //check that we are in the array bounds
//     if (y >= 0 && y + 2 < grid.length) {
//       if (grid[y][secondSelect_column] === grid[y + 1][secondSelect_column] && grid[y][secondSelect_column] === grid[y + 2][secondSelect_column]) {
//         //reset the array, we have found a match
//         //grid[firstSelect_row][firstSelect_column] = origional1;
//         //grid[secondSelect_row][secondSelect_column] = origional2;
//         replaceTriple(y, secondSelect_column, y + 1, secondSelect_column, y + 2, secondSelect_column);
//         return true;
//       }
//     }
//   }
//   //reset the array
//   //grid[firstSelect_row][firstSelect_column] = origional1;
//   //grid[secondSelect_row][secondSelect_column] = origional2;
//   return false;
// }

// function processSwap(socket, obj) {
//   const tile1x = obj.image1Col;
//   const tile1y = obj.image1Row;
//   const tile2x = obj.image2Col;
//   const tile2y = obj.image2Row;
//   const id = obj.id;

//   console.log(`processSwap: ${obj}`);
//   console.log(`processing swap request: userid= ${id}`);
//   console.log(`tile1x= ${tile1x} tile1y= ${tile1y} tile2x= ${tile2x} tile2y= ${tile2y}`);
//   socket.emit("debug", `INFO: images swapped at (row,col) (${tile1y},${tile1x}) and (${tile2y},${tile2x})`)

//   if (isTriple(socket, tile1x, tile1y, tile2x, tile2y)) {
//     socket.emit("debug", `Triple found.`)
//     fruitSmashPlayers.updateScore(id);
//     console.log('processSwap: Pair Accepted ');
//     updateGrid();
//     updateStatus();

//   } else {
//     socket.emit("debug", `Triple not found.`)
//   }
// }

// function updateChat(message) {
//   io.sockets.emit("chatbroadcast", message);
// }


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
      if(snakePlayers.length() >= 2){
 
          if(!started){
          console.log("two players!");
          started = true;
          sleep(1000)
          socket.emit("matchmade", true);
          }
      }
    })

    socket.on("eatpellet", (id) => {
        console.log(`processing pellet eaten: userid= ${id}`);
        //const name = snakePlayers.getName(id);
        snakePlayers.updateScore(id);
    })

    socket.on("powerdown", (id) => {
        console.log("opponent will power down!");
        
        socket.emit("playerPD", cause);
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
        socket.emit("winner", retName);
        sleep(4000);
        socket.emit("newgame", true);
      }
    })

    socket.on("leave", (id) => {
      snakePlayers.remove(id);
      updateStatus();
    });

    
    updateStatus();
  }
);
