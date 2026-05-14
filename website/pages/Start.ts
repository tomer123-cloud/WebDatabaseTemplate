import { send } from "clientUtilities";
import { User } from "types";


var token = localStorage.getItem("userToken");

var user = await send<User | null>("getUser", token);

var CreateAccountButton = document.querySelector<HTMLButtonElement>("#CreateAccountButton")!;

StartButton.onclick = async function ()
{
if (user != null) 
{
    location.href="../Lobby.html";
}

else 
{
    location.href="../LoginOrSignup.html";
}}