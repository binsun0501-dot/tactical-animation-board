import React, { useEffect, useMemo, useRef, useState } from "react";
import { SavePanel } from "./components/SavePanel.jsx";
import { TacticBoard } from "./components/TacticBoard.jsx";
import {
  cloneBoardState,
  createInitialBoardState,
  createInitialSteps,
} from "./data/initialBoard.js";
import { TACTIC_TEMPLATES, createTemplateAppState } from "./data/templates.js";
import {
  PLAYBACK_STEP_DURATION_MS,
  createBoardStateFromStep,
  resolvePlaybackFrame,
} from "./utils/playback.js";
import { downloadTextFile } from "./utils/downloadFile.js";
import { exportCurrentStepImagePng } from "./utils/stepImageExport.js";
import {
  createNewTacticMeta,
  createTacticDocument,
  documentToAppState,
  getSavedTacticSummary,
  loadSavedTacticDocument,
  sanitizeTitleForFilename,
  saveTacticDocument,
} from "./utils/tacticPersistence.js";

const IDLE_PLAYBACK = {
  status: "idle",
  segmentIndex: 0,
  progress: 0,
  startedAt: null,
};
const PLAYBACK_REFRESH_MS = 1000 / 60;

function createInitialAppState() {
  const defaultSteps = createInitialSteps();
  const defaultMeta = createNewTacticMeta();

  try {
    const savedDocument = loadSavedTacticDocument();
    if (savedDocument) {
      return {
        ...documentToAppState(savedDocument),
        loadMessage: "已打开最近保存的战术",
      };
    }
  } catch {
    return {
      steps: defaultSteps,
      activeStepId: "step_0",
      fieldView: "half",
      tacticMeta: defaultMeta,
      loadMessage: "最近保存无法打开，已使用默认战术板",
    };
  }

  return {
    steps: defaultSteps,
    activeStepId: "step_0",
    fieldView: "half",
    tacticMeta: defaultMeta,
    loadMessage: "",
  };
}

export default function App() {
  const [initialAppState] = useState(() => createInitialAppState());
  const [steps, setSteps] = useState(() => initialAppState.steps);
  const [activeStepId, setActiveStepId] = useState(initialAppState.activeStepId);
  const [fieldView, setFieldView] = useState(initialAppState.fieldView);
  const [tacticMeta, setTacticMeta] = useState(() => initialAppState.tacticMeta);
  const [saveStatus, setSaveStatus] = useState(initialAppState.loadMessage);
  const [savedSummary, setSavedSummary] = useState(() => getSavedTacticSummary());
  const [activeTool, setActiveTool] = useState("move");
  const [selectedPathId, setSelectedPathId] = useState(null);
  const [selectedPiece, setSelectedPiece] = useState(null);
  const [playback, setPlayback] = useState(IDLE_PLAYBACK);
  const [appMode, setAppMode] = useState("home");
  const playbackRunIdRef = useRef(0);

  const activeStep = steps.find((step) => step.id === activeStepId) ?? steps[0];
  const boardState = createBoardStateFromStep(activeStep);
  const playbackFrame = useMemo(
    () => resolvePlaybackFrame(steps, playback),
    [playback, steps],
  );
  const isPlaybackVisible = playback.status !== "idle";
  const displayedBoardState = playbackFrame?.boardState ?? boardState;
  const displayedStep = playbackFrame?.displayStep ?? activeStep;
  const displayedStepIndex =
    playbackFrame?.displayStepIndex ??
    Math.max(
      0,
      steps.findIndex((step) => step.id === activeStepId),
    );
  const activeStepIndex = Math.max(
    0,
    steps.findIndex((step) => step.id === activeStepId),
  );
  const canAddStep = steps.length < 5;
  const canDeleteCurrentStep = activeStepIndex > 0 && steps.length > 1;
  const canPlay = steps.length > 1;
  const editingDisabled = isPlaybackVisible;
  const isHomeMode = appMode === "home";
  const isPresentationMode = appMode === "presentation";
  const isViewerMode = appMode === "viewer";
  const isTemplateLibraryMode = appMode === "templates";

  useEffect(() => {
    if (playback.status !== "playing") {
      return undefined;
    }

    const runId = playbackRunIdRef.current;
    const intervalId = window.setInterval(() => {
      if (playbackRunIdRef.current !== runId) {
        return;
      }

      setPlayback((currentPlayback) => {
        if (currentPlayback.status !== "playing") {
          return currentPlayback;
        }

        const lastSegmentIndex = Math.max(0, steps.length - 2);
        const segmentCount = lastSegmentIndex + 1;
        const elapsedMs = getNow() - currentPlayback.startedAt;
        const totalDurationMs = segmentCount * PLAYBACK_STEP_DURATION_MS;

        if (elapsedMs >= totalDurationMs) {
          return {
            status: "ended",
            segmentIndex: lastSegmentIndex,
            progress: 1,
            startedAt: null,
          };
        }

        const nextSegmentIndex = Math.min(
          lastSegmentIndex,
          Math.floor(elapsedMs / PLAYBACK_STEP_DURATION_MS),
        );
        const nextProgress =
          (elapsedMs - nextSegmentIndex * PLAYBACK_STEP_DURATION_MS) /
          PLAYBACK_STEP_DURATION_MS;

        return {
          ...currentPlayback,
          status: "playing",
          segmentIndex: nextSegmentIndex,
          progress: nextProgress,
        };
      });
    }, PLAYBACK_REFRESH_MS);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [playback.status, steps.length]);

  useEffect(() => {
    if (playback.status === "ended" && steps.length > 0) {
      setActiveStepId(steps[steps.length - 1].id);
    }
  }, [playback.status, steps]);

  function resetPlayback() {
    playbackRunIdRef.current += 1;
    setPlayback(IDLE_PLAYBACK);
  }

  function restoreDefaultLayout() {
    updateCurrentStepBoard(() => createInitialBoardState());
    setSelectedPiece(null);
  }

  function clearBoard() {
    const shouldClear = window.confirm("清空当前画面？可用恢复默认布局找回初始摆位。");
    if (!shouldClear) {
      return;
    }

    updateCurrentStepBoard(() => ({
      players: [],
      opponents: [],
      ball: null,
      paths: [],
    }));
    setSelectedPiece(null);
  }

  function clearPaths() {
    updateCurrentStepBoard((current) => ({
      ...current,
      paths: [],
    }));
    setSelectedPathId(null);
  }

  function undoLatestPath() {
    updateCurrentStepBoard((current) => ({
      ...current,
      paths: current.paths.slice(0, -1),
    }));
    setSelectedPathId(null);
  }

  function deleteSelectedPath() {
    if (!selectedPathId) {
      return;
    }

    updateCurrentStepBoard((current) => ({
      ...current,
      paths: current.paths.filter((path) => path.id !== selectedPathId),
    }));
    setSelectedPathId(null);
  }

  function addHomePlayer() {
    const nextPiece = {
      id: `player_${Date.now()}`,
      number: getNextPieceNumber(boardState.players),
      position: getNewPiecePosition("home", boardState.players.length),
    };

    updateCurrentStepBoard((current) => {
      return {
        ...current,
        players: [...current.players, nextPiece],
      };
    });
    setSelectedPiece({ type: "player", id: nextPiece.id });
    setActiveTool("move");
    setSelectedPathId(null);
  }

  function addOpponentPlayer() {
    const nextPiece = {
      id: `opponent_${Date.now()}`,
      number: getNextPieceNumber(boardState.opponents),
      position: getNewPiecePosition("away", boardState.opponents.length),
    };

    updateCurrentStepBoard((current) => {
      return {
        ...current,
        opponents: [...current.opponents, nextPiece],
      };
    });
    setSelectedPiece({ type: "opponent", id: nextPiece.id });
    setActiveTool("move");
    setSelectedPathId(null);
  }

  function restoreFootball() {
    const ball = {
      id: boardState.ball?.id ?? "ball",
      position: { x: 48, y: 32 },
    };

    updateCurrentStepBoard((current) => {
      return {
        ...current,
        ball,
      };
    });
    setSelectedPiece({ type: "ball", id: ball.id });
    setActiveTool("move");
    setSelectedPathId(null);
  }

  function deleteSelectedPiece() {
    if (!selectedPiece) {
      return;
    }

    const shouldDelete = window.confirm("删除选中的棋子或足球？");
    if (!shouldDelete) {
      return;
    }

    updateCurrentStepBoard((current) => {
      if (selectedPiece.type === "player") {
        return {
          ...current,
          players: current.players.filter((piece) => piece.id !== selectedPiece.id),
        };
      }

      if (selectedPiece.type === "opponent") {
        return {
          ...current,
          opponents: current.opponents.filter((piece) => piece.id !== selectedPiece.id),
        };
      }

      if (selectedPiece.type === "ball") {
        return {
          ...current,
          ball: null,
        };
      }

      return current;
    });
    setSelectedPiece(null);
  }

  function updateCurrentStepBoard(updater) {
    setSteps((currentSteps) =>
      currentSteps.map((step) => {
        if (step.id !== activeStepId) {
          return step;
        }

        const currentBoard = createBoardStateFromStep(step);
        const nextBoard =
          typeof updater === "function" ? updater(currentBoard) : updater;

        return {
          ...step,
          state: {
            players: nextBoard.players,
            opponents: nextBoard.opponents,
            ball: nextBoard.ball,
          },
          paths: nextBoard.paths ?? step.paths,
        };
      }),
    );
  }

  function selectStep(stepId) {
    resetPlayback();
    setActiveStepId(stepId);
    setSelectedPathId(null);
    setSelectedPiece(null);
    setActiveTool("move");
  }

  function addNextStep() {
    if (!canAddStep || editingDisabled) {
      return;
    }

    setSteps((currentSteps) => {
      const previousStep = currentSteps[currentSteps.length - 1];
      const order = currentSteps.length;
      const nextStepId = `step_${order}`;
      const nextStep = {
        id: nextStepId,
        order,
        title: `Step ${order}`,
        note: order === 1 ? "继续拖动棋子或画箭头。" : "继承上一步，继续推进。",
        baseStateFromStepId: previousStep.id,
        state: cloneBoardState(previousStep.state),
        paths: [],
      };

      setActiveStepId(nextStepId);
      setSelectedPathId(null);
      setSelectedPiece(null);
      setActiveTool("move");
      return [...currentSteps, nextStep];
    });
  }

  function deleteCurrentStep() {
    if (editingDisabled) {
      return;
    }

    if (activeStepIndex === 0) {
      setSaveStatus("Step 0 是初始站位，不能直接删除，可用恢复默认重置。");
      return;
    }

    const shouldDelete = window.confirm("删除当前步骤？删除后会切换到相邻步骤。");
    if (!shouldDelete) {
      return;
    }

    setSteps((currentSteps) => {
      const currentIndex = currentSteps.findIndex((step) => step.id === activeStepId);
      if (currentIndex <= 0 || currentSteps.length <= 1) {
        return currentSteps;
      }

      const remainingSteps = currentSteps.filter((step) => step.id !== activeStepId);
      const normalizedSteps = normalizeStepOrder(remainingSteps);
      const nextIndex = Math.min(currentIndex, normalizedSteps.length - 1);
      setActiveStepId(normalizedSteps[nextIndex].id);
      return normalizedSteps;
    });
    resetPlayback();
    setSelectedPathId(null);
    setSelectedPiece(null);
    setActiveTool("move");
    setSaveStatus("已删除当前步骤");
  }

  function updateStepNote(note) {
    setSteps((currentSteps) =>
      currentSteps.map((step) =>
        step.id === activeStepId ? { ...step, note } : step,
      ),
    );
  }

  function applyTacticState(appState, message) {
    resetPlayback();
    setSteps(appState.steps);
    setActiveStepId(appState.activeStepId);
    setFieldView(appState.fieldView);
    setTacticMeta(appState.tacticMeta);
    setActiveTool("move");
    setSelectedPathId(null);
    setSelectedPiece(null);
    setSaveStatus(message);
  }

  function updateTacticTitle(title) {
    setTacticMeta((currentMeta) => ({
      ...currentMeta,
      title,
    }));
  }

  function saveCurrentTactic() {
    try {
      const updatedMeta = {
        ...tacticMeta,
        updatedAt: new Date().toISOString(),
      };
      const document = createTacticDocument({
        steps,
        activeStepId,
        fieldView,
        tacticMeta: updatedMeta,
      });
      saveTacticDocument(document);
      const appState = documentToAppState(document);
      setTacticMeta(appState.tacticMeta);
      setSavedSummary(getSavedTacticSummary());
      setSaveStatus("已保存到本机");
    } catch (error) {
      setSaveStatus(error.message || "保存失败，请重试");
    }
  }

  function createCurrentTacticDocument(metaOverrides = {}) {
    return createTacticDocument({
      steps,
      activeStepId,
      fieldView,
      tacticMeta: {
        ...tacticMeta,
        ...metaOverrides,
      },
    });
  }

  function loadRecentTactic() {
    try {
      const document = loadSavedTacticDocument();
      if (!document) {
        setSaveStatus("本机还没有保存的战术");
        return;
      }

      applyTacticState(documentToAppState(document), "已打开最近保存的战术");
      setSavedSummary(getSavedTacticSummary());
    } catch (error) {
      setSaveStatus(error.message || "打开失败，请检查保存数据");
    }
  }

  function exportTacticJson() {
    try {
      const document = createCurrentTacticDocument({
        updatedAt: new Date().toISOString(),
      });
      const content = JSON.stringify(document, null, 2);
      const fileName = `${sanitizeTitleForFilename(document.tactic.title)}.json`;
      downloadTextFile({
        content,
        fileName,
        type: "application/json;charset=utf-8",
      });
      window.__tacticalBoardLastJsonExport = content;
      setSaveStatus("已导出战术文件");
    } catch (error) {
      setSaveStatus(error.message || "导出失败，请重试");
    }
  }

  async function importTacticJson(file) {
    try {
      const content = await file.text();
      const appState = documentToAppState(content);
      applyTacticState(appState, "已打开战术文件");
      setSavedSummary(getSavedTacticSummary());
    } catch (error) {
      setSaveStatus(error.message || "打开失败，请检查战术文件");
    }
  }

  async function exportCurrentStepImage() {
    try {
      const result = await exportCurrentStepImagePng({
        boardState,
        fieldView,
        tacticTitle: tacticMeta.title,
        stepTitle: activeStep.title,
        stepNote: activeStep.note,
      });
      window.__tacticalBoardLastStepImageDataUrl = result.dataUrl;
      setSaveStatus("已导出当前步骤图片");
    } catch (error) {
      setSaveStatus(error.message || "图片导出失败，请重试");
    }
  }

  function playSteps() {
    if (!canPlay) {
      return;
    }

    setActiveTool("move");
    setSelectedPathId(null);
    setSelectedPiece(null);
    playbackRunIdRef.current += 1;
    const startedAt = getNow();
    setPlayback((currentPlayback) => {
      if (currentPlayback.status === "paused") {
        const elapsedMs =
          (currentPlayback.segmentIndex + currentPlayback.progress) *
          PLAYBACK_STEP_DURATION_MS;

        return {
          ...currentPlayback,
          status: "playing",
          startedAt: startedAt - elapsedMs,
        };
      }

      return {
        status: "playing",
        segmentIndex: 0,
        progress: 0,
        startedAt,
      };
    });
  }

  function pausePlayback() {
    playbackRunIdRef.current += 1;
    setPlayback((currentPlayback) =>
      currentPlayback.status === "playing"
        ? {
            ...currentPlayback,
            status: "paused",
          }
        : currentPlayback,
    );
  }

  function replaySteps() {
    if (!canPlay) {
      return;
    }

    setActiveTool("move");
    setSelectedPathId(null);
    setSelectedPiece(null);
    playbackRunIdRef.current += 1;
    setPlayback({
      status: "playing",
      segmentIndex: 0,
      progress: 0,
      startedAt: getNow(),
    });
  }

  function returnToEdit() {
    if (displayedStep?.id) {
      setActiveStepId(displayedStep.id);
    }

    resetPlayback();
    setSelectedPathId(null);
    setSelectedPiece(null);
    setActiveTool("move");
  }

  function enterPresentationMode() {
    resetPlayback();
    setSelectedPathId(null);
    setSelectedPiece(null);
    setActiveTool("move");
    setAppMode("presentation");
  }

  function returnToEditMode() {
    returnToEdit();
    setAppMode("edit");
  }

  function returnToHomeMode() {
    returnToEdit();
    setAppMode("home");
  }

  function enterViewerMode() {
    resetPlayback();
    setSelectedPathId(null);
    setSelectedPiece(null);
    setActiveTool("move");
    setAppMode("viewer");
  }

  function enterTemplateLibrary() {
    resetPlayback();
    setSelectedPathId(null);
    setSelectedPiece(null);
    setActiveTool("move");
    setAppMode("templates");
  }

  function openRecentSavedTactic() {
    loadRecentTactic();
    setAppMode("edit");
  }

  function copyTemplateToTactic(template) {
    const appState = createTemplateAppState(template);
    applyTacticState(appState, `已复制「${template.name}」，可继续修改并保存`);
    setAppMode("edit");
    setSavedSummary(getSavedTacticSummary());
  }

  function goToStepByIndex(nextStepIndex) {
    const nextStep = steps[nextStepIndex];
    if (!nextStep) {
      return;
    }

    resetPlayback();
    setActiveStepId(nextStep.id);
    setSelectedPathId(null);
    setSelectedPiece(null);
    setActiveTool("move");
  }

  if (isHomeMode) {
    return (
      <HomeMode
        onOpenRecent={openRecentSavedTactic}
        onOpenTemplates={enterTemplateLibrary}
        onStartBoard={returnToEditMode}
        savedSummary={savedSummary}
      />
    );
  }

  if (isPresentationMode) {
    return (
      <PresentationMode
        canPlay={canPlay}
        currentStepIndex={displayedStepIndex}
        displayedBoardState={displayedBoardState}
        displayedStep={displayedStep}
        fieldView={fieldView}
        onPause={pausePlayback}
        onPlay={playSteps}
        onReplay={replaySteps}
        onReturnToEdit={returnToEditMode}
        playbackStatus={playback.status}
        steps={steps}
        tacticTitle={tacticMeta.title}
      />
    );
  }

  if (isViewerMode) {
    return (
      <ViewerMode
        canPlay={canPlay}
        currentStepIndex={displayedStepIndex}
        displayedBoardState={displayedBoardState}
        displayedStep={displayedStep}
        fieldView={fieldView}
        onNextStep={() =>
          goToStepByIndex(Math.min(steps.length - 1, displayedStepIndex + 1))
        }
        onPause={pausePlayback}
        onPlay={playSteps}
        onPreviousStep={() => goToStepByIndex(Math.max(0, displayedStepIndex - 1))}
        onReplay={replaySteps}
        onReturnToEdit={returnToEditMode}
        playbackStatus={playback.status}
        steps={steps}
        tacticTitle={tacticMeta.title}
      />
    );
  }

  if (isTemplateLibraryMode) {
    return (
      <TemplateLibraryMode
        onCopyTemplate={copyTemplateToTactic}
        onReturnToEdit={returnToEditMode}
        templates={TACTIC_TEMPLATES}
      />
    );
  }

  return (
    <main className="app-shell">
      <section className="editor-shell" aria-label="现场白板编辑器">
        <header className="top-bar">
          <div>
            <p className="stage-label">现场白板</p>
            <h1>战术动画板</h1>
          </div>
          <div className="top-actions" aria-label="球场视图">
            <button
              className={fieldView === "half" ? "toggle active" : "toggle"}
              type="button"
              onClick={() => setFieldView("half")}
            >
              半场
            </button>
            <button
              className={fieldView === "full" ? "toggle active" : "toggle"}
              type="button"
              onClick={() => setFieldView("full")}
            >
              全场
            </button>
            <button className="toggle action secondary" type="button" onClick={returnToHomeMode}>
              首页
            </button>
            <button
              className="toggle action"
              type="button"
              data-testid="template-library-entry"
              onClick={enterTemplateLibrary}
            >
              模板
            </button>
            <button className="toggle action" type="button" onClick={enterPresentationMode}>
              展示
            </button>
            <button className="toggle action" type="button" onClick={enterViewerMode}>
              观看
            </button>
          </div>
        </header>

        <div className="workspace">
          <aside className="tool-rail" aria-label="现场工具栏">
            <button
              className={activeTool === "move" ? "tool-button active" : "tool-button"}
              type="button"
              onClick={() => setActiveTool("move")}
              disabled={editingDisabled}
            >
              移动
            </button>
            <button
              className={activeTool === "run" ? "tool-button active" : "tool-button"}
              type="button"
              onClick={() => setActiveTool("run")}
              disabled={editingDisabled}
            >
              跑动箭头
            </button>
            <button
              className={activeTool === "pass" ? "tool-button active" : "tool-button"}
              type="button"
              onClick={() => setActiveTool("pass")}
              disabled={editingDisabled}
            >
              球路箭头
            </button>
            <button
              className="tool-button"
              type="button"
              data-testid="add-home-piece"
              onClick={addHomePlayer}
              disabled={editingDisabled}
            >
              加本方
            </button>
            <button
              className="tool-button"
              type="button"
              data-testid="add-away-piece"
              onClick={addOpponentPlayer}
              disabled={editingDisabled}
            >
              加对手
            </button>
            <button
              className="tool-button"
              type="button"
              data-testid="restore-ball"
              onClick={restoreFootball}
              disabled={editingDisabled}
            >
              足球
            </button>
            <button
              className="tool-button danger"
              type="button"
              data-testid="delete-selected-piece"
              onClick={deleteSelectedPiece}
              disabled={editingDisabled || !selectedPiece}
            >
              删棋子
            </button>
            <button
              className="tool-button"
              type="button"
              onClick={undoLatestPath}
              disabled={editingDisabled || boardState.paths.length === 0}
            >
              撤销
            </button>
            <button
              className="tool-button"
              type="button"
              onClick={deleteSelectedPath}
              disabled={editingDisabled || !selectedPathId}
            >
              删除路线
            </button>
            <button
              className="tool-button"
              type="button"
              onClick={clearPaths}
              disabled={editingDisabled || boardState.paths.length === 0}
            >
              清除路线
            </button>
            <button
              className="tool-button"
              type="button"
              onClick={restoreDefaultLayout}
              disabled={editingDisabled}
            >
              恢复默认
            </button>
            <button
              className="tool-button danger"
              type="button"
              onClick={clearBoard}
              disabled={editingDisabled}
            >
              清空画面
            </button>

            <SavePanel
              tacticTitle={tacticMeta.title}
              onTitleChange={updateTacticTitle}
              onSave={saveCurrentTactic}
              onLoadSaved={loadRecentTactic}
              onExportJson={exportTacticJson}
              onImportJson={importTacticJson}
              onExportStepImage={exportCurrentStepImage}
              savedSummary={savedSummary}
              status={saveStatus}
              disabled={editingDisabled}
            />

            <div className="step-panel" aria-label="分步状态">
              <div className="step-panel-header">
                <span>步骤</span>
                <div className="step-actions">
                  <button
                    className="small-button"
                    type="button"
                    onClick={addNextStep}
                    disabled={!canAddStep || editingDisabled}
                  >
                    新增
                  </button>
                  <button
                    className="small-button danger"
                    type="button"
                    data-testid="delete-current-step"
                    onClick={deleteCurrentStep}
                    disabled={!canDeleteCurrentStep || editingDisabled}
                  >
                    删除
                  </button>
                </div>
              </div>

              <div className="step-list">
                {steps.map((step) => {
                  const isCurrentStep = step.id === displayedStep?.id;
                  const isEditingStep = step.id === activeStepId;

                  return (
                    <button
                      key={step.id}
                      className={[
                        "step-button",
                        isEditingStep ? "active" : "",
                        isCurrentStep && isPlaybackVisible ? "playback-current" : "",
                      ]
                        .filter(Boolean)
                        .join(" ")}
                      type="button"
                      onClick={() => selectStep(step.id)}
                    >
                      <strong>{step.title}</strong>
                      <span>{step.baseStateFromStepId ? "继承上一状态" : "初始站位"}</span>
                    </button>
                  );
                })}
              </div>

              <label className="step-note">
                <span>本步说明</span>
                <textarea
                  value={activeStep.note}
                  onChange={(event) => updateStepNote(event.target.value)}
                  rows="3"
                  disabled={editingDisabled}
                />
              </label>
            </div>
          </aside>

          <section className="board-area">
            <PlaybackStrip
              canPlay={canPlay}
              currentStepIndex={displayedStepIndex}
              currentStepNote={displayedStep?.note}
              isPlaybackVisible={isPlaybackVisible}
              onPause={pausePlayback}
              onPlay={playSteps}
              onReplay={replaySteps}
              onReturnToEdit={returnToEdit}
              showReturnToEdit={isPlaybackVisible}
              status={playback.status}
              totalSteps={steps.length}
            />
            <TacticBoard
              activeTool={activeTool}
              boardState={displayedBoardState}
              fieldView={fieldView}
              readOnly={isPlaybackVisible}
              selectedPathId={selectedPathId}
              selectedPiece={selectedPiece}
              setSelectedPathId={setSelectedPathId}
              setSelectedPiece={setSelectedPiece}
              setBoardState={updateCurrentStepBoard}
            />
          </section>
        </div>
      </section>
    </main>
  );
}

function HomeMode({ onOpenRecent, onOpenTemplates, onStartBoard, savedSummary }) {
  return (
    <main className="app-shell home-app">
      <section className="home-shell" aria-label="战术动画板首页">
        <header className="home-header">
          <p className="stage-label">战术动画板 v1 candidate</p>
          <h1>先选一个入口</h1>
        </header>

        <div className="home-actions" aria-label="主要入口">
          <button
            className="home-card primary"
            type="button"
            data-testid="home-board-entry"
            onClick={onStartBoard}
          >
            <span>现场白板</span>
            <strong>直接摆队员、画路线、分步骤讲清楚。</strong>
          </button>
          <button
            className="home-card template"
            type="button"
            data-testid="home-template-entry"
            onClick={onOpenTemplates}
          >
            <span>基础模板</span>
            <strong>从 8 个足球模板复制后修改。</strong>
          </button>
        </div>

        <div className="home-secondary" aria-label="次级入口">
          <button type="button" onClick={onOpenRecent} disabled={!savedSummary}>
            打开最近保存
          </button>
          <p>{savedSummary ? savedSummary.title : "本机暂无已保存战术"}</p>
        </div>
      </section>
    </main>
  );
}

function TemplateLibraryMode({ onCopyTemplate, onReturnToEdit, templates }) {
  const [selectedTemplateId, setSelectedTemplateId] = useState(templates[0]?.id ?? "");
  const [activePreviewStepId, setActivePreviewStepId] = useState(
    templates[0]?.steps[0]?.id ?? "step_0",
  );
  const [templatePlayback, setTemplatePlayback] = useState(IDLE_PLAYBACK);
  const templatePlaybackRunIdRef = useRef(0);
  const selectedTemplate =
    templates.find((template) => template.id === selectedTemplateId) ?? templates[0];
  const activePreviewStep =
    selectedTemplate.steps.find((step) => step.id === activePreviewStepId) ??
    selectedTemplate.steps[0];
  const previewBoardState = createBoardStateFromStep(activePreviewStep);
  const templatePlaybackFrame = useMemo(
    () => resolvePlaybackFrame(selectedTemplate.steps, templatePlayback),
    [selectedTemplate.steps, templatePlayback],
  );
  const isTemplatePlaybackVisible = templatePlayback.status !== "idle";
  const displayedPreviewBoardState =
    templatePlaybackFrame?.boardState ?? previewBoardState;
  const displayedPreviewStep = templatePlaybackFrame?.displayStep ?? activePreviewStep;
  const displayedPreviewStepIndex =
    templatePlaybackFrame?.displayStepIndex ??
    Math.max(
      0,
      selectedTemplate.steps.findIndex((step) => step.id === activePreviewStepId),
    );
  const canPlayTemplate = selectedTemplate.steps.length > 1;

  useEffect(() => {
    if (templatePlayback.status !== "playing") {
      return undefined;
    }

    const runId = templatePlaybackRunIdRef.current;
    const intervalId = window.setInterval(() => {
      if (templatePlaybackRunIdRef.current !== runId) {
        return;
      }

      setTemplatePlayback((currentPlayback) => {
        if (currentPlayback.status !== "playing") {
          return currentPlayback;
        }

        const lastSegmentIndex = Math.max(0, selectedTemplate.steps.length - 2);
        const segmentCount = lastSegmentIndex + 1;
        const elapsedMs = getNow() - currentPlayback.startedAt;
        const totalDurationMs = segmentCount * PLAYBACK_STEP_DURATION_MS;

        if (elapsedMs >= totalDurationMs) {
          return {
            status: "ended",
            segmentIndex: lastSegmentIndex,
            progress: 1,
            startedAt: null,
          };
        }

        const nextSegmentIndex = Math.min(
          lastSegmentIndex,
          Math.floor(elapsedMs / PLAYBACK_STEP_DURATION_MS),
        );
        const nextProgress =
          (elapsedMs - nextSegmentIndex * PLAYBACK_STEP_DURATION_MS) /
          PLAYBACK_STEP_DURATION_MS;

        return {
          ...currentPlayback,
          status: "playing",
          segmentIndex: nextSegmentIndex,
          progress: nextProgress,
        };
      });
    }, PLAYBACK_REFRESH_MS);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [templatePlayback.status, selectedTemplate.steps.length]);

  useEffect(() => {
    if (templatePlayback.status === "ended" && selectedTemplate.steps.length > 0) {
      setActivePreviewStepId(selectedTemplate.steps[selectedTemplate.steps.length - 1].id);
    }
  }, [templatePlayback.status, selectedTemplate.steps]);

  function selectTemplate(template) {
    resetTemplatePlayback();
    setSelectedTemplateId(template.id);
    setActivePreviewStepId(template.steps[0]?.id ?? "step_0");
  }

  function selectPreviewStep(stepId) {
    resetTemplatePlayback();
    setActivePreviewStepId(stepId);
  }

  function resetTemplatePlayback() {
    templatePlaybackRunIdRef.current += 1;
    setTemplatePlayback(IDLE_PLAYBACK);
  }

  function playTemplate() {
    if (!canPlayTemplate) {
      return;
    }

    templatePlaybackRunIdRef.current += 1;
    const startedAt = getNow();
    setTemplatePlayback((currentPlayback) => {
      if (currentPlayback.status === "paused") {
        const elapsedMs =
          (currentPlayback.segmentIndex + currentPlayback.progress) *
          PLAYBACK_STEP_DURATION_MS;

        return {
          ...currentPlayback,
          status: "playing",
          startedAt: startedAt - elapsedMs,
        };
      }

      return {
        status: "playing",
        segmentIndex: 0,
        progress: 0,
        startedAt,
      };
    });
  }

  function pauseTemplate() {
    templatePlaybackRunIdRef.current += 1;
    setTemplatePlayback((currentPlayback) =>
      currentPlayback.status === "playing"
        ? {
            ...currentPlayback,
            status: "paused",
          }
        : currentPlayback,
    );
  }

  function replayTemplate() {
    if (!canPlayTemplate) {
      return;
    }

    templatePlaybackRunIdRef.current += 1;
    setTemplatePlayback({
      status: "playing",
      segmentIndex: 0,
      progress: 0,
      startedAt: getNow(),
    });
  }

  return (
    <main className="app-shell template-app">
      <section
        className="template-shell"
        aria-label="基础足球模板库"
        data-testid="template-library"
      >
        <header className="template-header">
          <button className="control-button" type="button" onClick={onReturnToEdit}>
            返回现场白板
          </button>
          <div>
            <p className="stage-label">基础模板库</p>
            <h1>8 个足球基础模板</h1>
          </div>
        </header>

        <div className="template-workspace">
          <aside className="template-list" aria-label="模板列表">
            {templates.map((template) => {
              const isSelected = template.id === selectedTemplate.id;

              return (
                <button
                  key={template.id}
                  className={isSelected ? "template-card active" : "template-card"}
                  type="button"
                  data-testid={`template-card-${template.id}`}
                  onClick={() => selectTemplate(template)}
                >
                  <span>{template.category}</span>
                  <strong>{template.name}</strong>
                  <small>{template.difficulty} · {template.recommendedMode}</small>
                </button>
              );
            })}
          </aside>

          <section className="template-detail" aria-label="模板详情">
            <div className="template-detail-header">
              <div>
                <p className="stage-label">{selectedTemplate.category}</p>
                <h2 data-testid="selected-template-name">{selectedTemplate.name}</h2>
                <p>{selectedTemplate.description}</p>
              </div>
              <div className="template-meta">
                <span>{selectedTemplate.field.format}</span>
                <span>{selectedTemplate.difficulty}</span>
                <span>{selectedTemplate.steps.length} 步</span>
              </div>
            </div>

            <div className="template-tags" aria-label="模板标签">
              {selectedTemplate.tags.map((tag) => (
                <span key={tag}>{tag}</span>
              ))}
            </div>

            <section className="template-preview-board" aria-label="模板预览球场">
              <TacticBoard
                activeTool="move"
                boardState={displayedPreviewBoardState}
                fieldView={selectedTemplate.field.view}
                readOnly
                selectedPathId={null}
                setSelectedPathId={() => {}}
                setBoardState={() => {}}
              />
            </section>

            <section className="template-step-panel" aria-label="模板步骤">
              <div className="template-step-list">
                {selectedTemplate.steps.map((step, index) => (
                  <button
                    key={step.id}
                    className={
                      step.id === displayedPreviewStep.id
                        ? "template-step-button active"
                        : "template-step-button"
                    }
                    type="button"
                    onClick={() => selectPreviewStep(step.id)}
                    disabled={templatePlayback.status === "playing"}
                  >
                    Step {index}
                  </button>
                ))}
              </div>
              <p>{displayedPreviewStep.note}</p>
              <span className="template-playback-status">
                {getPlaybackStatusText(templatePlayback.status, canPlayTemplate)} · Step{" "}
                {displayedPreviewStepIndex} / {selectedTemplate.steps.length - 1}
              </span>
            </section>

            <div className="template-detail-actions">
              <button
                className="control-button"
                type="button"
                data-testid="play-template"
                onClick={playTemplate}
                disabled={!canPlayTemplate || templatePlayback.status === "playing"}
              >
                {templatePlayback.status === "paused" ? "继续播放" : "播放模板"}
              </button>
              <button
                className="control-button"
                type="button"
                data-testid="pause-template"
                onClick={pauseTemplate}
                disabled={templatePlayback.status !== "playing"}
              >
                暂停
              </button>
              <button
                className="control-button"
                type="button"
                data-testid="replay-template"
                onClick={replayTemplate}
                disabled={!canPlayTemplate}
              >
                重播
              </button>
              <button
                className="control-button primary"
                type="button"
                data-testid="copy-template"
                onClick={() => onCopyTemplate?.(selectedTemplate)}
                disabled={!onCopyTemplate}
              >
                复制为我的战术
              </button>
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}

function PlaybackStrip({
  canPlay,
  currentStepIndex,
  currentStepNote,
  isPlaybackVisible,
  onPause,
  onPlay,
  onReplay,
  onReturnToEdit,
  showReturnToEdit,
  status,
  totalSteps,
}) {
  const statusText = getPlaybackStatusText(status, canPlay);
  const stepText = `Step ${currentStepIndex} / ${Math.max(totalSteps - 1, 0)}`;

  return (
    <div className="playback-strip" aria-label="播放控制">
      <div className="playback-summary">
        <span>{statusText}</span>
        <strong>{stepText}</strong>
        <p>{currentStepNote}</p>
      </div>
      <div className="playback-actions">
        <button
          className="control-button primary"
          type="button"
          onClick={onPlay}
          disabled={!canPlay || status === "playing"}
        >
          {status === "paused" ? "继续" : "播放"}
        </button>
        <button
          className="control-button"
          type="button"
          onClick={onPause}
          disabled={status !== "playing"}
        >
          暂停
        </button>
        <button
          className="control-button"
          type="button"
          onClick={onReplay}
          disabled={!canPlay}
        >
          重播
        </button>
        {isPlaybackVisible || showReturnToEdit ? (
          <button className="control-button" type="button" onClick={onReturnToEdit}>
            返回编辑
          </button>
        ) : null}
      </div>
    </div>
  );
}

function PresentationMode({
  canPlay,
  currentStepIndex,
  displayedBoardState,
  displayedStep,
  fieldView,
  onPause,
  onPlay,
  onReplay,
  onReturnToEdit,
  playbackStatus,
  steps,
  tacticTitle,
}) {
  return (
    <main className="app-shell presentation-app">
      <section className="presentation-shell" aria-label="现场展示模式">
        <header className="presentation-header">
          <button className="control-button" type="button" onClick={onReturnToEdit}>
            返回编辑
          </button>
          <div>
            <p className="stage-label">现场展示</p>
            <h1>{tacticTitle}</h1>
          </div>
          <StepProgress steps={steps} currentStepId={displayedStep?.id} />
        </header>

        <section className="presentation-board">
          <TacticBoard
            activeTool="move"
            boardState={displayedBoardState}
            fieldView={fieldView}
            readOnly
            selectedPathId={null}
            setSelectedPathId={() => {}}
            setBoardState={() => {}}
          />
        </section>

        <PlaybackStrip
          canPlay={canPlay}
          currentStepIndex={currentStepIndex}
          currentStepNote={displayedStep?.note}
          isPlaybackVisible={playbackStatus !== "idle"}
          onPause={onPause}
          onPlay={onPlay}
          onReplay={onReplay}
          onReturnToEdit={onReturnToEdit}
          showReturnToEdit
          status={playbackStatus}
          totalSteps={steps.length}
        />
      </section>
    </main>
  );
}

function ViewerMode({
  canPlay,
  currentStepIndex,
  displayedBoardState,
  displayedStep,
  fieldView,
  onNextStep,
  onPause,
  onPlay,
  onPreviousStep,
  onReplay,
  onReturnToEdit,
  playbackStatus,
  steps,
  tacticTitle,
}) {
  const isFirstStep = currentStepIndex <= 0;
  const isLastStep = currentStepIndex >= steps.length - 1;

  return (
    <main className="app-shell viewer-app">
      <section className="viewer-shell" aria-label="队员观看页">
        <header className="viewer-header">
          <button className="control-button" type="button" onClick={onReturnToEdit}>
            关闭
          </button>
          <div>
            <p className="stage-label">队员观看</p>
            <h1>{tacticTitle}</h1>
          </div>
          <strong className="viewer-step-count">
            Step {currentStepIndex} / {Math.max(steps.length - 1, 0)}
          </strong>
        </header>

        <section className="viewer-board">
          <TacticBoard
            activeTool="move"
            boardState={displayedBoardState}
            fieldView={fieldView}
            readOnly
            selectedPathId={null}
            setSelectedPathId={() => {}}
            setBoardState={() => {}}
          />
        </section>

        <section className="viewer-note-panel" aria-label="当前步骤说明">
          <p>{displayedStep?.note}</p>
          <div className="viewer-controls" aria-label="观看页播放控制">
            <button
              className="control-button"
              type="button"
              onClick={onPreviousStep}
              disabled={isFirstStep || playbackStatus === "playing"}
            >
              上一步
            </button>
            <button
              className="control-button primary"
              type="button"
              onClick={onPlay}
              disabled={!canPlay || playbackStatus === "playing"}
            >
              {playbackStatus === "paused" ? "继续" : "播放"}
            </button>
            <button
              className="control-button"
              type="button"
              onClick={onPause}
              disabled={playbackStatus !== "playing"}
            >
              暂停
            </button>
            <button
              className="control-button"
              type="button"
              onClick={onReplay}
              disabled={!canPlay}
            >
              重播
            </button>
            <button
              className="control-button"
              type="button"
              onClick={onNextStep}
              disabled={isLastStep || playbackStatus === "playing"}
            >
              下一步
            </button>
          </div>
        </section>
      </section>
    </main>
  );
}

function StepProgress({ steps, currentStepId }) {
  return (
    <div className="step-progress" aria-label="当前步骤">
      {steps.map((step) => (
        <span
          key={step.id}
          className={step.id === currentStepId ? "current" : undefined}
        >
          {step.title}
        </span>
      ))}
    </div>
  );
}

function getPlaybackStatusText(status, canPlay) {
  if (!canPlay) {
    return "新增 Step 1 后可播放";
  }

  if (status === "playing") {
    return "播放中";
  }

  if (status === "paused") {
    return "已暂停";
  }

  if (status === "ended") {
    return "播放结束";
  }

  return "准备播放";
}

function getNextPieceNumber(pieces) {
  return (
    pieces.reduce((largestNumber, piece) => {
      const number = Number.parseInt(piece.number, 10);
      return Number.isFinite(number) ? Math.max(largestNumber, number) : largestNumber;
    }, 0) + 1
  );
}

function getNewPiecePosition(kind, count) {
  const row = count % 5;
  const column = Math.floor(count / 5);
  const x = kind === "home" ? 24 + column * 5 : 76 - column * 5;
  const y = 16 + row * 8;

  return {
    x: clampBoardNumber(x, 8, 92),
    y: clampBoardNumber(y, 8, 56),
  };
}

function normalizeStepOrder(steps) {
  return steps.map((step, index) => ({
    ...step,
    order: index,
    title: normalizeStepTitle(step.title, index),
    baseStateFromStepId: index === 0 ? null : steps[index - 1].id,
  }));
}

function normalizeStepTitle(title, index) {
  if (typeof title !== "string" || title.trim() === "") {
    return `Step ${index}`;
  }

  if (/^Step\s+\d+/.test(title)) {
    return title.replace(/^Step\s+\d+/, `Step ${index}`);
  }

  return `Step ${index} ${title}`;
}

function clampBoardNumber(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function getNow() {
  return window.performance?.now?.() ?? Date.now();
}
