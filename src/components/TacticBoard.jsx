import React, { useRef, useState } from "react";
import { FIELD_MODES, normalizeFieldView } from "../utils/fieldModes.js";

const BOARD_WIDTH = 100;
const BOARD_HEIGHT = 64;
const PIECE_RADIUS = 3.1;
const BALL_RADIUS = 2.1;

export function TacticBoard({
  activeTool,
  boardState,
  fieldView,
  readOnly = false,
  selectedPathId,
  selectedPiece = null,
  setBoardState,
  setSelectedPathId,
  setSelectedPiece = () => {},
}) {
  const svgRef = useRef(null);
  const [dragTarget, setDragTarget] = useState(null);
  const [draftPath, setDraftPath] = useState(null);
  const normalizedFieldView = normalizeFieldView(fieldView);

  function pointFromEvent(event) {
    const rect = svgRef.current.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * BOARD_WIDTH;
    const y = ((event.clientY - rect.top) / rect.height) * BOARD_HEIGHT;

    return {
      x: clamp(x, 2, BOARD_WIDTH - 2),
      y: clamp(y, 2, BOARD_HEIGHT - 2),
    };
  }

  function startDrag(event, target) {
    if (readOnly || activeTool !== "move") {
      return;
    }

    event.preventDefault();
    setSelectedPathId(null);
    setSelectedPiece({ type: target.type, id: target.id });
    event.currentTarget.setPointerCapture(event.pointerId);
    setDragTarget({ ...target, pointerId: event.pointerId });
  }

  function startDraw(event) {
    if (readOnly) {
      return;
    }

    if (activeTool !== "run" && activeTool !== "pass") {
      setSelectedPathId(null);
      setSelectedPiece(null);
      return;
    }

    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    const point = pointFromEvent(event);
    setDraftPath({
      id: `path_${activeTool}_${Date.now()}`,
      type: activeTool,
      from: point,
      to: point,
      points: [point, point],
      pointerId: event.pointerId,
    });
    setSelectedPathId(null);
    setSelectedPiece(null);
  }

  function moveDrag(event) {
    if (draftPath) {
      const point = pointFromEvent(event);
      setDraftPath((current) => ({
        ...current,
        to: point,
        points: [current.from, point],
      }));
      return;
    }

    if (!dragTarget) {
      return;
    }

    const position = pointFromEvent(event);
    setBoardState((current) => moveBoardItem(current, dragTarget, position));
  }

  function endDrag(event) {
    if (draftPath?.pointerId === event.pointerId) {
      const distance = getDistance(draftPath.from, draftPath.to);
      if (distance > 2.4) {
        const path = {
          id: draftPath.id,
          type: draftPath.type,
          from: draftPath.from,
          to: draftPath.to,
          points: draftPath.points,
        };
        setBoardState((current) => ({
          ...current,
          paths: [...current.paths, path],
        }));
        setSelectedPathId(path.id);
      }
      setDraftPath(null);
      return;
    }

    if (dragTarget?.pointerId === event.pointerId) {
      setDragTarget(null);
    }
  }

  return (
    <div
      className={readOnly ? "board-frame read-only" : "board-frame"}
      data-field-view={normalizedFieldView}
    >
      <svg
        ref={svgRef}
        className="tactic-board"
        viewBox={`0 0 ${BOARD_WIDTH} ${BOARD_HEIGHT}`}
        role="img"
        aria-label="2D 足球战术白板"
        onPointerDown={startDraw}
        onPointerMove={moveDrag}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
      >
        <defs>
          <marker
            id="run-arrow"
            markerWidth="6"
            markerHeight="6"
            refX="5"
            refY="3"
            orient="auto"
            markerUnits="strokeWidth"
          >
            <path d="M 0 0 L 6 3 L 0 6 Z" className="run-arrow-head" />
          </marker>
          <marker
            id="pass-arrow"
            markerWidth="6"
            markerHeight="6"
            refX="5"
            refY="3"
            orient="auto"
            markerUnits="strokeWidth"
          >
            <path d="M 0 0 L 6 3 L 0 6 Z" className="pass-arrow-head" />
          </marker>
          <marker
            id="attack-direction-arrow"
            markerWidth="6"
            markerHeight="6"
            refX="5"
            refY="3"
            orient="auto"
            markerUnits="strokeWidth"
          >
            <path d="M 0 0 L 6 3 L 0 6 Z" className="attack-direction-head" />
          </marker>
        </defs>
        <FieldMarkings fieldView={normalizedFieldView} />
        <PathLayer
          draftPath={draftPath}
          paths={boardState.paths}
          readOnly={readOnly}
          selectedPathId={selectedPathId}
          setSelectedPathId={setSelectedPathId}
        />

        {boardState.players.map((piece) => (
          <PlayerPiece
            key={piece.id}
            piece={piece}
            kind="home"
            selected={isSelectedPiece(selectedPiece, "player", piece.id)}
            onPointerDown={(event) =>
              startDrag(event, { type: "player", id: piece.id })
            }
          />
        ))}

        {boardState.opponents.map((piece) => (
          <PlayerPiece
            key={piece.id}
            piece={piece}
            kind="away"
            selected={isSelectedPiece(selectedPiece, "opponent", piece.id)}
            onPointerDown={(event) =>
              startDrag(event, { type: "opponent", id: piece.id })
            }
          />
        ))}

        {boardState.ball ? (
          <BallPiece
            ball={boardState.ball}
            selected={isSelectedPiece(selectedPiece, "ball", boardState.ball.id)}
            onPointerDown={(event) =>
              startDrag(event, { type: "ball", id: boardState.ball.id })
            }
          />
        ) : null}
      </svg>
    </div>
  );
}

function PathLayer({ draftPath, paths, readOnly, selectedPathId, setSelectedPathId }) {
  const visiblePaths = draftPath ? [...paths, draftPath] : paths;

  return (
    <g className="path-layer">
      {visiblePaths.map((path) => {
        const isSelected = path.id === selectedPathId;
        const className = [
          "tactic-path",
          path.type === "pass" ? "pass-path" : "run-path",
          isSelected ? "selected" : "",
        ]
          .filter(Boolean)
          .join(" ");

        return (
          <g key={path.id} className={className}>
            <line
              className="path-hit"
              x1={path.from.x}
              y1={path.from.y}
              x2={path.to.x}
              y2={path.to.y}
              onPointerDown={
                readOnly
                  ? undefined
                  : (event) => {
                      event.stopPropagation();
                      setSelectedPathId(path.id);
                    }
              }
            />
            <line
              className="path-visible"
              x1={path.from.x}
              y1={path.from.y}
              x2={path.to.x}
              y2={path.to.y}
              markerEnd={path.type === "pass" ? "url(#pass-arrow)" : "url(#run-arrow)"}
            />
          </g>
        );
      })}
    </g>
  );
}

function FieldMarkings({ fieldView }) {
  const isFullField = fieldView === FIELD_MODES.FULL_FIELD;

  return (
    <g className="field-lines">
      <rect x="1" y="1" width="98" height="62" rx="1.6" />

      {isFullField ? (
        <>
          <line x1="50" y1="1" x2="50" y2="63" />
          <circle cx="50" cy="32" r="9.5" />
          <circle cx="50" cy="32" r="0.8" />
          <rect x="1" y="17" width="17" height="30" />
          <rect x="1" y="24" width="7.8" height="16" />
          <circle cx="12.2" cy="32" r="0.7" />
          <rect x="82" y="17" width="17" height="30" />
          <rect x="91.2" y="24" width="7.8" height="16" />
          <circle cx="87.8" cy="32" r="0.7" />
          <path d="M 1 24 L 1 40" />
          <path d="M 99 24 L 99 40" />
        </>
      ) : (
        <>
          <line className="field-guide" x1="9" y1="5" x2="9" y2="59" />
          <rect x="70" y="13" width="29" height="38" />
          <rect x="88" y="23" width="11" height="18" />
          <circle cx="81" cy="32" r="0.7" />
          <path d="M 98.6 22 L 98.6 42" />
          <line
            className="attack-direction-line"
            x1="58"
            y1="7"
            x2="90"
            y2="7"
            markerEnd="url(#attack-direction-arrow)"
          />
          <text className="field-note" x="57" y="7.9" textAnchor="end">
            进攻方向
          </text>
          <text className="field-note" x="96" y="15" textAnchor="end">
            目标球门
          </text>
        </>
      )}
    </g>
  );
}

function PlayerPiece({ piece, kind, onPointerDown, selected }) {
  return (
    <g
      className={["player-piece", kind, selected ? "selected-piece" : ""]
        .filter(Boolean)
        .join(" ")}
      transform={`translate(${piece.position.x} ${piece.position.y})`}
      onPointerDown={onPointerDown}
      tabIndex="0"
      role="button"
      aria-label={`${kind === "home" ? "本方" : "对方"}${piece.number}号`}
    >
      <circle r={PIECE_RADIUS} />
      <text y="1.2">{piece.number}</text>
    </g>
  );
}

function BallPiece({ ball, onPointerDown, selected }) {
  return (
    <g
      className={selected ? "ball-piece selected-piece" : "ball-piece"}
      transform={`translate(${ball.position.x} ${ball.position.y})`}
      onPointerDown={onPointerDown}
      tabIndex="0"
      role="button"
      aria-label="足球"
    >
      <circle r={BALL_RADIUS} />
      <path d="M -1.1 -0.4 L 0 -1.25 L 1.1 -0.4 L 0.7 0.95 L -0.7 0.95 Z" />
    </g>
  );
}

function isSelectedPiece(selectedPiece, type, id) {
  return selectedPiece?.type === type && selectedPiece.id === id;
}

function moveBoardItem(current, target, position) {
  if (target.type === "player") {
    return {
      ...current,
      players: current.players.map((piece) =>
        piece.id === target.id ? { ...piece, position } : piece,
      ),
    };
  }

  if (target.type === "opponent") {
    return {
      ...current,
      opponents: current.opponents.map((piece) =>
        piece.id === target.id ? { ...piece, position } : piece,
      ),
    };
  }

  if (target.type === "ball" && current.ball) {
    return {
      ...current,
      ball: {
        ...current.ball,
        position,
      },
    };
  }

  return current;
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function getDistance(start, end) {
  return Math.hypot(end.x - start.x, end.y - start.y);
}
