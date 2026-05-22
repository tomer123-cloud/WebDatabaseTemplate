import { send } from "clientUtilities";

var UserNameInput = document.querySelector<HTMLInputElement>("#UsernameInput")!;
var PasswordInput = document.querySelector<HTMLInputElement>("#PasswordInput")!;
var ConfirmPasswordInput = document.querySelector<HTMLInputElement>("#ConfirmPasswordInput")!;
var CreateAccountButton = document.querySelector<HTMLButtonElement>("#CreateAccountButton")!;
var userToken = localStorage.getItem("userToken");
var ErrorDiv = document.querySelector<HTMLElement>("#ErrorDiv")!;
var PasswordEyeImg = document.querySelector<HTMLImageElement>("#PasswordEyeImg")!;
var ConfirmPasswordEyeImg = document.querySelector<HTMLImageElement>("#ConfirmPasswordEyeImg")!;
var openEyeSrc = "../images/open_eye.png";
var closedEyeSrc = "../images/closed_eye.png";


if (userToken != null)
{
  location.href = "/website/pages/Start.html";
}
else{

PasswordEyeImg.onclick = function ()
{
  if (PasswordInput.type == "password")
  {
    PasswordInput.type = "text";
    PasswordEyeImg.src = closedEyeSrc;
  }
  else
  {
    PasswordInput.type = "password";
    PasswordEyeImg.src = openEyeSrc;
  }
};

ConfirmPasswordEyeImg.onclick = function ()
{
  if (ConfirmPasswordInput.type == "password")
  {
    ConfirmPasswordInput.type = "text";
    ConfirmPasswordEyeImg.src = closedEyeSrc;
  }
  else
  {
    ConfirmPasswordInput.type = "password";
    ConfirmPasswordEyeImg.src = openEyeSrc;
  }
};

CreateAccountButton.onclick = async function () 
{
  if (UserNameInput.value.length == 0 || PasswordInput.value.length == 0 || ConfirmPasswordInput.value.length == 0)
  {
    ErrorDiv.innerText = "You must fill all the text boxes";
    return;
  }

  if (UserNameInput.value.length <= 3) 
  {
    ErrorDiv.innerText = "The Username is too short.";
    return;
  }

  if (UserNameInput.value.length >= 12) 
  {
    ErrorDiv.innerText = "The Username is too long.";
    return;
  }

  if (PasswordInput.value != ConfirmPasswordInput.value) 
  {
    ErrorDiv.innerText = "Passwords do not match.";
    return;
  }

    if (PasswordInput.value.length < 4) 
  {
    ErrorDiv.innerText = "The Passowrd is too short.";
    return;
  }

    if (PasswordInput.value.length > 12) 
  {
    ErrorDiv.innerText = "The Passowrd is too Long.";
    return;
  }

  var userToken = await send<string | null>("Signup", UserNameInput.value, PasswordInput.value);

  if (userToken == null) 
  {
    ErrorDiv.innerText = "A user with that username already exists.";
    return;
  }

  ErrorDiv.innerText = "";

  localStorage.setItem("userToken", userToken);
  location.href = "/website/pages/Lobby.html";
}
}