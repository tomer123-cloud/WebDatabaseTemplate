import { send } from "clientUtilities";
import { User } from "types";


var userToken = localStorage.getItem("userToken");
var user = await send<User | null>("getUser", userToken);
var StartButton = document.querySelector<HTMLButtonElement>("#StartButton")!;


StartButton.onclick = async function ()
{
  if (user == null) 
  {
    location.href="/website/pages/LoginOrSignup.html";
    return;
  }

  location.href = "/website/pages/Lobby.html";
} 