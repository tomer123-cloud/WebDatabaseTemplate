import { send } from "clientUtilities";
import { get } from "componentUtilities";

var UserNameInput = document.querySelector<HTMLInputElement>("#UsernameInput")!;
var PasswordInput = document.querySelector<HTMLInputElement>("#PasswordInput")!;
var CreateAccountButton = document.querySelector<HTMLButtonElement>("#CreateAccountButton")!;

CreateAccountButton.onclick = async function() {
  await send("addLoginDetail", UserNameInput.value, PasswordInput.value);
};
