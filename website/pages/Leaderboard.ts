import { send } from "clientUtilities";
 import { LeaderBoard } from "types";


var LeaderboardTableBody = document.querySelector<HTMLTableSectionElement>("#LeaderboardTableBody")!;


async function LoadLeaderBoard()
{
  LeaderboardTableBody.innerHTML = "";

  var leaderboard = await send<LeaderBoard[]>("getLeaderboard");

  if (leaderboard.length == 0)
  {
    var EmptyRow = document.createElement("tr");

    var EmptyCell = document.createElement("td");
    EmptyCell.colSpan = 5;
    EmptyCell.innerText = "No players yet";

    EmptyRow.append(EmptyCell);
    LeaderboardTableBody.append(EmptyRow);

    return;
  }

  for (let i = 0; i < leaderboard.length; i++)
  {
    var PlayerRow = document.createElement("tr");

    var RankCell = document.createElement("td");
    RankCell.innerText = (i + 1).toString();

    var UsernameCell = document.createElement("td");
    UsernameCell.innerText = leaderboard[i].username;

    var WinsCell = document.createElement("td");
    WinsCell.innerText = leaderboard[i].wins.toString();

    var TiesCell = document.createElement("td");
    TiesCell.innerText = leaderboard[i].ties.toString();

    var LossesCell = document.createElement("td");
    LossesCell.innerText = leaderboard[i].losses.toString();

    PlayerRow.append(RankCell);
    PlayerRow.append(UsernameCell);
    PlayerRow.append(WinsCell);
    PlayerRow.append(TiesCell);
    PlayerRow.append(LossesCell);

    LeaderboardTableBody.append(PlayerRow);
  }
}


await LoadLeaderBoard();

setInterval(async function ()
{
  await LoadLeaderBoard();
}, 5000);