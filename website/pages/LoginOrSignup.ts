import { send } from "clientUtilities";
import { User } from "types";


var SignUpButton = document.querySelector<HTMLButtonElement>("#SignUpButton")!;
var LoginButton = document.querySelector<HTMLButtonElement>("#LoginButton")!;
var userToken = localStorage.getItem("userToken");
var user = await send <User | null>("getUser",userToken);

if (user != null )
{
  location.href = "/website/pages/Lobby.html";
}

SignUpButton.onclick = async function () 
{
    location.href = "/website/pages/Signup.html";
}


LoginButton.onclick = async function () 
{
    location.href = "/website/pages/Login.html";
}