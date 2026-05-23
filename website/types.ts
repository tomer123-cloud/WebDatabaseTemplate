export type Item = {
  name: string;
  amount: number;
};


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