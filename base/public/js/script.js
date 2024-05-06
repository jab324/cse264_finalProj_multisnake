//define global vars
//adust and reference citation...
///https://www.geeksforgeeks.org/create-a-snake-game-using-html-css-and-javascript/
let id = "";

let blockSize = 20;//size of a cell in grid 
//changed from 25 to 20
let total_row = 30;//total row number
let total_col = 50;//total column number
let canvas;//assign in onload
let context;//assign in onload
 
//below, starting position for snake?
let snakeX = blockSize * 5;
let snakeY = blockSize * 5;
 
let speedX = 0;//speed of snake in x coordinate.
let speedY = 0;//speed of snake in Y coordinate.
 
let snakeBody = [];
 
let foodX;
let foodY;
 
let gameOver = false;
let pubGameover = false;
let matchmade = false;

let winner;

let refreshIntervalId;

const socket = io.connect('http://neptune.cse.lehigh.edu:4040');

$(document).ready(function() {
    function loadgame(){
        placeFood();
        //document.addEventListener("keyup", changeDirection);  //for movements
        // Set snake speed
        refreshIntervalId = setInterval(update, 1000 / 10);
    }

    canvas = document.getElementById("myCanvas");
    context = canvas.getContext("2d");
    canvas.height = total_row * blockSize;//30x20=600 pixels tall
    canvas.width = total_col * blockSize;//canvas is 50x20=1000 pixels wide
    context = canvas.getContext("2d");
     // Background of a Game
     context.fillStyle = "black";
     context.fillRect(0,0, canvas.width, canvas.height);
     document.addEventListener("keyup", changeDirection); 

    function update() {
        if (gameOver) {
            clearInterval(refreshIntervalId);
            return;
        }
     
        // Background of a Game
        context.fillStyle = "black";
        context.fillRect(0,0, canvas.width, canvas.height);
     
        // Set food color and position
        context.fillStyle = "yellow";
        context.fillRect(foodX, foodY, blockSize, blockSize);
     
        if (snakeX == foodX && snakeY == foodY) {
            socket.emit("eatpellet", id);
            snakeBody.push([foodX, foodY]);
            placeFood();
        }
     
        // body of snake will grow
        for (let i = snakeBody.length - 1; i > 0; i--) {
            // it will store previous part of snake to the current part
            snakeBody[i] = snakeBody[i - 1];
        }
        if (snakeBody.length) {
            snakeBody[0] = [snakeX, snakeY];
        }
     
        context.fillStyle = "green";
        snakeX += speedX * blockSize; //updating Snake position in X coordinate.
        snakeY += speedY * blockSize;  //updating Snake position in Y coordinate.
        context.fillRect(snakeX, snakeY, blockSize, blockSize);
        for (let i = 0; i < snakeBody.length; i++) {
            context.fillRect(snakeBody[i][0], snakeBody[i][1], blockSize, blockSize);
        }
     
        if (snakeX < 0 
            || snakeX > total_col * blockSize 
            || snakeY < 0 
            || snakeY > total_row * blockSize) { 
             
            //out of bounds
            console.log("out of bounds");
            gameOver = true;
            socket.emit("gameover", id);
            alert("Game Over");
            testgameover();
        }
     
        for (let i = 0; i < snakeBody.length; i++) {
            if (snakeX == snakeBody[i][0] && snakeY == snakeBody[i][1]) { 
                //eats own body
                console.log("ate self");
                gameOver = true;
                socket.emit("gameover", id);
                alert("Game Over");
                testgameover();
            }
        }
    }

    // Movement of the Snake - We are using addEventListener
    function changeDirection(e) {
        if (e.code == "ArrowUp" && speedY != 1) { 
            // If up arrow key pressed with this condition...
            // snake will not move in the opposite direction
            speedX = 0;
            speedY = -1;
        }
        else if (e.code == "ArrowDown" && speedY != -1) {
            //If down arrow key pressed
            speedX = 0;
            speedY = 1;
        }
        else if (e.code == "ArrowLeft" && speedX != 1) {
            //If left arrow key pressed
            speedX = -1;
            speedY = 0;
        }   
        else if (e.code == "ArrowRight" && speedX != -1) { 
            //If Right arrow key pressed
            speedX = 1;
            speedY = 0;
        }
    }

    // Randomly place food
    function placeFood() {
        // in x coordinates.
        foodX = Math.floor(Math.random() * total_col) * blockSize; 
        //in y coordinates.
        foodY = Math.floor(Math.random() * total_row) * blockSize; 
    }

    const login = document.getElementById('login');
    const loginInput = document.getElementById('loginInput');
    const loginButton = document.getElementById('loginButton');
    const resetButton = document.getElementById('resetButton');
    const loadButton = document.getElementById('loadButton');

    function displayPlayerList(plist){
        $("#tablebody tr").remove(); 
        //accepts an array of arrays with 2 fields
        const body = document.getElementById('tablebody');
        plist.forEach(player => {
            const row = document.createElement('tr');
            const nameCell = document.createElement('td');
            nameCell.textContent = player.name;
            //player.name?
            const scoreCell = document.createElement('td');
            scoreCell.textContent = player.score;
            //player.score?
            //depends on object setup
            row.appendChild(nameCell);
            row.appendChild(scoreCell);
            body.appendChild(row);
        });
        const table = document.getElementById('myTable');
        table.appendChild(body);
    }

    loginButton.addEventListener('click', function() {
        //value of text input
        const inputValue = loginInput.value;
        loginInput.value = '';
        //send login string to server and in handler, receive and save id?
        socket.emit("login", inputValue);
        //$(`#login`).css("display", "none");
       login.style.display = "none";
       //loadgame();
    });

    resetButton.addEventListener('click', function() {
        reset();
    });

    socket.on('loginresponse', function(datavalue) {
        //do something with datavalue.
        id = datavalue.id;
        console.log(id);
    });

    socket.on('playerslistupdate', function(datavalue) {
        //do something with datavalue.
        console.log("playerlistupdate received from server");
        displayPlayerList(datavalue);
    });

    socket.on('winner', function(datavalue) {
        //do something with datavalue.
        console.log("winner received from server");
        pubGameover = true;
        winner = datavalue;
        testgameover();
    });

    socket.on('matchmade', function(datavalue) {
        //match has been made; start new game
        console.log("match made from server");
        alert("Match made. Game starting.");
        loadgame();
    });

    socket.on('newgame', function(datavalue) {
        //game has ended and someone won; start new game
        console.log("new game from server");
        alert("New game starting.");
        reset();
    });

    function testgameover(){
        if(gameOver){
            //is pubgameover? (is the game over for all)?
            //if yes, then print winner
            //if no, then wait until winner
            if(pubGameover){
                alert("Winner: " + winner);
            }
            else{
                //wait
                alert("Waiting; other players are still going.");
            }
        }
    }

    function reset(){
        console.log("reset clicked");
        snakeBody = [];
        gameOver = false;
        pubGameover = false;
        //clear rect
        canvas = document.getElementById("myCanvas");
        context = canvas.getContext("2d");
        context.clearRect(0, 0, canvas.width, canvas.height);
        context.fillStyle = "black";
        context.fillRect(0,0, canvas.width, canvas.height);
        //context.fillStyle = "yellow";
        //context.fillRect(foodX, foodY, blockSize, blockSize);
        snakeX = blockSize * 5;
        snakeY = blockSize * 5;
        speedX = 0;
        speedY = 0;
        //placeFood();
        //context.fillStyle = "green";
        /*
        snakeX += speedX * blockSize; //updating Snake position in X coordinate.
        snakeY += speedY * blockSize;  //updating Snake position in Y 
        */
        //context.fillRect(snakeX, snakeY, blockSize, blockSize);
        //refreshIntervalId = setInterval(update, 1000 / 10);
        loadgame();
    }
    //end onload
});