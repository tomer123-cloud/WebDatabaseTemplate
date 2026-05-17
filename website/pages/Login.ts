import { send } from "clientUtilities"; // Imports the send function so we can talk to the server

var UsernameInput = document.querySelector<HTMLInputElement>("#UsernameInput")!; // Gets the username input from the HTML
var PasswordInput = document.querySelector<HTMLInputElement>("#PasswordInput")!; // Gets the password input from the HTML
var LoginSubmitButton = document.querySelector<HTMLButtonElement>("#LoginSubmitButton")!; // Gets the login button from the HTML
var ErrorMessage = document.querySelector<HTMLParagraphElement>("#ErrorMessage")!; // Gets the error message from the HTML

LoginSubmitButton.onclick = async function() { // Runs this function when the login button is clicked
  var username = UsernameInput.value; // Saves what the user wrote in the username input
  var password = PasswordInput.value; // Saves what the user wrote in the password input

  var userToken = await send<string | null>("Login", username, password); // Sends username and password and gets a token or null
  

  if (userToken != null) { // If the server found a matching user
    ErrorMessage.style.visibility = "hidden"; // Hides the error message
    localStorage.setItem("userToken", userToken); // Saves the token in the browser
    location.href = "/website/pages/Lobby.html"; // sends the user to Lobby.html page

    // Later you can move the user to another page here
    // location.href = "../Start/Start.html";
  } else { // If the username or password is wrong
    ErrorMessage.style.visibility = "visible"; // Shows the error message
  }
};