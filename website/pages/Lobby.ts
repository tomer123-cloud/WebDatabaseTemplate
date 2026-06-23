// Imports the send function for communicating with the C# server.
import { send } from "clientUtilities";

// Imports the create function for creating HTML elements using TypeScript.
import { create } from "componentUtilities";

// Imports the User and Game types.
import type { User, Game } from "types";


// Creates a type that contains all Game properties and also Player2Id.
type LobbyGame = Game &
{
  // Stores the ID of the second player.
// null means that the game still has an available place.
  player2Id: number | null;
};


// Finds the element that displays the welcome message.
var WelcomeUserDiv = document.querySelector<HTMLElement>("#WelcomeUserDiv")!;

// Finds the Logout button.
var LogoutButton = document.querySelector<HTMLButtonElement>("#LogoutButton")!;

// Gets the saved user token from localStorage.
var userToken = localStorage.getItem("userToken");

// Sends the token to the server and gets the logged-in user.
var user = await send<User | null>("getUser", userToken);

// Finds the div that contains all the available games.
var GamesDiv = document.querySelector<HTMLDivElement>("#GamesDiv")!;

// Finds the button that opens the Create Game window.
var NewGameButtom = document.querySelector<HTMLButtonElement>("#Create_Game_Button")!;

// Finds the button that creates the new game.
var CreateButton = document.querySelector<HTMLButtonElement>("#CreateButton")!;

// Finds the div that displays error messages.
var ErrorDiv = document.querySelector<HTMLElement>("#ErrorDiv")!;

// Finds the popup that contains the Create Game form.
var AddGameParent = document.querySelector<HTMLElement>("#AddGameParent")!;

// Finds the button that closes the Create Game popup.
var CloseButton = document.querySelector<HTMLButtonElement>("#Close_AddGameDiv_Button")!;


// Finds the select element used for choosing red or blue.
var ColorSelect = document.querySelector<HTMLSelectElement>("#ColorSelect")!;


/* ---------- Load the available games ---------- */


// Loads the games from the server and displays only games with one player.
async function LoadGames()
{
  // Removes all old game cards before loading the updated list.
  GamesDiv.innerHTML = "";

  // Gets all games from the C# server.
  var games = await send<LobbyGame[]>("getGames");

  // Goes through every game received from the server.
  for (let game of games)
  {
    // Checks whether the game already has a second player.
    if (game.player2Id != null)
    {
      // Skips this game so it will not be displayed in the lobby.
      continue;
    }

    // Creates the button that represents the game.
    var gameDiv = create("button", { className: "GameButton" });

    // Saves the name of the current game.
    var GameName = game.gameName;

    // Creates the text that shows who created the game.
    var Lobby_Creator_Username = game.user.username + "'s Game";

    // Adds the game name, image, creator name, and Join text to the game card.
    gameDiv.append(
      // Creates the element that displays the game name.
      create("div", { className: "GameName", innerText: GameName }),

      // Creates the image displayed inside the game card.
      create("img", {
        className: "GameImg",
        src: "../images/Warrior_O_VS_X_YellowBackground.png"
      }),

      // Creates the element that displays the creator's username.
      create("div", {
        className: "Lobby_Creator_Username",
        innerText: Lobby_Creator_Username
      }),

      // Creates the Join text displayed inside the card.
      create("div", {
        className: "JoinGameDiv",
        innerText: "Join"
      })
    );

    // Runs when the user clicks the game card.
    gameDiv.onclick = async function ()
    {
      // Gets the latest game list before moving to the Game page.
      var UpdatedGames = await send<LobbyGame[]>("getGames");

      // Searches for the selected game in the updated game list.
      var SelectedGame = UpdatedGames.find(function (CurrentGame)
      {
        // Returns true when the current game has the same ID.
        return CurrentGame.id == game.id;
      });

      // Checks whether the game was deleted or already received a second player.
      if (SelectedGame == undefined || SelectedGame.player2Id != null)
      {
        // Reloads the visible games so the full game disappears.
        await LoadGames();

        // Stops the function without moving to the Game page.
        return;
      }

      // Moves the user to the selected game and adds its ID to the URL.
      location.href = "/website/pages/Game.html?gameId=" + game.id;
    };

    // Adds the available game card to the GamesDiv.
    GamesDiv.append(gameDiv);
  }
}


/* ---------- Check the logged-in user ---------- */


// Checks whether the server did not find the current user.
if (user == null)
{
  // Sends the visitor back to the Start page.
  location.href = "/website/pages/Start.html";
}
else
{
  // Displays the username inside the welcome message.
  WelcomeUserDiv.innerText = "Welcome " + user.username + "!";


  /* ---------- Logout button ---------- */


  // Runs when the Logout button is clicked.
  LogoutButton.onclick = async function ()
  {
    // Sends the token to the Logout request.
    user = await send<User | null>("Logout", userToken);

    // Checks whether the server successfully logged the user out.
    if (user == null)
    {
      // Removes the token from localStorage.
      localStorage.removeItem("userToken");

      // Sends the user back to the Start page.
      location.href = "/website/pages/Start.html";
    }
  };


  /* ---------- Open the Create Game popup ---------- */


  // Runs when the Create A Game button is clicked.
  NewGameButtom.onclick = async function ()
  {
    // Removes any previous error message.
    ErrorDiv.innerText = "";

    // Resets the selected color.
    ColorSelect.value = "";

    // Displays the Create Game popup.
    AddGameParent.style.display = "flex";
  };


  /* ---------- Create a new game ---------- */


  // Runs when the Create button inside the popup is clicked.
  CreateButton.onclick = async function () 
  {
    // Finds the input used for entering the game name.
    var GameNameInput = document.querySelector<HTMLInputElement>("#GameNameInput")!;

    // Gets the entered game name and removes extra spaces.
    var GameName = GameNameInput.value.trim();

    // Gets the color selected by the user.
    var PlayerColor = ColorSelect.value;

    // Checks whether the game name contains fewer than four characters.
    if (GameName.length < 4)
    {
      // Displays an error message.
      ErrorDiv.innerText = "The Lobby Name Is Too Short";

      // Stops the function.
      return;
    }

    // Checks whether the game name contains more than twelve characters.
    if (GameName.length > 12)
    {
      // Displays an error message.
      ErrorDiv.innerText = "The Lobby Name Is Too Long";

      // Stops the function.
      return;
    }

    // Checks whether the user did not select a color.
    if (PlayerColor == "")
    {
      // Displays an error message.
      ErrorDiv.innerText = "You must choose a color.";

      // Stops the function.
      return;
    }

    // Asks the server whether the user is allowed to create this game.
    var canCreateGame = await send<string>(
      "canCreateGame",
      userToken,
      GameName
    );

    // Checks whether the server did not find the user.
    if (canCreateGame == "UserNotFound")
    {
      // Displays an error message.
      ErrorDiv.innerText = "User was not found.";

      // Stops the function.
      return;
    }

    // Checks whether the entered game name is empty.
    if (canCreateGame == "GameNameEmpty")
    {
      // Displays an error message.
      ErrorDiv.innerText = "You must enter a Lobby name.";

      // Stops the function.
      return;
    }

    // Checks whether another game already uses this name.
    if (canCreateGame == "GameNameExists")
    {
      // Displays an error message.
      ErrorDiv.innerText = "A Lobby with this name already exists.";

      // Stops the function.
      return;
    }

    // Removes the current error message.
    ErrorDiv.innerText = "";

    // Clears the game name input.
    GameNameInput.value = "";

    // Resets the selected color.
    ColorSelect.value = "";

    // Hides the Create Game popup.
    AddGameParent.style.display = "none";

    // Sends the game details to the server and receives the new game ID.
    var newGameId = await send<number | null>(
      "addGame",
      userToken,
      GameName,
      PlayerColor
    );

    // Prints the new game ID in the browser console.
    console.log(newGameId);

    // Checks whether the server failed to create the game.
    if (newGameId == null)
    {
      // Opens the popup again.
      AddGameParent.style.display = "flex";

      // Displays an error message.
      ErrorDiv.innerText =
        "Something went wrong, please refresh the page and try again.";

      // Stops the function.
      return;
    }

    // Moves the game creator to the new Game page.
    location.href = "/website/pages/Game.html?gameId=" + newGameId;
  };


  /* ---------- Close the Create Game popup ---------- */


  // Runs when the close button is clicked.
  CloseButton.onclick = async function () 
  {
    // Removes the current error message.
    ErrorDiv.innerText = "";

    // Hides the Create Game popup.
    AddGameParent.style.display = "none";
  };



  /* ---------- First game list load ---------- */


  // Loads the available games when the Lobby page first opens.
  await LoadGames();


  /* ---------- Automatic game list updates ---------- */


  // Runs repeatedly every five seconds.
  setInterval(async function ()
  {
    // Reloads the games so games with two players immediately disappear.
    await LoadGames();

    // Sets the interval time to 5000 milliseconds, which equals five seconds.
  }, 5000);
}