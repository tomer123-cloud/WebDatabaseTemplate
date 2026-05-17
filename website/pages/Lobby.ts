import { send } from "clientUtilities";
import type { User } from "types";

var WelcomeUserDiv = document.querySelector<HTMLElement>("#WelcomeUserDiv")!;
var LogoutButton = document.querySelector<HTMLButtonElement>("#LogoutButton")!;
var userToken = localStorage.getItem("userToken");
var user = await send<User | null>("getUser", userToken);

if (user == null)
{
  location.href = "/website/pages/Start.html";
}
else
{
  WelcomeUserDiv.innerText = "Welcome " + user.username + "!";
}

LogoutButton.onclick = async function ()
{
  user = await send<User | null>("Logout");

  if (user == null)
  {
    localStorage.removeItem("userToken");
    location.href = "/website/pages/Start.html";
  }
};