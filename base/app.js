/*
Joseph Bereswill (CSB '24) & Christopher Girouard (CSE '25)
CSE264 Final - MultiSnake
*/

const express = require("express");
const path = require("path");

const app = express();

app.use(express.static(
  path.resolve(__dirname, "public")
));

app.listen(3000, () => console.log("Starting MultiSnake"));


