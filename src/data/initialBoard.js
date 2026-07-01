export function createInitialBoardState() {
  return {
    players: [
      player("p1", "1", 13, 34),
      player("p2", "2", 42, 49),
      player("p3", "3", 76, 37),
      player("p6", "6", 54, 38),
      player("p7", "7", 48, 52),
      player("p10", "10", 61, 25),
    ],
    opponents: [
      opponent("o3", "3", 70, 50),
      opponent("o4", "4", 32, 35),
      opponent("o5", "5", 70, 41),
      opponent("o8", "8", 42, 24),
      opponent("o9", "9", 76, 21),
    ],
    ball: {
      id: "ball_1",
      position: { x: 60, y: 43 },
      ownerPlayerId: "p6",
    },
    equipment: [],
    paths: [],
  };
}

export function createInitialSteps() {
  const initialBoard = createInitialBoardState();

  return [
    {
      id: "step_0",
      order: 0,
      title: "Step 0",
      note: "初始站位。",
      baseStateFromStepId: null,
      state: cloneBoardState(initialBoard),
      paths: [],
    },
  ];
}

export function cloneBoardState(boardState) {
  return {
    players: clonePieces(boardState.players),
    opponents: clonePieces(boardState.opponents),
    equipment: clonePieces(boardState.equipment ?? []),
    ball: boardState.ball
      ? {
          ...boardState.ball,
          position: { ...boardState.ball.position },
        }
      : null,
  };
}

function player(id, number, x, y) {
  return {
    id,
    teamId: "team_home",
    number,
    position: { x, y },
  };
}

function clonePieces(pieces) {
  return pieces.map((piece) => ({
    ...piece,
    position: { ...piece.position },
  }));
}

function opponent(id, number, x, y) {
  return {
    id,
    teamId: "team_away",
    number,
    position: { x, y },
  };
}
