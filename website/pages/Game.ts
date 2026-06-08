import { send, getSearchParam } from "clientUtilities";
import { create } from "componentUtilities";
import type { User, Game } from "types";


var GameId = Number(getSearchParam("gameId"));
var token = localStorage.getItem("userToken");


var Cell00 = document.querySelector<HTMLButtonElement>("#Cell00")!;
var Cell01 = document.querySelector<HTMLButtonElement>("#Cell01")!;
var Cell02 = document.querySelector<HTMLButtonElement>("#Cell02")!;

var Cell10 = document.querySelector<HTMLButtonElement>("#Cell10")!;
var Cell11 = document.querySelector<HTMLButtonElement>("#Cell11")!;
var Cell12 = document.querySelector<HTMLButtonElement>("#Cell12")!;

var Cell20 = document.querySelector<HTMLButtonElement>("#Cell20")!;
var Cell21 = document.querySelector<HTMLButtonElement>("#Cell21")!;
var Cell22 = document.querySelector<HTMLButtonElement>("#Cell22")!;


var WaitingForPlayerDiv = document.querySelector<HTMLElement>("#WaitingForPlayerDiv")!;
var WaitingText = document.querySelector<HTMLElement>("#WaitingText")!;
var StartStatusText = document.querySelector<HTMLElement>("#StartStatusText")!;

var StartGameButton = document.querySelector<HTMLButtonElement>("#StartGameButton")!;
var CancelGameButton = document.querySelector<HTMLButtonElement>("#CancelGameButton")!;

var GameOverButtonsDiv = document.querySelector<HTMLElement>("#GameOverButtonsDiv")!;
var PlayAgainButton = document.querySelector<HTMLButtonElement>("#PlayAgainButton")!;
var PlayAgainStatusDiv = document.querySelector<HTMLElement>("#PlayAgainStatusDiv")!;
var StartNewGameButton = document.querySelector<HTMLButtonElement>("#StartNewGameButton")!;
var BackToLobbyButton = document.querySelector<HTMLButtonElement>("#BackToLobbyButton")!;


var Board: HTMLButtonElement[] = [
    Cell00, Cell01, Cell02,
    Cell10, Cell11, Cell12,
    Cell20, Cell21, Cell22
];


var Player1Color = "red";
var Player2Color = "blue";

var LastBoardState: string[] | null = null;
var CanPlay: boolean = false;
var GameFinished: boolean = false;
var WaitingForPlayAgainReset: boolean = false;

/* ---------- Helper functions ---------- */

function SetBoardDisabled(disabled: boolean) {
    for (var i = 0; i < Board.length; i++) {
        Board[i].disabled = disabled;
    }
}


function ClearBoardOnScreen() {
    for (var i = 0; i < Board.length; i++) {
        Board[i].innerText = "";
        Board[i].style.color = "";
    }
}


function GetColorCode(colorName: string) {
    if (colorName == "red") {
        return "#d62828";
    }

    if (colorName == "blue") {
        return "#1d4ed8";
    }

    return "#f4f1e8";
}


function GetBackgroundColorCode(colorName: string) {
    if (colorName == "red") {
        return "#5f0f0f";
    }

    if (colorName == "blue") {
        return "#0b2f66";
    }

    return "#202124";
}


function SetCellTextAndColor(cell: HTMLButtonElement, value: string) {
    if (value == "E") {
        cell.innerText = "";
        cell.style.color = "";
        return;
    }

    cell.innerText = value;

    if (value == "X") {
        cell.style.color = GetColorCode(Player1Color);
    }

    if (value == "O") {
        cell.style.color = GetColorCode(Player2Color);
    }
}


function BoardsAreEqual(board1: string[], board2: string[]) {
    if (board1.length != board2.length) {
        return false;
    }

    for (var i = 0; i < board1.length; i++) {
        if (board1[i] != board2[i]) {
            return false;
        }
    }

    return true;
}
/* ---------- Screen display functions ---------- */

function ShowWaitingScreen() {
    WaitingForPlayerDiv.style.display = "flex";

    StartGameButton.style.display = "block";
    CancelGameButton.style.display = "block";

    GameOverButtonsDiv.style.display = "none";

    document.body.style.backgroundColor = "#202124";
}


function ShowStartScreen() {
    WaitingForPlayerDiv.style.display = "flex";

    StartGameButton.style.display = "block";
    CancelGameButton.style.display = "none";

    GameOverButtonsDiv.style.display = "none";

    document.body.style.backgroundColor = "#202124";
}


function ShowGameScreen() {
    WaitingForPlayerDiv.style.display = "none";

    StartGameButton.style.display = "block";
    CancelGameButton.style.display = "none";

    GameOverButtonsDiv.style.display = "none";
}


function ShowGameOverScreen() {
    WaitingForPlayerDiv.style.display = "flex";

    StartGameButton.style.display = "none";
    CancelGameButton.style.display = "none";

    GameOverButtonsDiv.style.display = "flex";
}


/* ---------- Server update functions ---------- */

async function LoadGameColors() {
    var colors = await send<string[]>("gameColors", GameId);

    if (colors.length >= 2) {
        Player1Color = colors[0];
        Player2Color = colors[1];
    }
}


async function UpdateBackgroundByTurnColor() {
    var turnColor = await send<string>("currentTurnColor", GameId);

    document.body.style.backgroundColor = GetBackgroundColorCode(turnColor);
}


async function CheckBoardState() {
    var NewBoardState = await send<string[]>("boardState", GameId);

    if (LastBoardState == null || BoardsAreEqual(LastBoardState, NewBoardState) == false) {
        LastBoardState = NewBoardState;
    }

    for (var i = 0; i < NewBoardState.length; i++) {
        SetCellTextAndColor(Board[i], NewBoardState[i]);
    }
}


async function CurrentTurn() {
    return await send<string>("currentTurn", token, GameId);
}


async function CheckGameStatus() {
    if (GameFinished == true) {
        return;
    }

    var status = await send<string>("gameStatus", GameId);

    if (status == "Ready") {
        CanPlay = true;
        SetBoardDisabled(false);

        ShowGameScreen();

        await UpdateBackgroundByTurnColor();
        return;
    }

    CanPlay = false;
    SetBoardDisabled(true);

    if (status == "WaitingForPlayer") {
        ShowWaitingScreen();

        WaitingText.innerText = "Waiting for other player...";
        StartStatusText.innerText = "Start 0/2";

        StartGameButton.disabled = true;
        CancelGameButton.style.display = "block";

        return;
    }

    if (status == "aPlayerHasAlreadyJoined" || status == "Start0/2") {
        ShowStartScreen();

        WaitingText.innerText = "Both players are here.";
        StartStatusText.innerText = "Start 0/2";

        StartGameButton.disabled = false;

        return;
    }

    if (status == "Start1/2") {
        ShowStartScreen();

        WaitingText.innerText = "Waiting for both players to press start.";
        StartStatusText.innerText = "Start 1/2";

        StartGameButton.disabled = false;

        return;
    }

    if (status == "GameNotFound") {
        location.href = "/website/pages/Lobby.html";
    }
}


async function CheckForWin() {
    var winResult = await send<string>("checkForWin", GameId);

    if (winResult == "NoWinner") {
        return;
    }

    GameFinished = true;
    CanPlay = false;
    SetBoardDisabled(true);

    ShowGameOverScreen();

    if (winResult == "XWon") {
        WaitingText.innerText = "X Won!";
        StartStatusText.innerText = "Game Over";
    }

    if (winResult == "OWon") {
        WaitingText.innerText = "O Won!";
        StartStatusText.innerText = "Game Over";
    }

    if (winResult == "Tie") {
        WaitingText.innerText = "Tie!";
        StartStatusText.innerText = "Game Over";
    }

    await CheckPlayAgainStatus();
}

async function CheckPlayAgainStatus()
{
  if (GameFinished == false)
  {
    return;
  }

  var playAgainStatus = await send<string>("playAgainStatus", token, GameId);

  if (playAgainStatus == "PlayAgain0/2")
  {
    PlayAgainStatusDiv.innerText = "0/2";
    PlayAgainButton.disabled = false;
    return;
  }

  if (playAgainStatus == "PlayAgain1/2")
  {
    PlayAgainStatusDiv.innerText = "1/2";
    PlayAgainButton.disabled = false;
    return;
  }

  if (playAgainStatus == "OtherPlayerLeft")
  {
    PlayAgainStatusDiv.innerText = "the other player has left the lobby";
    PlayAgainButton.disabled = true;
    return;
  }

  if (playAgainStatus == "GameReset")
  {
    if (WaitingForPlayAgainReset == false)
    {
      return;
    }

    WaitingForPlayAgainReset = false;

    GameFinished = false;
    CanPlay = false;
    LastBoardState = null;

    ClearBoardOnScreen();

    await LoadGameColors();
    await CheckGameStatus();
    await CheckBoardState();

    return;
  }
}


/* ---------- First join ---------- */

var joinGameResult = await send<string>("joinGame", token, GameId);

console.log("joinGameResult:", joinGameResult);

if (joinGameResult == "UserNotFound")
{
  location.href = "/website/pages/Start.html";
}

if (joinGameResult == "GameNotFound" || joinGameResult == "GameFull")
{
  location.href = "/website/pages/Lobby.html";
}


await LoadGameColors();
ClearBoardOnScreen();


/* ---------- Button clicks ---------- */

StartGameButton.onclick = async function ()
{
  var startResult = await send<string>("startGame", token, GameId);

  console.log("startResult:", startResult);

  await LoadGameColors();
  await CheckGameStatus();
  await CheckBoardState();
  await CheckForWin();
};


CancelGameButton.onclick = async function ()
{
  await send<string>("cancelGame", token, GameId);
  location.href = "/website/pages/Lobby.html";
};


PlayAgainButton.onclick = async function ()
{
  if (PlayAgainButton.disabled == true)
  {
    return;
  }

  WaitingForPlayAgainReset = true;

  var playAgainResult = await send<string>("playAgain", token, GameId);

  console.log("playAgainResult:", playAgainResult);

  await CheckPlayAgainStatus();
};


StartNewGameButton.onclick = async function ()
{
  await send<string>("leaveGame", token, GameId);
  location.href = "/website/pages/Lobby.html";
};


BackToLobbyButton.onclick = async function ()
{
  await send<string>("leaveGame", token, GameId);
  location.href = "/website/pages/Lobby.html";
};


for (let i = 0; i < 3; i++) 
{
  for (let j = 0; j < 3; j++) 
  {
    Board[i * 3 + j].onclick = async function () 
    {
      if (CanPlay == false)
      {
        console.log("Game has not started yet");
        return;
      }

      var turnResult = await CurrentTurn();

      if (turnResult != "YourTurn")
      {
        console.log("It is not your turn");
        return;
      }

      var moveResult = await send<string>("makeMove", token, GameId, i, j);

      console.log(moveResult);

      await CheckBoardState();
      await CheckForWin();

      if (GameFinished == false)
      {
        await UpdateBackgroundByTurnColor();
      }
    };
  }
}


/* ---------- First load and automatic updates ---------- */

await LoadGameColors();
await CheckGameStatus();
await CheckBoardState();
await CheckForWin();

setInterval(async function () 
{
  await LoadGameColors();
  await CheckGameStatus();
  await CheckBoardState();
  await CheckForWin();
  await CheckPlayAgainStatus();
}, 2000);