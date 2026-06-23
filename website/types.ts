


export type User = {
  id: number;
  username: string;
};

export type Game = {
  id: number;
  gameName: string;
  userId: number;
  user: User;
  player1Id: number;
  player2Id: number | null;
};

export type LeaderBoard =
{
  username: string;
  wins: number;
  ties: number;
  losses: number;
};