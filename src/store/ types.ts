// types.ts
export interface RootState {
    id: string; // Players ID in the game
    hand: Array<string>;
    player: object;
    round: {
      players: {};
      qualificationPool: [];
      mode: string;
      job: string;
      shownCards: Array<string>;
    };
}
