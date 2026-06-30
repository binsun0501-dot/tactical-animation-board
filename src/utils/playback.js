export const PLAYBACK_STEP_DURATION_MS = 1400;

export function createBoardStateFromStep(step) {
  return {
    ...step.state,
    paths: step.paths,
  };
}

export function resolvePlaybackFrame(steps, playback) {
  if (!playback || playback.status === "idle" || steps.length === 0) {
    return null;
  }

  if (steps.length === 1) {
    const onlyStep = steps[0];
    return {
      boardState: createBoardStateFromStep(onlyStep),
      fromStep: onlyStep,
      toStep: onlyStep,
      displayStep: onlyStep,
      displayStepIndex: 0,
    };
  }

  const lastSegmentIndex = steps.length - 2;
  const segmentIndex = clamp(playback.segmentIndex, 0, lastSegmentIndex);
  const fromStep = steps[segmentIndex];
  const toStep = steps[segmentIndex + 1];
  const progress = clamp(playback.progress, 0, 1);

  return {
    boardState: interpolateBoardState(fromStep.state, toStep.state, toStep.paths, progress),
    fromStep,
    toStep,
    displayStep: toStep,
    displayStepIndex: segmentIndex + 1,
  };
}

export function interpolateBoardState(fromState, toState, paths, progress) {
  return {
    players: interpolatePieces(fromState.players, toState.players, progress),
    opponents: interpolatePieces(fromState.opponents, toState.opponents, progress),
    ball: interpolateBall(fromState.ball, toState.ball, progress),
    paths,
  };
}

function interpolatePieces(fromPieces, toPieces, progress) {
  return toPieces.map((toPiece) => {
    const fromPiece = fromPieces.find((piece) => piece.id === toPiece.id) ?? toPiece;

    return {
      ...toPiece,
      position: interpolatePoint(fromPiece.position, toPiece.position, progress),
    };
  });
}

function interpolateBall(fromBall, toBall, progress) {
  if (!toBall) {
    return null;
  }

  const fromPosition = fromBall?.position ?? toBall.position;

  return {
    ...toBall,
    position: interpolatePoint(fromPosition, toBall.position, progress),
  };
}

function interpolatePoint(fromPoint, toPoint, progress) {
  return {
    x: fromPoint.x + (toPoint.x - fromPoint.x) * progress,
    y: fromPoint.y + (toPoint.y - fromPoint.y) * progress,
  };
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}
