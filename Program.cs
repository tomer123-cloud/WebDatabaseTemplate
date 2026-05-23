using System;
using System.Linq;
using System.Text.Json.Serialization;
using Microsoft.EntityFrameworkCore;
using Project.DatabaseUtilities;
using Project.LoggingUtilities;
using Project.ServerUtilities;

class Program
{
  static void Main()
  {
    int port = 5000;

    var server = new Server(port);
    var database = new Database();

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