import { downloadBlobFile } from "./downloadFile.js";
import { FIELD_MODES, normalizeFieldView } from "./fieldModes.js";
import { sanitizeTitleForFilename } from "./tacticPersistence.js";

const IMAGE_WIDTH = 1400;
const IMAGE_HEIGHT = 1000;
const VIEWBOX_WIDTH = 100;
const VIEWBOX_HEIGHT = 82;
const BOARD_Y = 8;

export async function exportCurrentStepImagePng({
  boardState,
  fieldView,
  tacticTitle,
  stepTitle,
  stepNote,
}) {
  const svg = createCurrentStepImageSvg({
    boardState,
    fieldView,
    tacticTitle,
    stepTitle,
    stepNote,
  });
  const svgBlob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
  const svgUrl = window.URL.createObjectURL(svgBlob);

  try {
    const image = await loadImage(svgUrl);
    const canvas = window.document.createElement("canvas");
    canvas.width = IMAGE_WIDTH;
    canvas.height = IMAGE_HEIGHT;
    const context = canvas.getContext("2d");
    context.fillStyle = "#f2f8f4";
    context.fillRect(0, 0, IMAGE_WIDTH, IMAGE_HEIGHT);
    context.drawImage(image, 0, 0, IMAGE_WIDTH, IMAGE_HEIGHT);

    const pngBlob = await canvasToPngBlob(canvas);
    const dataUrl = canvas.toDataURL("image/png");
    const fileName = `${sanitizeTitleForFilename(tacticTitle)}-${stepTitle}.png`;
    downloadBlobFile({ blob: pngBlob, fileName });

    return {
      fileName,
      dataUrl,
      blob: pngBlob,
    };
  } finally {
    window.URL.revokeObjectURL(svgUrl);
  }
}

export function createCurrentStepImageSvg({
  boardState,
  fieldView,
  tacticTitle,
  stepTitle,
  stepNote,
}) {
  const noteLines = wrapText(stepNote || "本步骤暂无说明。", 34).slice(0, 2);

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${IMAGE_WIDTH}" height="${IMAGE_HEIGHT}" viewBox="0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}">
  <rect width="${VIEWBOX_WIDTH}" height="${VIEWBOX_HEIGHT}" rx="2" fill="#f2f8f4"/>
  <text x="3" y="4.1" fill="#10271d" font-family="PingFang SC, Microsoft YaHei, sans-serif" font-size="3.6" font-weight="900">${escapeXml(tacticTitle)}</text>
  <text x="97" y="4.1" text-anchor="end" fill="#17634a" font-family="PingFang SC, Microsoft YaHei, sans-serif" font-size="2.3" font-weight="900">${escapeXml(stepTitle)}</text>
  <g transform="translate(0 ${BOARD_Y})">
    ${renderField(fieldView)}
    ${renderPaths(boardState.paths)}
    ${renderPieces(boardState.players, "home")}
    ${renderPieces(boardState.opponents, "away")}
    ${boardState.ball ? renderBall(boardState.ball) : ""}
  </g>
  <rect x="3" y="74.2" width="94" height="5.8" rx="1.4" fill="#ffffff" stroke="rgba(26, 66, 44, 0.12)" stroke-width="0.2"/>
  <text x="5" y="77.1" fill="#233b2f" font-family="PingFang SC, Microsoft YaHei, sans-serif" font-size="2.2" font-weight="800">
    ${noteLines.map((line, index) => `<tspan x="5" dy="${index === 0 ? 0 : 2.4}">${escapeXml(index === 0 ? `说明：${line}` : line)}</tspan>`).join("")}
  </text>
</svg>`;
}

function renderField(fieldView) {
  const normalizedFieldView = normalizeFieldView(fieldView);
  const isFullField = normalizedFieldView === FIELD_MODES.FULL_FIELD;

  return `
    <defs>
      <marker id="run-export-arrow" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto" markerUnits="strokeWidth">
        <path d="M 0 0 L 6 3 L 0 6 Z" fill="#166fff"/>
      </marker>
      <marker id="pass-export-arrow" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto" markerUnits="strokeWidth">
        <path d="M 0 0 L 6 3 L 0 6 Z" fill="#ffd234"/>
      </marker>
      <marker id="attack-export-arrow" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto" markerUnits="strokeWidth">
        <path d="M 0 0 L 6 3 L 0 6 Z" fill="#ffffff"/>
      </marker>
    </defs>
    <rect width="100" height="64" rx="1.8" fill="#59b547"/>
    <g opacity="0.18">
      ${Array.from({ length: 10 }, (_, index) => `<rect x="${index * 10}" y="0" width="5" height="64" fill="#ffffff"/>`).join("")}
    </g>
    <g fill="none" stroke="rgba(255,255,255,0.88)" stroke-width="0.55">
      <rect x="1" y="1" width="98" height="62" rx="1.6"/>
      ${
        isFullField
          ? `<line x1="50" y1="1" x2="50" y2="63"/>
             <circle cx="50" cy="32" r="9.5"/>
             <circle cx="50" cy="32" r="0.8"/>
             <rect x="1" y="17" width="17" height="30"/>
             <rect x="1" y="24" width="7.8" height="16"/>
             <circle cx="12.2" cy="32" r="0.7"/>
             <rect x="82" y="17" width="17" height="30"/>
             <rect x="91.2" y="24" width="7.8" height="16"/>
             <circle cx="87.8" cy="32" r="0.7"/>
             <path d="M 1 24 L 1 40"/>
             <path d="M 99 24 L 99 40"/>`
          : `<line x1="9" y1="5" x2="9" y2="59" stroke-dasharray="1.2 1.4" opacity="0.46"/>
             <rect x="70" y="13" width="29" height="38"/>
             <rect x="88" y="23" width="11" height="18"/>
             <circle cx="81" cy="32" r="0.7"/>
             <path d="M 98.6 22 L 98.6 42"/>
             <line x1="58" y1="7" x2="90" y2="7" stroke-width="0.75" marker-end="url(#attack-export-arrow)"/>`
      }
    </g>
    ${
      isFullField
        ? ""
        : `<text x="57" y="7.9" text-anchor="end" fill="rgba(255,255,255,0.78)" font-family="PingFang SC, Microsoft YaHei, sans-serif" font-size="2.8" font-weight="800">进攻方向</text>
           <text x="96" y="15" text-anchor="end" fill="rgba(255,255,255,0.78)" font-family="PingFang SC, Microsoft YaHei, sans-serif" font-size="2.8" font-weight="800">目标球门</text>`
    }`;
}

function renderPaths(paths = []) {
  return paths
    .map((path) => {
      const isPass = path.type === "pass";
      const stroke = isPass ? "#ffd234" : "#166fff";
      const marker = isPass ? "pass-export-arrow" : "run-export-arrow";
      const dash = isPass ? "" : `stroke-dasharray="2.1 1.4"`;

      return `<line x1="${path.from.x}" y1="${path.from.y}" x2="${path.to.x}" y2="${path.to.y}" fill="none" stroke="${stroke}" stroke-width="1.15" stroke-linecap="round" ${dash} marker-end="url(#${marker})"/>`;
    })
    .join("");
}

function renderPieces(pieces = [], kind) {
  const fill = kind === "home" ? "#176df2" : "#e24737";

  return pieces
    .map((piece) => {
      const position = piece.position ?? { x: 50, y: 32 };

      return `<g transform="translate(${position.x} ${position.y})">
        <circle r="3.1" fill="${fill}" stroke="rgba(255,255,255,0.9)" stroke-width="0.45"/>
        <text y="1.2" text-anchor="middle" fill="#ffffff" font-family="PingFang SC, Microsoft YaHei, sans-serif" font-size="3.7" font-weight="900">${escapeXml(piece.number)}</text>
      </g>`;
    })
    .join("");
}

function renderBall(ball) {
  const position = ball.position ?? { x: 50, y: 32 };

  return `<g transform="translate(${position.x} ${position.y})">
    <circle r="2.1" fill="#f8fbff" stroke="#142035" stroke-width="0.35"/>
    <path d="M -1.1 -0.4 L 0 -1.25 L 1.1 -0.4 L 0.7 0.95 L -0.7 0.95 Z" fill="#142035"/>
  </g>`;
}

function loadImage(url) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("图片导出失败，请重试"));
    image.src = url;
  });
}

function canvasToPngBlob(canvas) {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error("图片导出失败，请重试"));
        return;
      }

      resolve(blob);
    }, "image/png");
  });
}

function wrapText(text, size) {
  const normalized = String(text).replace(/\s+/g, " ").trim();
  if (!normalized) {
    return ["本步骤暂无说明。"];
  }

  const chunks = [];
  for (let index = 0; index < normalized.length; index += size) {
    chunks.push(normalized.slice(index, index + size));
  }

  return chunks;
}

function escapeXml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
