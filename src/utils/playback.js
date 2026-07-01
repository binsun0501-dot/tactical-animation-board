export const PLAYBACK_STEP_DURATION_MS = 1400;

const MIN_MOVEMENT_DISTANCE = 0.8;
const PATH_START_MATCH_DISTANCE = 12;
const PATH_END_MATCH_DISTANCE = 16;

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
  const runPaths = paths.filter((path) => path.type === "run");
  const passPaths = paths.filter((path) => path.type === "pass");
  const usedRunPathIds = new Set();

  return {
    players: interpolatePieces(
      fromState.players,
      toState.players,
      runPaths,
      usedRunPathIds,
      progress,
    ),
    opponents: interpolatePieces(
      fromState.opponents,
      toState.opponents,
      runPaths,
      usedRunPathIds,
      progress,
    ),
    equipment: toState.equipment ?? fromState.equipment ?? [],
    ball: interpolateBall(fromState.ball, toState.ball, passPaths, progress),
    paths,
  };
}

function interpolatePieces(fromPieces, toPieces, candidatePaths, usedPathIds, progress) {
  return toPieces.map((toPiece) => {
    const fromPiece = fromPieces.find((piece) => piece.id === toPiece.id) ?? toPiece;
    const path = findMatchingPath(
      fromPiece.position,
      toPiece.position,
      candidatePaths,
      usedPathIds,
    );

    return {
      ...toPiece,
      position: path
        ? interpolatePath(path, fromPiece.position, toPiece.position, progress)
        : interpolatePoint(fromPiece.position, toPiece.position, progress),
    };
  });
}

function interpolateBall(fromBall, toBall, candidatePaths, progress) {
  if (!toBall) {
    return null;
  }

  const fromPosition = fromBall?.position ?? toBall.position;
  const usedPathIds = new Set();
  const path = findMatchingPath(
    fromPosition,
    toBall.position,
    candidatePaths,
    usedPathIds,
  );

  return {
    ...toBall,
    position: path
      ? interpolatePath(path, fromPosition, toBall.position, progress)
      : interpolatePoint(fromPosition, toBall.position, progress),
  };
}

function interpolatePoint(fromPoint, toPoint, progress) {
  return {
    x: fromPoint.x + (toPoint.x - fromPoint.x) * progress,
    y: fromPoint.y + (toPoint.y - fromPoint.y) * progress,
  };
}

function interpolatePath(path, fromPosition, toPosition, progress) {
  const pathPoint = getPointOnPath(path, progress);
  const basePoint = interpolatePoint(path.from, path.to, progress);
  const straightPoint = interpolatePoint(fromPosition, toPosition, progress);

  return {
    x: straightPoint.x + (pathPoint.x - basePoint.x),
    y: straightPoint.y + (pathPoint.y - basePoint.y),
  };
}

function getPointOnPath(path, progress) {
  const points = Array.isArray(path.points) && path.points.length >= 2
    ? path.points
    : [path.from, path.to];
  const segments = points.slice(1).map((point, index) => ({
    from: points[index],
    to: point,
  }));
  const lengths = segments.map((segment) => getDistance(segment.from, segment.to));
  const totalLength = lengths.reduce((sum, length) => sum + length, 0);

  if (totalLength === 0) {
    return path.to;
  }

  let remainingLength = totalLength * progress;

  for (let index = 0; index < segments.length; index += 1) {
    const segmentLength = lengths[index];
    if (remainingLength <= segmentLength) {
      const segmentProgress = segmentLength === 0 ? 1 : remainingLength / segmentLength;
      return interpolatePoint(segments[index].from, segments[index].to, segmentProgress);
    }
    remainingLength -= segmentLength;
  }

  return points[points.length - 1];
}

function findMatchingPath(fromPosition, toPosition, candidatePaths, usedPathIds) {
  if (getDistance(fromPosition, toPosition) < MIN_MOVEMENT_DISTANCE) {
    return null;
  }

  const scoredPaths = candidatePaths
    .filter((path) => !usedPathIds.has(path.id))
    .map((path) => {
      const startDistance = getDistance(fromPosition, path.from);
      const endDistance = getDistance(toPosition, path.to);
      return {
        path,
        score: startDistance + endDistance,
        startDistance,
        endDistance,
      };
    })
    .filter(
      (entry) =>
        entry.startDistance <= PATH_START_MATCH_DISTANCE &&
        entry.endDistance <= PATH_END_MATCH_DISTANCE,
    )
    .sort((left, right) => left.score - right.score);

  const matchedPath = scoredPaths[0]?.path ?? null;
  if (matchedPath) {
    usedPathIds.add(matchedPath.id);
  }

  return matchedPath;
}

function getDistance(start, end) {
  return Math.hypot(end.x - start.x, end.y - start.y);
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}
