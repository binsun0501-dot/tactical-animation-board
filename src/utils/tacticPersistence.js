import { FIELD_MODES, normalizeFieldView } from "./fieldModes.js";

export const TACTIC_SCHEMA_VERSION = "v1";
export const LOCAL_TACTIC_STORAGE_KEY = "tactical-animation-board:my-tactic";

const DEFAULT_TITLE = "我的战术";
const DEFAULT_FIELD_VIEW = FIELD_MODES.ATTACKING_HALF;

export function createNewTacticMeta() {
  const now = new Date().toISOString();

  return {
    id: `tactic_${Date.now()}`,
    title: DEFAULT_TITLE,
    createdAt: now,
    updatedAt: now,
    source: "editor",
    sourceTemplateId: null,
    sourceTemplateName: null,
  };
}

export function createTacticDocument({ steps, activeStepId, fieldView, tacticMeta }) {
  const now = new Date().toISOString();
  const meta = {
    ...createNewTacticMeta(),
    ...tacticMeta,
    title: normalizeTitle(tacticMeta?.title),
    updatedAt: tacticMeta?.updatedAt ?? now,
  };
  const normalizedSteps = steps.map(normalizeStepForDocument);
  const initialStep = normalizedSteps[0];

  return {
    schemaVersion: TACTIC_SCHEMA_VERSION,
    tactic: {
      id: meta.id,
      title: meta.title,
      sport: "football",
      mode: "v1",
      source: meta.source || "editor",
      sourceTemplateId: meta.sourceTemplateId ?? null,
      sourceTemplateName: meta.sourceTemplateName ?? null,
      createdAt: meta.createdAt,
      updatedAt: meta.updatedAt,
      field: {
        id: "field_football_v1",
        type: "football",
        format: "free",
        view: normalizeFieldView(fieldView || DEFAULT_FIELD_VIEW),
        orientation: "landscape",
        size: {
          width: 100,
          height: 64,
          unit: "percent-space",
        },
      },
      teams: {
        home: {
          id: "home",
          name: "本方",
          color: "#176df2",
        },
        away: {
          id: "away",
          name: "对方",
          color: "#e24737",
        },
      },
      players: initialStep?.state.players ?? [],
      opponents: initialStep?.state.opponents ?? [],
      equipment: initialStep?.state.equipment ?? [],
      ball: initialStep?.state.ball ?? null,
      paths: normalizedSteps.flatMap((step) =>
        step.paths.map((path) => ({
          ...path,
          stepId: step.id,
        })),
      ),
      steps: normalizedSteps,
      annotations: [],
      settings: {
        currentStepId: activeStepId,
        fieldView: normalizeFieldView(fieldView || DEFAULT_FIELD_VIEW),
      },
    },
  };
}

export function documentToAppState(document) {
  const parsedDocument = typeof document === "string" ? JSON.parse(document) : document;
  if (!parsedDocument || parsedDocument.schemaVersion !== TACTIC_SCHEMA_VERSION) {
    throw new Error("不支持的战术文件版本");
  }

  const tactic = parsedDocument.tactic;
  if (!tactic || !Array.isArray(tactic.steps) || tactic.steps.length === 0) {
    throw new Error("战术文件缺少步骤数据");
  }

  const globalPaths = Array.isArray(tactic.paths) ? tactic.paths : [];
  const steps = tactic.steps.map((step, index) => {
    const id = String(step.id || `step_${index}`);
    const stepPaths = Array.isArray(step.paths)
      ? step.paths
      : globalPaths.filter(
          (path) => path.stepId === id || (Array.isArray(step.pathIds) && step.pathIds.includes(path.id)),
        );

    return {
      id,
      order: Number.isFinite(step.order) ? step.order : index,
      title: step.title || `Step ${index}`,
      note: step.note || (index === 0 ? "初始站位。" : "本步骤暂无说明。"),
      baseStateFromStepId: step.baseStateFromStepId ?? (index === 0 ? null : `step_${index - 1}`),
      state: normalizeBoardStateForApp(step.state, tactic),
      paths: stepPaths.map(normalizePathForApp),
    };
  });

  const requestedStepId = tactic.settings?.currentStepId || tactic.currentStepId || steps[0].id;
  const activeStepId = steps.some((step) => step.id === requestedStepId) ? requestedStepId : steps[0].id;
  const fieldView = normalizeFieldView(
    tactic.settings?.fieldView || tactic.field?.view || DEFAULT_FIELD_VIEW,
  );

  return {
    steps,
    activeStepId,
    fieldView,
    tacticMeta: {
      id: tactic.id || createNewTacticMeta().id,
      title: normalizeTitle(tactic.title),
      createdAt: tactic.createdAt || new Date().toISOString(),
      updatedAt: tactic.updatedAt || new Date().toISOString(),
      source: tactic.source || "editor",
      sourceTemplateId: tactic.sourceTemplateId ?? null,
      sourceTemplateName: tactic.sourceTemplateName ?? null,
    },
  };
}

export function saveTacticDocument(document) {
  assertLocalStorage();
  window.localStorage.setItem(LOCAL_TACTIC_STORAGE_KEY, JSON.stringify(document));
}

export function loadSavedTacticDocument() {
  if (!canUseLocalStorage()) {
    return null;
  }

  const saved = window.localStorage.getItem(LOCAL_TACTIC_STORAGE_KEY);
  if (!saved) {
    return null;
  }

  return JSON.parse(saved);
}

export function getSavedTacticSummary() {
  try {
    const document = loadSavedTacticDocument();
    if (!document?.tactic) {
      return null;
    }

    return {
      title: normalizeTitle(document.tactic.title),
      updatedAt: document.tactic.updatedAt,
    };
  } catch {
    return null;
  }
}

export function sanitizeTitleForFilename(title) {
  return normalizeTitle(title)
    .replace(/[\\/:*?"<>|]+/g, "-")
    .replace(/\s+/g, "-")
    .slice(0, 40);
}

function normalizeTitle(title) {
  const normalized = String(title || "").trim();
  return normalized || DEFAULT_TITLE;
}

function normalizeStepForDocument(step, index) {
  return {
    id: step.id || `step_${index}`,
    order: Number.isFinite(step.order) ? step.order : index,
    title: step.title || `Step ${index}`,
    note: step.note || "",
    baseStateFromStepId: step.baseStateFromStepId ?? null,
    state: cloneBoardState(step.state),
    paths: Array.isArray(step.paths) ? step.paths.map(clonePath) : [],
    pathIds: Array.isArray(step.paths) ? step.paths.map((path) => path.id) : [],
  };
}

function cloneBoardState(state = {}) {
  return {
    players: Array.isArray(state.players) ? state.players.map(clonePiece) : [],
    opponents: Array.isArray(state.opponents) ? state.opponents.map(clonePiece) : [],
    equipment: Array.isArray(state.equipment) ? state.equipment.map(cloneEquipment) : [],
    ball: cloneBall(state.ball),
  };
}

function clonePiece(piece) {
  const position = clonePosition(piece.position ?? piece);

  return {
    ...piece,
    id: String(piece.id),
    number: String(piece.number ?? piece.label ?? ""),
    teamId: piece.teamId ?? (piece.team === "away" ? "team_away" : "team_home"),
    position,
  };
}

function cloneBall(ball) {
  if (!ball) {
    return null;
  }

  return {
    ...ball,
    id: String(ball.id || "ball"),
    position: clonePosition(ball.position ?? ball),
  };
}

function cloneEquipment(item) {
  const position = clonePosition(item.position ?? item);

  return {
    ...item,
    id: String(item.id),
    type: item.type || "marker",
    label: String(item.label || "标志桶"),
    position,
  };
}

function clonePath(path) {
  return {
    id: String(path.id),
    type: path.type === "pass" ? "pass" : "run",
    from: clonePoint(path.from),
    to: clonePoint(path.to),
    points: Array.isArray(path.points) ? path.points.map(clonePoint) : [clonePoint(path.from), clonePoint(path.to)],
  };
}

function clonePoint(point) {
  return {
    x: clampPercent(point?.x ?? 50),
    y: clampPercent(point?.y ?? 50),
  };
}

function clonePosition(position) {
  return {
    x: clampPercent(position?.x ?? 50),
    y: clampPercent(position?.y ?? 50),
  };
}

function normalizeBoardStateForApp(state = {}, tactic = {}) {
  return {
    players: normalizePiecesForApp(state.players ?? tactic.players, "home"),
    opponents: normalizePiecesForApp(state.opponents ?? tactic.opponents, "away"),
    equipment: normalizeEquipmentForApp(state.equipment ?? tactic.equipment),
    ball: cloneBall(state.ball ?? tactic.ball),
  };
}

function normalizePiecesForApp(pieces, fallbackTeam) {
  if (!Array.isArray(pieces)) {
    return [];
  }

  return pieces.map((piece, index) =>
    clonePiece({
      ...piece,
      id: piece.id || `${fallbackTeam}_${index + 1}`,
      number: piece.number || piece.label || String(index + 1),
      team: piece.team || fallbackTeam,
    }),
  );
}

function normalizeEquipmentForApp(equipment) {
  if (!Array.isArray(equipment)) {
    return [];
  }

  return equipment.map(cloneEquipment);
}

function normalizePathForApp(path) {
  const from = clonePoint(path.from);
  const to = clonePoint(path.to);

  return {
    id: String(path.id || `path_${Date.now()}`),
    type: path.type === "pass" ? "pass" : "run",
    from,
    to,
    points: Array.isArray(path.points) && path.points.length > 0 ? path.points.map(clonePoint) : [from, to],
  };
}

function clampPercent(value) {
  const numberValue = Number(value);
  if (!Number.isFinite(numberValue)) {
    return 50;
  }

  return Math.max(0, Math.min(100, numberValue));
}

function canUseLocalStorage() {
  return typeof window !== "undefined" && Boolean(window.localStorage);
}

function assertLocalStorage() {
  if (!canUseLocalStorage()) {
    throw new Error("当前浏览器不支持本地保存");
  }
}
