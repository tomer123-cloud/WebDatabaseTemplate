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
          request.Respond<User?>(null);
        }

        else if(request.Name=="getGames")
        {
          request.Respond(database.Games);
        }

        else if(request.Name=="getGamesCount")
        {
          request.Respond(database.Games.Count());
        }

        else if (request.Name=="addGame")
        {
          var (token, GameName) = request.GetParams<(string, string)>();
          var user = database.Users.FirstOrDefault(u => u.UserToken == token)!;

          var game = new Game(GameName, user.Id);
          database.Games.Add(game);
          database.SaveChanges();
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


class Game(string gameName,int userId )
{
  public int Id {get;set;}=default!;
  public int UserId { get; set; } = userId;
  public User Username {get;set;} =default!;
  public string GameName {get;set;} =gameName!;
}