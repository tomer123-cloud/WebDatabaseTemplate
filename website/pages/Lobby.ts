import { send } from "clientUtilities";
import { create } from "componentUtilities";
import type { User, Game } from "types";

var WelcomeUserDiv = document.querySelector<HTMLElement>("#WelcomeUserDiv")!;
var LogoutButton = document.querySelector<HTMLButtonElement>("#LogoutButton")!;
var userToken = localStorage.getItem("userToken");
var user = await send<User | null>("getUser", userToken);
var GamesDiv = document.querySelector<HTMLDivElement>("#GamesDiv")!;
var NewGameButtom = document.querySelector<HTMLButtonElement>("#Create_Game_Button")!;
var CreateButton = document.querySelector<HTMLButtonElement>("#CreateButton")!;
var ErrorDiv = document.querySelector<HTMLElement>("#ErrorDiv")!;
var AddGameParent = document.querySelector<HTMLElement>("#AddGameParent")!;
var CloseButton = document.querySelector<HTMLButtonElement>("#Close_AddGameDiv_Button")!;
var delete_all_games = document.querySelector<HTMLButtonElement>("#delete_all_games")!;
var GamesCount = 0;

async function LoadGames()
{
  GamesDiv.innerHTML = "";

  var games = await send<Game[]>("getGames");

  for (let game of games)
  {
    var gameDiv = create("button", { className: "GameButton" });

    var GameName = game.gameName;
    var Lobby_Creator_Username = game.user.username + "'s Game";

    gameDiv.append(
      create("div", { className: "GameName", innerText: GameName }),
      create("img", { className: "GameImg", src: "../images/Warrior_O_VS_X_YellowBackground.png" }),
      create("div", { className: "Lobby_Creator_Username", innerText: Lobby_Creator_Username }),
      create("div", { className: "JoinGameDiv", innerText: "Join" })
    );

    gameDiv.onclick = function ()
    {
      location.href = "/website/pages/Game.html?gameId=" + game.id;
    };

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
    user = await send<User | null>("Logout", userToken);

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
    var GameName = GameNameInput.value.trim();

    if (GameName.length < 4)
    {
      ErrorDiv.innerText = "The Lobby Name Is Too Short";
      return;
    }

    if (GameName.length > 12)
    {
      ErrorDiv.innerText = "The Lobby Name Is Too Long";
      return;
    }

    var canCreateGame = await send<string>("canCreateGame", userToken, GameName);

    if (canCreateGame == "UserNotFound")
    {
      ErrorDiv.innerText = "User was not found.";
      return;
    }

    if (canCreateGame == "GameNameEmpty")
    {
      ErrorDiv.innerText = "You must enter a Lobby name.";
      return;
    }

    if (canCreateGame == "GameNameExists")
    {
      ErrorDiv.innerText = "A Lobby with this name already exists.";
      return;
    }

    if (canCreateGame != "CanCreateGame")
    {
      ErrorDiv.innerText = "Something went wrong.";
      return;
    }

    ErrorDiv.innerText = "";
    GameNameInput.value = "";
    AddGameParent.style.display = "none";

    var newGameId = await send<number | null>("addGame", userToken, GameName);

    if (newGameId == null)
    {
      AddGameParent.style.display = "flex";
      ErrorDiv.innerText = "Something went wrong, please refresh the page and try again.";
      return;
    }

    location.href = "/website/pages/Game.html?gameId=" + newGameId;
  };

  CloseButton.onclick = async function () 
  {
    ErrorDiv.innerText = "";
    AddGameParent.style.display = "none";
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