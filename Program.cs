using System;
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

      Console.WriteLine($"Recieved a request: {request.Name}");

      try
      {
        if (request.Name == "getLoginDetail")
        {
          request.Respond(database.LoginDetails);
        }
        else if (request.Name == "addItem")
        {
          // var (name, amount) = request.GetParams<(string, int)>();
          // var item = new Item(name, amount);
          // database.Items.Add(item);
          // database.SaveChanges();
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
  public DbSet<LoginDetail> LoginDetails { get; set; } = default!;
}


class LoginDetail
{
  public int Id { get; set; } = default!;
  public string Username { get; set; }
  public string Password { get; set; }

  public LoginDetail(string username, string password)
  {
    Username = username;
    Password = password;
  }
}
