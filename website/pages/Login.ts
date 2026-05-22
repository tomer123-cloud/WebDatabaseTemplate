import { send } from "clientUtilities"; // Imports the send function so we can talk to the server

var UsernameInput = document.querySelector<HTMLInputElement>("#UsernameInput")!; // Gets the username input from the HTML
var PasswordInput = document.querySelector<HTMLInputElement>("#PasswordInput")!; // Gets the password input from the HTML
var LoginSubmitButton = document.querySelector<HTMLButtonElement>("#LoginSubmitButton")!; // Gets the login button from the HTML
var ErrorMessage = document.querySelector<HTMLParagraphElement>("#ErrorMessage")!; // Gets the error message from the HTML
var userToken = localStorage.getItem("userToken");

if (userToken !=null)
{
  location.href = "/website/pages/Start.html";
}

else{
LoginSubmitButton.onclick = async function() { 
  var username = UsernameInput.value; 
  var password = PasswordInput.value; 

  var userToken = await send<string | null>("Login", username, password); 
  

  if (userToken != null) { 
    ErrorMessage.style.visibility = "hidden"; 
    localStorage.setItem("userToken", userToken); 
    location.href = "/website/pages/Lobby.html"; 

  } else { 
    ErrorMessage.style.visibility = "visible"; 
  }
}
}