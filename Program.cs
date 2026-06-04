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

          GameName = GameName.Trim();//

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
          var (token, GameName) = request.GetParams<(string?, string)>();

          GameName = GameName.Trim();

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

          var lowerGameName = GameName.ToLower();

          if (database.Games.Any(g => g.GameName.ToLower() == lowerGameName))
          {
            request.Respond<int?>(null);
            continue;
          }

          var game = new Game(GameName, user.Id);

          database.Games.Add(game);
          database.SaveChanges();

          gameStates.Add(game.Id, new GameState());
          Console.WriteLine(game.Id);
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

          var board = gameStates[gameId]!.Board;

          request.Respond(board);
        }

        else if (request.Name == "makeMove")
        {
          var (token, gameId, y, x) = request.GetParams<(string?, int, int, int)>();
          var user = database.Users.FirstOrDefault(u => u.UserToken == token);
          var game = database.Games.FirstOrDefault(g => g.Id == gameId);
          var UserSymbol = 'N'; // N = Not Defined
          if (game?.Player1Id == user?.Id)
          {
            UserSymbol = 'X';
          }
          else if (game?.Player2Id == user?.Id)
          {
            UserSymbol = 'O';
          }
          else
          {
            request.Respond("NotYourGame");
            continue;
          }

          if (gameStates[gameId]!.Board[y*3+x] == 'X' || gameStates[gameId]!.Board[y*3+x] == 'O')
          {
            request.Respond("CantChangeExistingMoves");
            continue;
          }
          else
          {
            gameStates[gameId]!.Board[y*3+x] = UserSymbol;
            request.Respond("MoveCompleted");
          }
        }

        else if (request.Name == "currentTurn")
        {

          var (token, gameId) = request.GetParams<(string, int)>();
          var board = gameStates[gameId].Board;
          var game = database.Games.FirstOrDefault(g => g.Id == gameId);
          var user = database.Users.FirstOrDefault(u => u.UserToken == token);
          var UserSymbol = 'N'; // N = Not Defined

          var xSum = 0;
          var oSum = 0;

          if (game?.Player1Id == user?.Id)
          {
            UserSymbol = 'X';
          }
          else if (game?.Player2Id == user?.Id)
          {
            UserSymbol = 'O';
          }
          else
          {
            request.Respond("NotYourGame");
            continue;
          }

          for (var i = 0; i < gameStates[gameId].Board.GetLength(0); i++)
          {
            for (var j = 0; j < gameStates[gameId].Board.GetLength(0); j++)
            {
              if (board[i*3+j] == 'X')
              {
                xSum++;
              }

              if (board[i*3+j] == 'O')
              {
                oSum++;
              }
            }
            if (xSum == oSum)
            {
              if(UserSymbol == 'X')
              {
                request.Respond("YourTurn");
              }
              else
              {
                request.Respond("OpponetTurn");
              }
            }
            else
            {
              if (UserSymbol == 'X')
              {
                request.Respond("OpponetTurn");
              }
              else
              {
                request.Respond("YourTurn");
              }
            }
          }
        }

        else if (request.Name == "clearGames")
        {
          database.Games.RemoveRange(database.Games);
          database.SaveChanges();

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

class Game(string gameName, int userId)
{
  public int Id { get; set; } = default!;

  public string GameName { get; set; } = gameName;

  public int UserId { get; set; } = userId;

  public User User { get; set; } = default!;

  public int Player1Id { get; set; } = userId;

  public int? Player2Id { get; set; } = null;
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
        Board[y*3+x] = 'E'; // E = empty
      }
    }
  }

}