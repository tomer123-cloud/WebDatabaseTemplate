import { send } from "clientUtilities";
import type { User } from "types";

var WelcomeUserDiv = document.querySelector<HTMLElement>("#WelcomeUserDiv")!;
var LogoutButton = document.querySelector<HTMLButtonElement>("#LogoutButton")!;

var user: User | null = null;

async function checkUser() {
  var userToken = localStorage.getItem("userToken");

  if (userToken == null) {
    location.href = "/website/pages/Start.html";
    return;
  }

  user = await send<User | null>("getUser", userToken);

  if (user == null) {
    localStorage.removeItem("userToken");
    location.href = "/website/pages/Start.html";
    return;
  }

  WelcomeUserDiv.innerText = "Welcome " + user.username + "!";
}

await checkUser();

LogoutButton.onclick = async function () {
  var userToken = localStorage.getItem("userToken");

  if (userToken != null) {
    await send("Logout", userToken);
  }

  localStorage.removeItem("userToken");

  await checkUser();
};