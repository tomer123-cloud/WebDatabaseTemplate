import { send } from "clientUtilities";
import { get } from "componentUtilities";

var UserNameInput = document.querySelector<HTMLInputElement>("#UsernameInput")!;
var PasswordInput = document.querySelector<HTMLInputElement>("#PasswordInput")!;
var CreateAccountButton = document.querySelector<HTMLButtonElement>("#CreateAccountButton")!;
var ConfirmPasswordInput = document.querySelector<HTMLInputElement>("#ConfirmPasswordInput")!;
var ErrorDiv = document.querySelector<HTMLInputElement>("#ErrorDiv")!;




CreateAccountButton.onclick = async function () {
  if (PasswordInput.value != ConfirmPasswordInput.value) {
    ErrorDiv.innerText = "Passwords do not match.";
    return;
  }

  var userToken = await send<string | null>("SignUp", UserNameInput.value, PasswordInput.value);

  if (userToken == null) {
    ErrorDiv.innerText = "A user with that username already exists.";
    return;
  }

  localStorage.setItem("userToken", userToken);
  location.href = "chat.html";
};
