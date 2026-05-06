import { send } from "clientUtilities"; // Imports the send function so we can talk to the server

var UsernameInput = document.querySelector<HTMLInputElement>("#UsernameInput")!; // Gets the username input from the HTML
var PasswordInput = document.querySelector<HTMLInputElement>("#PasswordInput")!; // Gets the password input from the HTML
var LoginSubmitButton = document.querySelector<HTMLButtonElement>("#LoginSubmitButton")!; // Gets the login button from the HTML
var ErrorMessage = document.querySelector<HTMLParagraphElement>("#ErrorMessage")!; // Gets the error message from the HTML

LoginSubmitButton.onclick = async function() { // Runs this function when the login button is clicked
  var username = UsernameInput.value; // Saves what the user wrote in the username input
  var password = PasswordInput.value; // Saves what the user wrote in the password input

  var loginSucceeded = await send<boolean>("login", username, password); // Sends the username and password to the server and waits for true or false

  if (loginSucceeded) { // If the server says the login is correct
    ErrorMessage.style.visibility = "hidden"; // Hides the error message

    // Later you can move the user to another page here
    // location.href = "../Start/Start.html";
  } else { // If the server says the login is wrong
    ErrorMessage.style.visibility = "visible"; // Shows the error message
  }
};