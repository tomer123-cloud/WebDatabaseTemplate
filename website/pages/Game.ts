// Imports the send function for communicating with the C# server.
// Imports getSearchParam for reading values from the page URL.
import { send, getSearchParam } from "clientUtilities";


// Reads the gameId value from the URL and converts it from string to number.
var GameId = Number(getSearchParam("gameId"));

// Gets the saved login token of the current user from localStorage.
var token = localStorage.getItem("userToken");


// Finds the button with the id Cell00 and saves it as an HTML button.
var Cell00 = document.querySelector<HTMLButtonElement>("#Cell00")!;

// Finds the button with the id Cell01.
var Cell01 = document.querySelector<HTMLButtonElement>("#Cell01")!;

// Finds the button with the id Cell02.
var Cell02 = document.querySelector<HTMLButtonElement>("#Cell02")!;


// Finds the button with the id Cell10.
var Cell10 = document.querySelector<HTMLButtonElement>("#Cell10")!;

// Finds the button with the id Cell11.
var Cell11 = document.querySelector<HTMLButtonElement>("#Cell11")!;

// Finds the button with the id Cell12.
var Cell12 = document.querySelector<HTMLButtonElement>("#Cell12")!;


// Finds the button with the id Cell20.
var Cell20 = document.querySelector<HTMLButtonElement>("#Cell20")!;

// Finds the button with the id Cell21.
var Cell21 = document.querySelector<HTMLButtonElement>("#Cell21")!;

// Finds the button with the id Cell22.
var Cell22 = document.querySelector<HTMLButtonElement>("#Cell22")!;


// Finds the div that covers the game while waiting or when the game ends.
var WaitingForPlayerDiv = document.querySelector<HTMLElement>("#WaitingForPlayerDiv")!;

// Finds the element that displays the main message inside the waiting box.
var WaitingText = document.querySelector<HTMLElement>("#WaitingText")!;

// Finds the element that displays the current start status.
var StartStatusText = document.querySelector<HTMLElement>("#StartStatusText")!;


// Finds the Start button.
var StartGameButton = document.querySelector<HTMLButtonElement>("#StartGameButton")!;

// Finds the Cancel button.
var CancelGameButton = document.querySelector<HTMLButtonElement>("#CancelGameButton")!;


// Finds the div that contains all the buttons shown after the game ends.
var GameOverButtonsDiv = document.querySelector<HTMLElement>("#GameOverButtonsDiv")!;

// Finds the Play Again button.
var PlayAgainButton = document.querySelector<HTMLButtonElement>("#PlayAgainButton")!;

// Finds the element that shows how many players selected Play Again.
var PlayAgainStatusDiv = document.querySelector<HTMLElement>("#PlayAgainStatusDiv")!;

// Finds the Start New Game button.
var StartNewGameButton = document.querySelector<HTMLButtonElement>("#StartNewGameButton")!;

// Finds the Back To Lobby button.
var BackToLobbyButton = document.querySelector<HTMLButtonElement>("#BackToLobbyButton")!;





// Creates an array that contains all nine board buttons in board order.
var Board: HTMLButtonElement[] = [
    // Adds the three buttons from the first row.
    Cell00, Cell01, Cell02,

    // Adds the three buttons from the second row.
    Cell10, Cell11, Cell12,

    // Adds the three buttons from the third row.
    Cell20, Cell21, Cell22
];


// Stores the color used by player 1.
// Red is only the default value until the real color is received from C#.
var Player1Color = "red";

// Stores the color used by player 2.
// Blue is only the default value until the real color is received from C#.
var Player2Color = "blue";


// Stores the last board received from the server.
// null means that no board has been received yet.
var LastBoardState: string[] | null = null;

// Stores whether the player is currently allowed to play.
var CanPlay: boolean = false;

// Stores whether the current game has already ended.
var GameFinished: boolean = false;

// Stores whether this browser is waiting for the Play Again reset.
var WaitingForPlayAgainReset: boolean = false;


/* ---------- Helper functions ---------- */


// Enables or disables all the buttons on the game board.
function SetBoardDisabled(disabled: boolean) {

    // Goes through every button inside the Board array.
    for (var i = 0; i < Board.length; i++) {

        // Gives the current button the disabled value received by the function.
        Board[i].disabled = disabled;
    }
}





// Removes every X and O currently displayed on the screen.
function ClearBoardOnScreen() {

    // Goes through every board button.
    for (var i = 0; i < Board.length; i++) {

        // Removes the text from the current board button.
        Board[i].innerText = "";

        // Removes the special text color from the current board button.
        Board[i].style.color = "";
    }
}


// Receives a color name and returns the matching color code for X or O.
function GetColorCode(colorName: string) {

    // Checks whether the received color is red.
    if (colorName == "red") {

        // Returns the red color code.
        return "#d62828";
    }

    // Checks whether the received color is blue.
    if (colorName == "blue") {

        // Returns the blue color code.
        return "#1d4ed8";
    }

    // Returns the default light color when the color is not red or blue.
    return "#f4f1e8";
}


// Receives a color name and returns the matching background color.
function GetBackgroundColorCode(colorName: string) {

    // Checks whether the received color is red.
    if (colorName == "red") {

        // Returns the dark red background color.
        return "#5f0f0f";
    }

    // Checks whether the received color is blue.
    if (colorName == "blue") {

        // Returns the dark blue background color.
        return "#0b2f66";
    }

    // Returns the default dark background color.
    return "#202124";
}


// Displays a board value inside a button and gives it the correct color.
function SetCellTextAndColor(cell: HTMLButtonElement, value: string) {

    // Checks whether the cell is empty.
    if (value == "E") {

        // Removes the text from the empty cell.
        cell.innerText = "";

        // Removes any color previously applied to the cell.
        cell.style.color = "";

        // Stops the function because there is nothing else to display.
        return;
    }

    // Displays the X or O received from the server.
    cell.innerText = value;

    // Checks whether the received value is X.
    if (value == "X") {

        // Gives X the color selected by player 1.
        cell.style.color = GetColorCode(Player1Color);
    }

    // Checks whether the received value is O.
    if (value == "O") {

        // Gives O the color used by player 2.
        cell.style.color = GetColorCode(Player2Color);
    }
}


// Compares two board arrays and checks whether they contain the same values.
function BoardsAreEqual(board1: string[], board2: string[]) {

    // Checks whether the two arrays have different lengths.
    if (board1.length != board2.length) {

        // Returns false because arrays with different lengths cannot be equal.
        return false;
    }

    // Goes through every position in the arrays.
    for (var i = 0; i < board1.length; i++) {

        // Checks whether the values at the current position are different.
        if (board1[i] != board2[i]) {

            // Returns false as soon as one different value is found.
            return false;
        }
    }

    // Returns true because every value in both arrays is equal.
    return true;
}


/* ---------- Screen display functions ---------- */


// Displays the screen used while waiting for another player.
function ShowWaitingScreen() {

    // Makes the waiting screen visible and keeps its flex layout.
    WaitingForPlayerDiv.style.display = "flex";

    // Makes the Start button visible.
    StartGameButton.style.display = "block";

    // Makes the Cancel button visible.
    CancelGameButton.style.display = "block";

    // Hides the game-over buttons.
    GameOverButtonsDiv.style.display = "none";

    // Restores the normal dark background color.
    document.body.style.backgroundColor = "#202124";
}


// Displays the screen where both players can press Start.
function ShowStartScreen() {

    // Makes the waiting/start screen visible.
    WaitingForPlayerDiv.style.display = "flex";

    // Makes the Start button visible.
    StartGameButton.style.display = "block";

    // Hides the Cancel button because another player has already joined.
    CancelGameButton.style.display = "none";

    // Hides the game-over buttons.
    GameOverButtonsDiv.style.display = "none";

    // Restores the normal dark background color.
    document.body.style.backgroundColor = "#202124";
}


// Displays the game board and hides the popup screen.
function ShowGameScreen() {

    // Hides the waiting and game-over screen.
    WaitingForPlayerDiv.style.display = "none";

    // Keeps the Start button available for later screen changes.
    StartGameButton.style.display = "block";

    // Hides the Cancel button.
    CancelGameButton.style.display = "none";

    // Hides the game-over buttons.
    GameOverButtonsDiv.style.display = "none";
}


// Displays the popup screen shown after the game ends.
function ShowGameOverScreen() {

    // Makes the popup screen visible.
    WaitingForPlayerDiv.style.display = "flex";

    // Hides the Start button.
    StartGameButton.style.display = "none";

    // Hides the Cancel button.
    CancelGameButton.style.display = "none";

    // Shows the game-over buttons.
    GameOverButtonsDiv.style.display = "flex";
}


/* ---------- Server update functions ---------- */


// Loads the two player colors from the C# server.
async function LoadGameColors() {

    // Sends the game id to the gameColors request and waits for a string array.
    var colors = await send<string[]>("gameColors", GameId);

    // Checks that the server returned at least two colors.
    if (colors.length >= 2) {

        // Saves the first color as player 1's color.
        Player1Color = colors[0];

        // Saves the second color as player 2's color.
        Player2Color = colors[1];
    }
}


// Changes the page background according to the color of the current turn.
async function UpdateBackgroundByTurnColor() {

    // Asks the server which color belongs to the player whose turn it is.
    var turnColor = await send<string>("currentTurnColor", GameId);

    // Converts the color name into a color code and applies it to the body.
    document.body.style.backgroundColor = GetBackgroundColorCode(turnColor);
}


// Gets the current board from the server and displays it.
async function CheckBoardState() {

    // Requests the latest board array from the C# server.
    var NewBoardState = await send<string[]>("boardState", GameId);

    // Checks whether this is the first board or whether the board changed.
    if (LastBoardState == null || BoardsAreEqual(LastBoardState, NewBoardState) == false) {

        // Saves the newly received board as the last known board.
        LastBoardState = NewBoardState;
    }

    // Goes through every value in the new board.
    for (var i = 0; i < NewBoardState.length; i++) {

        // Displays the value in the matching button and gives it the correct color.
        SetCellTextAndColor(Board[i], NewBoardState[i]);
    }
}


// Checks whether the current user is allowed to make a move.
async function CurrentTurn() {

    // Sends the token and game id to the server and returns its answer.
    return await send<string>("currentTurn", token, GameId);
}


// Checks the current state of the game before it begins.
async function CheckGameStatus() {

    // Checks whether the game already ended.
    if (GameFinished == true) {

        // Stops the function so the game-over screen is not replaced.
        return;
    }

    // Requests the current game status from the server.
    var status = await send<string>("gameStatus", GameId);

    // Checks whether both players pressed Start.
    if (status == "Ready") {

        // Allows moves on the board.
        CanPlay = true;

        // Enables all board buttons.
        SetBoardDisabled(false);

        // Shows the main game screen.
        ShowGameScreen();

        // Updates the background according to whose turn it is.
        await UpdateBackgroundByTurnColor();

        // Stops the function because the correct screen is now displayed.
        return;
    }

    // Prevents the user from making moves while the game is not ready.
    CanPlay = false;

    // Disables all board buttons.
    SetBoardDisabled(true);

    // Checks whether only one player is currently inside the game.
    if (status == "WaitingForPlayer") {

        // Shows the waiting screen.
        ShowWaitingScreen();

        // Displays a message explaining that another player is needed.
        WaitingText.innerText = "Waiting for other player...";

        // Displays that zero players pressed Start.
        StartStatusText.innerText = "Start 0/2";

        // Disables the Start button.
        StartGameButton.disabled = true;

        // Shows the Cancel button because the creator is still alone.
        CancelGameButton.style.display = "block";

        // Stops the function after displaying the correct state.
        return;
    }

    // Checks whether both players joined and nobody pressed Start yet.
    if (status == "aPlayerHasAlreadyJoined" || status == "Start0/2") {

        // Shows the Start screen.
        ShowStartScreen();

        // Displays that both players are inside the game.
        WaitingText.innerText = "Both players are here.";

        // Displays that zero out of two players pressed Start.
        StartStatusText.innerText = "Start 0/2";

        // Enables the Start button.
        StartGameButton.disabled = false;

        // Stops the function after displaying the correct state.
        return;
    }

    // Checks whether one out of the two players pressed Start.
    if (status == "Start1/2") {

        // Shows the Start screen.
        ShowStartScreen();

        // Displays a message explaining that one player is still missing.
        WaitingText.innerText = "Waiting for both players to press start.";

        // Displays that one out of two players pressed Start.
        StartStatusText.innerText = "Start 1/2";

        // Keeps the Start button enabled for the player who has not pressed it yet.
        StartGameButton.disabled = false;

        // Stops the function after displaying the correct state.
        return;
    }

    // Checks whether the requested game no longer exists.
    if (status == "GameNotFound") {

        // Sends the user back to the lobby page.
        location.href = "/website/pages/Lobby.html";
    }
}


// Checks whether X won, O won, or the game ended in a tie.
async function CheckForWin() {

    // Asks the server to check the current board for a winner.
    var winResult = await send<string>("checkForWin", GameId);

    // Checks whether the game still has no winner.
    if (winResult == "NoWinner") {

        // Stops because the game should continue.
        return;
    }

    // Marks the current game as finished.
    GameFinished = true;

    // Prevents any more moves.
    CanPlay = false;

    // Disables every board button.
    SetBoardDisabled(true);

    // Displays the game-over screen.
    ShowGameOverScreen();

    // Checks whether X won.
    if (winResult == "XWon") {

        // Displays the X victory message.
        WaitingText.innerText = "X Won!";

        // Displays that the game is over.
        StartStatusText.innerText = "Game Over";
    }

    // Checks whether O won.
    if (winResult == "OWon") {

        // Displays the O victory message.
        WaitingText.innerText = "O Won!";

        // Displays that the game is over.
        StartStatusText.innerText = "Game Over";
    }

    // Checks whether the game ended in a tie.
    if (winResult == "Tie") {

        // Displays the tie message.
        WaitingText.innerText = "Tie!";

        // Displays that the game is over.
        StartStatusText.innerText = "Game Over";
    }

    // Checks how many players selected Play Again.
    await CheckPlayAgainStatus();
}


// Checks the current Play Again state after a game ends.
async function CheckPlayAgainStatus() {
    // Stops if the game has not ended yet.
    if (GameFinished == false) {
        // Leaves the function because Play Again is only relevant after game over.
        return;
    }

    // Requests the current Play Again status from the server.
    var playAgainStatus = await send<string>("playAgainStatus", token, GameId);

    // Checks whether no player selected Play Again.
    if (playAgainStatus == "PlayAgain0/2") {
        // Displays that zero out of two players selected Play Again.
        PlayAgainStatusDiv.innerText = "0/2";

        // Keeps the Play Again button enabled.
        PlayAgainButton.disabled = false;

        // Stops after handling this status.
        return;
    }

    // Checks whether one player selected Play Again.
    if (playAgainStatus == "PlayAgain1/2") {
        // Displays that one out of two players selected Play Again.
        PlayAgainStatusDiv.innerText = "1/2";

        // Keeps the Play Again button enabled.
        PlayAgainButton.disabled = false;

        // Stops after handling this status.
        return;
    }

    // Checks whether one of the players left the game.
    if (playAgainStatus == "OtherPlayerLeft") {
        // Displays a message explaining that the other player left.
        PlayAgainStatusDiv.innerText = "the other player has left the lobby";

        // Disables Play Again because two players are required.
        PlayAgainButton.disabled = true;

        // Stops after handling this status.
        return;
    }

    // Checks whether both players selected Play Again and the server reset the game.
    if (playAgainStatus == "GameReset") {
        // Checks whether this browser is currently expecting the reset.
        if (WaitingForPlayAgainReset == false) {
            // Ignores the reset when this browser did not request it.
            return;
        }

        // Marks that this browser is no longer waiting for the reset.
        WaitingForPlayAgainReset = false;

        // Marks the new game as not finished.
        GameFinished = false;

        // Prevents moves until both players press Start again.
        CanPlay = false;

        // Removes the saved previous board so the reset board can be loaded.
        LastBoardState = null;


        // Removes all displayed X and O values from the page.
        ClearBoardOnScreen();

        // Reloads the players' selected colors.
        await LoadGameColors();

        // Checks the new game status.
        await CheckGameStatus();

        // Loads and displays the reset board.
        await CheckBoardState();

        // Stops after handling the reset.
        return;
    }
}


/* ---------- First join ---------- */


// Tries to join the game when the page is opened.
var joinGameResult = await send<string>("joinGame", token, GameId);

// Prints the server response in the browser console.
console.log("joinGameResult:", joinGameResult);

// Checks whether the login token did not match any user.
if (joinGameResult == "UserNotFound") {
    // Sends the visitor back to the Start page.
    location.href = "/website/pages/Start.html";
}

// Checks whether the game does not exist or already has two players.
if (joinGameResult == "GameNotFound" || joinGameResult == "GameFull") {
    // Sends the user back to the Lobby page.
    location.href = "/website/pages/Lobby.html";
}


// Loads the colors selected for the current game.
await LoadGameColors();

// Clears all X and O values currently displayed on the page.
ClearBoardOnScreen();


/* ---------- Button clicks ---------- */


// Runs when the Start button is clicked.
StartGameButton.onclick = async function () {
    // Tells the server that this player pressed Start.
    var startResult = await send<string>("startGame", token, GameId);

    // Prints the server response in the browser console.
    console.log("startResult:", startResult);

    // Reloads the player colors.
    await LoadGameColors();

    // Checks whether both players are ready.
    await CheckGameStatus();

    // Loads the current board from the server.
    await CheckBoardState();

    // Checks whether the board already contains a winning result.
    await CheckForWin();
};


// Runs when the Cancel button is clicked.
CancelGameButton.onclick = async function () {
    // Asks the server to cancel and delete the current game.
    await send<string>("cancelGame", token, GameId);

    // Sends the user back to the Lobby page.
    location.href = "/website/pages/Lobby.html";
};


// Runs when the Play Again button is clicked.
PlayAgainButton.onclick = async function () {
    // Checks whether the Play Again button is disabled.
    if (PlayAgainButton.disabled == true) {
        // Stops because a disabled button should not send a request.
        return;
    }

    // Marks that this browser is waiting for the server to reset the game.
    WaitingForPlayAgainReset = true;

    // Tells the server that this player selected Play Again.
    var playAgainResult = await send<string>("playAgain", token, GameId);

    // Prints the server response in the browser console.
    console.log("playAgainResult:", playAgainResult);

    // Checks the updated Play Again status.
    await CheckPlayAgainStatus();
};


// Runs when the Start New Game button is clicked.
StartNewGameButton.onclick = async function () {
    // Tells the server that this player left the current game.
    await send<string>("leaveGame", token, GameId);

    // Sends the player to the Lobby page to create or join another game.
    location.href = "/website/pages/Lobby.html";
};


// Runs when the Back To Lobby button is clicked.
BackToLobbyButton.onclick = async function () {
    // Tells the server that this player left the current game.
    await send<string>("leaveGame", token, GameId);

    // Sends the player back to the Lobby page.
    location.href = "/website/pages/Lobby.html";
};


// Goes through the three rows of the board.
for (let i = 0; i < 3; i++) {
    // Goes through the three columns of the current row.
    for (let j = 0; j < 3; j++) {
        // Gives the matching board button an onclick function.
        Board[i * 3 + j].onclick = async function () {
            // Checks whether the game is currently ready for moves.
            if (CanPlay == false) {
                // Prints an explanation in the console.
                console.log("Game has not started yet");

                // Stops because the player cannot make a move yet.
                return;
            }

            // Asks the server whether it is this user's turn.
            var turnResult = await CurrentTurn();

            // Checks whether the server says it is not this user's turn.
            if (turnResult != "YourTurn") {
                // Prints an explanation in the console.
                console.log("It is not your turn");

                // Stops without sending a move.
                return;
            }

            // Sends the selected row and column to the makeMove request.
            var moveResult = await send<string>("makeMove", token, GameId, i, j);

            // Prints the move result in the browser console.
            console.log(moveResult);

            // Loads the updated board after the move.
            await CheckBoardState();

            // Checks whether the move created a win or tie.
            await CheckForWin();

            // Checks whether the game is still active.
            if (GameFinished == false) {
                // Changes the background to the color of the next player's turn.
                await UpdateBackgroundByTurnColor();
            }
        };
    }
}


/* ---------- First load and automatic updates ---------- */


// Loads the player colors when the page first opens.
await LoadGameColors();

// Checks the current game status when the page first opens.
await CheckGameStatus();

// Loads the current board when the page first opens.
await CheckBoardState();

// Checks whether the game is already finished.
await CheckForWin();


// Runs the following code repeatedly every two seconds.
setInterval(async function () {
    // Reloads the current player colors.
    await LoadGameColors();

    // Checks whether players joined or pressed Start.
    await CheckGameStatus();

    // Loads any new moves from the server.
    await CheckBoardState();

    // Checks whether the game ended.
    await CheckForWin();

    // Checks whether players selected Play Again or left the game.
    await CheckPlayAgainStatus();

    // Sets the interval time to 2000 milliseconds, which equals two seconds.
}, 2000);