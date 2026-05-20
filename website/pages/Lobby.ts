import { send } from "clientUtilities";
import { create } from "componentUtilities";
import type { User } from "types";

var WelcomeUserDiv = document.querySelector<HTMLElement>("#WelcomeUserDiv")!;
var LogoutButton = document.querySelector<HTMLButtonElement>("#LogoutButton")!;
var userToken = localStorage.getItem("userToken");
var user = await send<User | null>("getUser", userToken);
var GameDiv = document.querySelector<HTMLButtonElement>("#GameDiv")!;
var NewGameButtom = document.querySelector<HTMLButtonElement>("#Create_Game_Button")!;
var GameImg = document.querySelector<HTMLImageElement>("#GameImg")!;

if (user == null) {
  location.href = "/website/pages/Start.html";
}
else {
  WelcomeUserDiv.innerText = "Welcome " + user.username + "!";
}

LogoutButton.onclick = async function () {
  user = await send<User | null>("Logout");

  if (user == null) {
    localStorage.removeItem("userToken");
    location.href = "/website/pages/Start.html";
  }
};

NewGameButtom.onclick = async function () {
  await send("addGame", user)
}



async function LoadGames() {
  var games = await send("getGames", user);
  console.log(games);

  for (var game of games) {
    GameDiv.append(
      create("div", { className: "GameDiv", innerText: "some game" })
    );
  }
}

LoadGames();