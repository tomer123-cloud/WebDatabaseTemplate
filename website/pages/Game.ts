import { send, getSearchParam } from "clientUtilities";
import { create } from "componentUtilities";
import type { User, Game } from "types";


var GameId = Number(getSearchParam("gameId"));
var Cell00 = document.querySelector<HTMLButtonElement>("#Cell00")!;
var Cell01 = document.querySelector<HTMLButtonElement>("#Cell01")!;
var Cell02 = document.querySelector<HTMLButtonElement>("#Cell02")!;
var Cell10 = document.querySelector<HTMLButtonElement>("#Cell10")!;
var Cell11 = document.querySelector<HTMLButtonElement>("#Cell11")!;
var Cell12 = document.querySelector<HTMLButtonElement>("#Cell12")!;
var Cell20 = document.querySelector<HTMLButtonElement>("#Cell20")!;
var Cell21 = document.querySelector<HTMLButtonElement>("#Cell21")!;
var Cell22 = document.querySelector<HTMLButtonElement>("#Cell22")!;
var token = localStorage.getItem("userToken");



var Board: HTMLButtonElement[][] = [
    [Cell00, Cell01, Cell02],
    [Cell10, Cell11, Cell12],
    [Cell20, Cell21, Cell22]];
var UpdatedBoard = await send<string[][]>("boardState", GameId);



async function LoadBoard() {


    for (var y = 0; y < UpdatedBoard.length; y++) {
        for (var x = 0; x < UpdatedBoard[0].length; x++) {
            if (UpdatedBoard[y][x] === "X") {
                Board[y][x].innerText = "X";
            }

            if (UpdatedBoard[y][x] === "O") {
                Board[y][x].innerText = "O";
            }
        }
    }
}

async function CurrentTurn() 
{
   return (await send <string>("currentTurn",token,GameId));
}

for (let i = 0; i < Board.length; i++) {
    for (let j = 0; j < Board[0].length; j++) {
        Board[i][j].onclick = async function () {
            await send<string>("makeMove", token, GameId, i, j);
            await LoadBoard();
        };
    }
}





var LastBoardState: string[][] | null = null;

async function CheckBoardState()
{
  var NewBoardState = await send<string[][]>("boardState", GameId);

  if (LastBoardState != null && BoardsAreEqual(LastBoardState, NewBoardState))
  {
    return;
  }

  LastBoardState = NewBoardState;

  for (var y = 0; y < NewBoardState.length; y++)
  {
    for (var x = 0; x < NewBoardState[y].length; x++)
    {
      Board[y][x].innerText = NewBoardState[y][x];
    }
  }
}

function BoardsAreEqual(board1: string[][], board2: string[][])
{
  for (var y = 0; y < board1.length; y++)
  {
    for (var x = 0; x < board1[y].length; x++)
    {
      if (board1[y][x] != board2[y][x])
      {
        return false;
      }
    }
  }

  return true;
}

await CheckBoardState();

setInterval(async function ()
{
  await CheckBoardState();
}, 2000);