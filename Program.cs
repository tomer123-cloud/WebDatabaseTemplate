using System;
using System.Collections.Generic;
using System.Linq;
using System.Reflection.Metadata;
using System.Text.Json.Serialization;
using Microsoft.EntityFrameworkCore;
using Project.DatabaseUtilities;
using Project.LoggingUtilities;
using Project.ServerUtilities;

class Program
{
  static void Main()
  {
    Dictionary<int, GameState> gameStates = [];

    int port = 5000;

    var server = new Server(port);
    var database = new Database();

    database.Games.RemoveRange(database.Games);
    database.SaveChanges();

    Console.WriteLine("The server is running");
    Console.WriteLine($"Local:   http://localhost:{port}/website/pages/Start.html");
    Console.WriteLine($"Network: http://{Network.GetLocalNetworkIPAddress()}:{port}/website/pages/Start.html");

    while (true)
    {
      var request = server.WaitForRequest();

      Console.WriteLine($"Received a request: {request.Name}");

      try
      {
        if (request.Name == "Login")
        {
          var (username, password) = request.GetParams<(string, string)>();

          var user = database.Users.FirstOrDefault(u => u.Username == username && u.Password == password);

          request.Respond(user?.UserToken);
        }

        else if (request.Name == "Signup")
        {
          var (username, password) = request.GetParams<(string, string)>();

          if (database.Users.Any(u => u.Username == username))
          {
            request.Respond<string?>(null);
            continue;
          }

          var token = Guid.NewGuid().ToString();
          var user = new User(username, password, token);

          database.Users.Add(user);
          database.SaveChanges();

          request.Respond(token);
        }

        else if (request.Name == "getUser")
        {
          var token = request.GetParams<string?>();

          if (token == null)
          {
            request.Respond<User?>(null);
            continue;
          }

          var user = database.Users.FirstOrDefault(u => u.UserToken == token);

          request.Respond(user);
        }

        else if (request.Name == "Logout")
        {
          var token = request.GetParams<string?>();

          var user = database.Users.FirstOrDefault(u => u.UserToken == token);

          if (user != null)
          {
            var games = database.Games.Where(g => g.UserId == user.Id).ToList();

            if (games.Count > 0)
            {
              database.Games.RemoveRange(games);
              database.SaveChanges();
            }
          }

          request.Respond<User?>(null);
        }

        else if (request.Name == "getGames")
        {
          request.Respond(database.Games.Include(g => g.User).OrderBy(g => g.Id));
        }

        else if (request.Name == "getGamesCount")
        {
          request.Respond(database.Games.Count());
        }

        else if (request.Name == "canCreateGame")
        {
          var (token, GameName) = request.GetParams<(string?, string)>();

          GameName = GameName.Trim();

          var user = database.Users.FirstOrDefault(u => u.UserToken == token);

          if (user == null)
          {
            request.Respond("UserNotFound");
            continue;
          }

          if (GameName.Length == 0)
          {
            request.Respond("GameNameEmpty");
            continue;
          }

          var lowerGameName = GameName.ToLower();

          if (database.Games.Any(g => g.GameName.ToLower() == lowerGameName))
          {
            request.Respond("GameNameExists");
            continue;
          }

          request.Respond("CanCreateGame");
        }

        else if (request.Name == "addGame")
        {
          var (token, GameName, playerColor) = request.GetParams<(string?, string, string)>();

          GameName = GameName.Trim();
          playerColor = playerColor.Trim().ToLower();

          var user = database.Users.FirstOrDefault(u => u.UserToken == token);

          if (user == null)
          {
            request.Respond<int?>(null);
            continue;
          }

          if (GameName.Length == 0)
          {
            request.Respond<int?>(null);
            continue;
          }

          if (playerColor != "red" && playerColor != "blue")
          {
            request.Respond<int?>(null);
            continue;
          }

          var lowerGameName = GameName.ToLower();

          if (database.Games.Any(g => g.GameName.ToLower() == lowerGameName))
          {
            request.Respond<int?>(null);
            continue;
          }

          var game = new Game(GameName, user.Id, playerColor);

          database.Games.Add(game);
          database.SaveChanges();

          gameStates.Add(game.Id, new GameState());

          request.Respond<int?>(game.Id);
        }
        else if (request.Name == "deleteMyGame")
        {
          var token = request.GetParams<string?>();

          var user = database.Users.FirstOrDefault(u => u.UserToken == token);

          if (user == null)
          {
            request.Respond("UserNotFound");
            continue;
          }

          var games = database.Games.Where(g => g.UserId == user.Id).ToList();

          if (games.Count == 0)
          {
            request.Respond("NoGameFound");
            continue;
          }

          database.Games.RemoveRange(games);
          database.SaveChanges();

          request.Respond("GameDeleted");
        }

        else if (request.Name == "boardState")
        {
          var gameId = request.GetParams<int>();

          if (!gameStates.ContainsKey(gameId))
          {
            gameStates[gameId] = new GameState();
          }

          var board = gameStates[gameId].Board;

          request.Respond(board);
        }

        else if (request.Name == "joinGame")
        {
          var (token, gameId) = request.GetParams<(string?, int)>();

          var user = database.Users.FirstOrDefault(u => u.UserToken == token);

          if (user == null)
          {
            request.Respond("UserNotFound");
            continue;
          }

          var game = database.Games.FirstOrDefault(g => g.Id == gameId);

          if (game == null)
          {
            request.Respond("GameNotFound");
            continue;
          }

          if (!gameStates.ContainsKey(gameId))
          {
            gameStates[gameId] = new GameState();
          }

          if (game.Player1Id == user.Id || game.Player2Id == user.Id)
          {
            request.Respond("JoinedGame");
            continue;
          }

          if (game.Player2Id == null)
          {
            game.Player2Id = user.Id;

            if (game.Player1Color == "red")
            {
              game.Player2Color = "blue";
            }
            else
            {
              game.Player2Color = "red";
            }

            database.SaveChanges();

            request.Respond("JoinedGame");
            continue;
          }

          request.Respond("GameFull");
        }

        else if (request.Name == "makeMove")
        {
          var (token, gameId, y, x) = request.GetParams<(string?, int, int, int)>();

          var user = database.Users.FirstOrDefault(u => u.UserToken == token);
          var game = database.Games.FirstOrDefault(g => g.Id == gameId);
          var UserSymbol = 'N';

          if (game == null)
          {
            request.Respond("GameNotFound");
            continue;
          }

          if (!gameStates.ContainsKey(gameId))
          {
            gameStates[gameId] = new GameState();
          }

          if (game.Player2Id == null)
          {
            request.Respond("WaitingForPlayer");
            continue;
          }

          if (game.Player1Started == false || game.Player2Started == false)
          {
            request.Respond("GameNotStarted");
            continue;
          }

          if (game.Player1Id == user?.Id)
          {
            UserSymbol = 'X';
          }
          else if (game.Player2Id == user?.Id)
          {
            UserSymbol = 'O';
          }
          else
          {
            request.Respond("NotYourGame");
            continue;
          }

          var index = y * 3 + x;

          if (index < 0 || index > 8)
          {
            request.Respond("InvalidMove");
            continue;
          }

          if (gameStates[gameId].Board[index] == 'X' || gameStates[gameId].Board[index] == 'O')
          {
            request.Respond("CantChangeExistingMoves");
            continue;
          }

          gameStates[gameId].Board[index] = UserSymbol;

          request.Respond("MoveCompleted");
        }

        else if (request.Name == "checkForWin")
        {
          var gameId = request.GetParams<int>();

          if (!gameStates.ContainsKey(gameId))
          {
            gameStates[gameId] = new GameState();
          }

          var winner = CheckWinner(gameStates[gameId].Board);

          if (winner == 'X')
          {
            request.Respond("XWon");
            continue;
          }

          if (winner == 'O')
          {
            request.Respond("OWon");
            continue;
          }

          request.Respond("NoWinner");
        }

        else if (request.Name == "currentTurn")
        {
          var (token, gameId) = request.GetParams<(string?, int)>();

          if (!gameStates.ContainsKey(gameId))
          {
            gameStates[gameId] = new GameState();
          }

          var board = gameStates[gameId].Board;
          var game = database.Games.FirstOrDefault(g => g.Id == gameId);
          var user = database.Users.FirstOrDefault(u => u.UserToken == token);
          var UserSymbol = 'N';

          var xSum = 0;
          var oSum = 0;

          if (game == null)
          {
            request.Respond("GameNotFound");
            continue;
          }

          if (game.Player2Id == null)
          {
            request.Respond("WaitingForPlayer");
            continue;
          }

          if (game.Player1Started == false || game.Player2Started == false)
          {
            request.Respond("GameNotStarted");
            continue;
          }

          if (game.Player1Id == user?.Id)
          {
            UserSymbol = 'X';
          }
          else if (game.Player2Id == user?.Id)
          {
            UserSymbol = 'O';
          }
          else
          {
            request.Respond("NotYourGame");
            continue;
          }

          for (var i = 0; i < board.Length; i++)
          {
            if (board[i] == 'X')
            {
              xSum++;
            }

            if (board[i] == 'O')
            {
              oSum++;
            }
          }

          var currentTurnSymbol = 'X';

          if (xSum > oSum)
          {
            currentTurnSymbol = 'O';
          }

          if (UserSymbol == currentTurnSymbol)
          {
            request.Respond("YourTurn");
          }
          else
          {
            request.Respond("OpponentTurn");
          }
        }

        else if (request.Name == "currentTurnColor")
        {
          var gameId = request.GetParams<int>();

          var game = database.Games.FirstOrDefault(g => g.Id == gameId);

          if (game == null)
          {
            request.Respond("GameNotFound");
            continue;
          }

          if (!gameStates.ContainsKey(gameId))
          {
            gameStates[gameId] = new GameState();
          }

          if (game.Player2Id == null)
          {
            request.Respond("WaitingForPlayer");
            continue;
          }

          if (game.Player1Started == false || game.Player2Started == false)
          {
            request.Respond("GameNotStarted");
            continue;
          }

          var board = gameStates[gameId].Board;

          var xSum = 0;
          var oSum = 0;

          for (var i = 0; i < board.Length; i++)
          {
            if (board[i] == 'X')
            {
              xSum++;
            }

            if (board[i] == 'O')
            {
              oSum++;
            }
          }

          var currentTurnSymbol = 'X';

          if (xSum > oSum)
          {
            currentTurnSymbol = 'O';
          }

          if (currentTurnSymbol == 'X')
          {
            request.Respond(game.Player1Color);
            continue;
          }

          request.Respond(game.Player2Color);
        }

        else if (request.Name == "gameColors")
        {
          var gameId = request.GetParams<int>();

          var game = database.Games.FirstOrDefault(g => g.Id == gameId);

          if (game == null)
          {
            request.Respond<string[]>([]);
            continue;
          }

          var player2Color = game.Player2Color;

          if (player2Color == null)
          {
            if (game.Player1Color == "red")
            {
              player2Color = "blue";
            }
            else
            {
              player2Color = "red";
            }
          }

          request.Respond(new string[] { game.Player1Color, player2Color });
        }

        else if (request.Name == "gameStatus")
        {
          var gameId = request.GetParams<int>();

          var game = database.Games.FirstOrDefault(g => g.Id == gameId);

          if (game == null)
          {
            request.Respond("GameNotFound");
            continue;
          }

          if (game.Player2Id == null)
          {
            request.Respond("WaitingForPlayer");
            continue;
          }

          if (game.Player1Started == true && game.Player2Started == true)
          {
            request.Respond("Ready");
            continue;
          }

          var startedCount = 0;

          if (game.Player1Started == true)
          {
            startedCount++;
          }

          if (game.Player2Started == true)
          {
            startedCount++;
          }

          if (startedCount == 0)
          {
            request.Respond("aPlayerHasAlreadyJoined");
            continue;
          }

          request.Respond("Start1/2");
        }
        else if (request.Name == "startGame")
        {
          var (token, gameId) = request.GetParams<(string?, int)>();

          var user = database.Users.FirstOrDefault(u => u.UserToken == token);

          if (user == null)
          {
            request.Respond("UserNotFound");
            continue;
          }

          var game = database.Games.FirstOrDefault(g => g.Id == gameId);

          if (game == null)
          {
            request.Respond("GameNotFound");
            continue;
          }

          if (game.Player2Id == null)
          {
            request.Respond("WaitingForPlayer");
            continue;
          }

          if (game.Player1Id == user.Id)
          {
            game.Player1Started = true;
          }
          else if (game.Player2Id == user.Id)
          {
            game.Player2Started = true;
          }
          else
          {
            request.Respond("NotYourGame");
            continue;
          }

          game.PlayAgainResetReady = false;

          database.SaveChanges();

          if (game.Player1Started == true && game.Player2Started == true)
          {
            request.Respond("GameStarted");
            continue;
          }

          request.Respond("StartRegistered");
        }

        else if (request.Name == "playAgain")
        {
          var (token, gameId) = request.GetParams<(string?, int)>();

          var user = database.Users.FirstOrDefault(u => u.UserToken == token);

          if (user == null)
          {
            request.Respond("UserNotFound");
            continue;
          }

          var game = database.Games.FirstOrDefault(g => g.Id == gameId);

          if (game == null)
          {
            request.Respond("GameNotFound");
            continue;
          }

          if (game.Player1Id != user.Id && game.Player2Id != user.Id)
          {
            request.Respond("NotYourGame");
            continue;
          }

          if (game.Player2Id == null || game.Player1LeftLobby == true || game.Player2LeftLobby == true)
          {
            request.Respond("OtherPlayerLeft");
            continue;
          }

          if (game.Player1Id == user.Id)
          {
            game.Player1PlayAgain = true;
          }

          if (game.Player2Id == user.Id)
          {
            game.Player2PlayAgain = true;
          }

          if (game.Player1PlayAgain == true && game.Player2PlayAgain == true)
          {
            gameStates[gameId] = new GameState();

            game.Player1Started = false;
            game.Player2Started = false;

            game.Player1PlayAgain = false;
            game.Player2PlayAgain = false;

            game.PlayAgainResetReady = true;

            database.SaveChanges();

            request.Respond("GameReset");
            continue;
          }

          database.SaveChanges();

          request.Respond("PlayAgainRegistered");
        }



        else if (request.Name == "playAgainStatus")
        {
          var (token, gameId) = request.GetParams<(string?, int)>();

          var user = database.Users.FirstOrDefault(u => u.UserToken == token);

          if (user == null)
          {
            request.Respond("UserNotFound");
            continue;
          }

          var game = database.Games.FirstOrDefault(g => g.Id == gameId);

          if (game == null)
          {
            request.Respond("GameNotFound");
            continue;
          }

          if (game.Player1Id != user.Id && game.Player2Id != user.Id)
          {
            request.Respond("NotYourGame");
            continue;
          }

          if (game.Player2Id == null || game.Player1LeftLobby == true || game.Player2LeftLobby == true)
          {
            request.Respond("OtherPlayerLeft");
            continue;
          }

          if (game.PlayAgainResetReady == true)
          {
            request.Respond("GameReset");
            continue;
          }

          var playAgainCount = 0;

          if (game.Player1PlayAgain == true)
          {
            playAgainCount++;
          }

          if (game.Player2PlayAgain == true)
          {
            playAgainCount++;
          }

          if (playAgainCount == 0)
          {
            request.Respond("PlayAgain0/2");
            continue;
          }

          request.Respond("PlayAgain1/2");
        }



        else if (request.Name == "playAgainStatus")
        {
          var (token, gameId) = request.GetParams<(string?, int)>();

          var user = database.Users.FirstOrDefault(u => u.UserToken == token);

          if (user == null)
          {
            request.Respond("UserNotFound");
            continue;
          }

          var game = database.Games.FirstOrDefault(g => g.Id == gameId);

          if (game == null)
          {
            request.Respond("GameNotFound");
            continue;
          }

          if (game.Player1Id != user.Id && game.Player2Id != user.Id)
          {
            request.Respond("NotYourGame");
            continue;
          }

          if (game.Player2Id == null || game.Player1LeftLobby == true || game.Player2LeftLobby == true)
          {
            request.Respond("OtherPlayerLeft");
            continue;
          }

          if (game.PlayAgainResetReady == true)
          {
            request.Respond("GameReset");
            continue;
          }

          var playAgainCount = 0;

          if (game.Player1PlayAgain == true)
          {
            playAgainCount++;
          }

          if (game.Player2PlayAgain == true)
          {
            playAgainCount++;
          }

          if (playAgainCount == 0)
          {
            request.Respond("PlayAgain0/2");
            continue;
          }

          request.Respond("PlayAgain1/2");
        }

        else if (request.Name == "leaveGame")
        {
          var (token, gameId) = request.GetParams<(string?, int)>();

          var user = database.Users.FirstOrDefault(u => u.UserToken == token);

          if (user == null)
          {
            request.Respond("UserNotFound");
            continue;
          }

          var game = database.Games.FirstOrDefault(g => g.Id == gameId);

          if (game == null)
          {
            request.Respond("GameNotFound");
            continue;
          }

          if (game.Player1Id == user.Id)
          {
            game.Player1LeftLobby = true;
          }
          else if (game.Player2Id == user.Id)
          {
            game.Player2LeftLobby = true;
          }
          else
          {
            request.Respond("NotYourGame");
            continue;
          }

          database.SaveChanges();

          request.Respond("LeftGame");
        }

        else if (request.Name == "leaveGame")
        {
          var (token, gameId) = request.GetParams<(string?, int)>();

          var user = database.Users.FirstOrDefault(u => u.UserToken == token);

          if (user == null)
          {
            request.Respond("UserNotFound");
            continue;
          }

          var game = database.Games.FirstOrDefault(g => g.Id == gameId);

          if (game == null)
          {
            request.Respond("GameNotFound");
            continue;
          }

          if (game.Player1Id == user.Id)
          {
            game.Player1LeftLobby = true;
          }
          else if (game.Player2Id == user.Id)
          {
            game.Player2LeftLobby = true;
          }
          else
          {
            request.Respond("NotYourGame");
            continue;
          }

          database.SaveChanges();

          request.Respond("LeftGame");
        }



        else if (request.Name == "cancelGame")
        {
          var (token, gameId) = request.GetParams<(string?, int)>();

          var user = database.Users.FirstOrDefault(u => u.UserToken == token);

          if (user == null)
          {
            request.Respond("UserNotFound");
            continue;
          }

          var game = database.Games.FirstOrDefault(g => g.Id == gameId);

          if (game == null)
          {
            request.Respond("GameNotFound");
            continue;
          }

          if (game.Player2Id != null)
          {
            request.Respond("aPlayerHasAlreadyJoined");
            continue;
          }

          if (game.Player1Id != user.Id)
          {
            request.Respond("NotYourGame");
            continue;
          }

          gameStates.Remove(gameId);

          database.Games.Remove(game);
          database.SaveChanges();

          request.Respond("GameDeleted");
        }

        else if (request.Name == "clearGames")
        {
          database.Games.RemoveRange(database.Games);
          database.SaveChanges();

          gameStates.Clear();

          request.Respond(true);
        }
      }

      catch (Exception exception)
      {
        request.SetStatusCode(500);
        Log.WriteException(exception);
      }
    }
  }

  static char CheckWinner(char[] board)
  {
    if (board[0] != 'E' && board[0] == board[1] && board[1] == board[2])
    {
      return board[0];
    }

    if (board[3] != 'E' && board[3] == board[4] && board[4] == board[5])
    {
      return board[3];
    }

    if (board[6] != 'E' && board[6] == board[7] && board[7] == board[8])
    {
      return board[6];
    }

    if (board[0] != 'E' && board[0] == board[3] && board[3] == board[6])
    {
      return board[0];
    }

    if (board[1] != 'E' && board[1] == board[4] && board[4] == board[7])
    {
      return board[1];
    }

    if (board[2] != 'E' && board[2] == board[5] && board[5] == board[8])
    {
      return board[2];
    }

    if (board[0] != 'E' && board[0] == board[4] && board[4] == board[8])
    {
      return board[0];
    }

    if (board[2] != 'E' && board[2] == board[4] && board[4] == board[6])
    {
      return board[2];
    }

    return 'N';
  }
}

class Database() : DatabaseCore("database")
{
  public DbSet<User> Users { get; set; } = default!;
  public DbSet<Game> Games { get; set; } = default!;
}

class User(string username, string password, string userToken)
{
  public int Id { get; set; } = default!;

  public string Username { get; set; } = username;

  [JsonIgnore] public string Password { get; set; } = password;

  [JsonIgnore] public string UserToken { get; set; } = userToken;
}

class Game(string gameName, int userId, string player1Color)
{
  public int Id { get; set; } = default!;

  public string GameName { get; set; } = gameName;

  public int UserId { get; set; } = userId;

  public User User { get; set; } = default!;

  public int Player1Id { get; set; } = userId;

  public int? Player2Id { get; set; } = null;

  public bool Player1Started { get; set; } = false;

  public bool Player2Started { get; set; } = false;

  public string Player1Color { get; set; } = player1Color;

  public string? Player2Color { get; set; } = null;

  public bool Player1PlayAgain { get; set; } = false;

  public bool Player2PlayAgain { get; set; } = false;

  public bool PlayAgainResetReady { get; set; } = false;

  public bool Player1LeftLobby { get; set; } = false;

  public bool Player2LeftLobby { get; set; } = false;
}

class GameState
{
  public int GameId { get; set; }

  public char[] Board { get; set; }

  public GameState()
  {
    Board = new char[9];

    for (int y = 0; y < 3; y++)
    {
      for (int x = 0; x < 3; x++)
      {
        Board[y * 3 + x] = 'E';
      }
    }
  }
}

class LeaderBoard(string username, int wins, int ties, int losses)

{
  string Username { get; set; } = username;
  int Wins { get; set; } = wins;
  int Ties { get; set; } = ties;
  int Losses { get; set; } = losses;
}