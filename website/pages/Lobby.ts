import { send } from "clientUtilities";
import { create } from "componentUtilities";
import type { User } from "types";

var WelcomeUserDiv = document.querySelector<HTMLElement>("#WelcomeUserDiv")!;
var LogoutButton = document.querySelector<HTMLButtonElement>("#LogoutButton")!;
var userToken = localStorage.getItem("userToken");
var user = await send<User | null>("getUser", userToken);
var GamesDiv = document.querySelector<HTMLDivElement>("#GamesDiv")!;
var NewGameButtom = document.querySelector<HTMLButtonElement>("#Create_Game_Button")!;
var CreateButton = document.querySelector<HTMLButtonElement>("#CreateButton")!;
var ErrorDiv = document.querySelector<HTMLElement>("#ErrorDiv")!;
var AddGameParent = document.querySelector<HTMLElement>("#AddGameParent")!;
var delete_all_games = document.querySelector<HTMLButtonElement>("#delete_all_games")!;
var GamesCount = 0;

async function LoadGames()
{
  GamesDiv.innerHTML = "";

  var games = await send<any[]>("getGames");

  for (var game of games)
  {
    var gameDiv = create("div", { className: "GameDiv" });

    gameDiv.append(
      create("button", { className: "GameButton" }),
      create("img", { className: "GameImg", src: "../images/empty_TicTacToe_board.png" })
    );

    GamesDiv.append(gameDiv);
  }
}

if (user == null)
{
  location.href = "/website/pages/Start.html";
}
else
{
  WelcomeUserDiv.innerText = "Welcome " + user.username + "!";

  LogoutButton.onclick = async function ()
  {
    user = await send<User | null>("Logout");

    if (user == null)
    {
      localStorage.removeItem("userToken");
      location.href = "/website/pages/Start.html";
    }
  };

  NewGameButtom.onclick = async function ()
  {
    ErrorDiv.innerText = "";
    AddGameParent.style.display = "flex";
  };

  CreateButton.onclick = async function () 
  {
    var GameNameInput = document.querySelector<HTMLInputElement>("#GameNameInput")!;
    var GameName = GameNameInput.value;

    var canCreateGame = await send<string>("canCreateGame", userToken, GameName);

    if (canCreateGame == "UserNotFound")
    {
      ErrorDiv.innerText = "User was not found.";
      return;
    }

    if (canCreateGame == "GameNameEmpty")
    {
      ErrorDiv.innerText = "You must enter a lobby name.";
      return;
    }

    if (canCreateGame == "GameNameExists")
    {
      ErrorDiv.innerText = "A lobby with this name already exists.";
      return;
    }


    
      ErrorDiv.innerText = "";
      GameNameInput.value = "";
      AddGameParent.style.display = "none";

      var addGameResult = await send<string>("addGame", userToken, GameName);

      if (addGameResult == "GameCreated")
      {
        await LoadGames();
        GamesCount = await send<number>("getGamesCount");
      }
    
  };

  delete_all_games.onclick = async function ()
  {
    await send("clearGames");

    GamesDiv.innerHTML = "";
    GamesCount = 0;

    await LoadGames();
  };

  await LoadGames();
  GamesCount = await send<number>("getGamesCount");

  setInterval(async function ()
  {
    var NewGamesCount = await send<number>("getGamesCount");

    if (GamesCount == NewGamesCount)
    {
      return;
    }

    GamesCount = NewGamesCount;

    await LoadGames();
  }, 5000);
}