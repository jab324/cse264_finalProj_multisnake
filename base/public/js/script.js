//define global vars
//adust and reference citation...
///https://www.geeksforgeeks.org/create-a-snake-game-using-html-css-and-javascript/


let blockSize = 20;//size of a cell in grid 
//changed from 25 to 20
let total_row = 30;//total row number
let total_col = 30;//total column number
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

$(document).ready(function() {
    canvas = document.getElementById("myCanvas");
    context = canvas.getContext("2d");
    canvas.height = total_row * blockSize;
    canvas.width = total_col * blockSize;
    context = canvas.getContext("2d");
 
    placeFood();
    document.addEventListener("keyup", changeDirection);  //for movements
    // Set snake speed
    setInterval(update, 1000 / 10);


    function update() {
        if (gameOver) {
            return;
        }
     
        // Background of a Game
        context.fillStyle = "green";
        context.fillRect(0, 0, canvas.width, canvas.height);
     
        // Set food color and position
        context.fillStyle = "yellow";
        context.fillRect(foodX, foodY, blockSize, blockSize);
     
        if (snakeX == foodX && snakeY == foodY) {
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
     
        context.fillStyle = "white";
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
             
            // Out of bound condition
            gameOver = true;
            alert("Game Over");
        }
     
        for (let i = 0; i < snakeBody.length; i++) {
            if (snakeX == snakeBody[i][0] && snakeY == snakeBody[i][1]) { 
                 
                // Snake eats own body
                gameOver = true;
                alert("Game Over");
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
    //end onload
});