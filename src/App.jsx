import React, { useEffect, useMemo, useState } from "react";
import { TacticBoard } from "./components/TacticBoard.jsx";
import {
  cloneBoardState,
  createInitialBoardState,
  createInitialSteps,
} from "./data/initialBoard.js";
import {
  PLAYBACK_STEP_DURATION_MS,
  createBoardStateFromStep,
  resolvePlaybackFrame,
} from "./utils/playback.js";

const IDLE_PLAYBACK = {
  status: "idle",
  segmentIndex: 0,
  progress: 0,
};
const PLAYBACK_TICK_MS = 1000 / 60;

export default function App() {
  const [steps, setSteps] = useState(() => createInitialSteps());
  const [activeStepId, setActiveStepId] = useState("step_0");
  const [fieldView, setFieldView] = useState("half");
  const [activeTool, setActiveTool] = useState("move");
  const [selectedPathId, setSelectedPathId] = useState(null);
  const [playback, setPlayback] = useState(IDLE_PLAYBACK);
  const [appMode, setAppMode] = useState("edit");

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
  const canAddStep = steps.length < 3;
  const canPlay = steps.length > 1;
  const editingDisabled = isPlaybackVisible;
  const isPresentationMode = appMode === "presentation";
  const isViewerMode = appMode === "viewer";

  useEffect(() => {
    if (playback.status !== "playing") {
      return undefined;
    }

    const intervalId = window.setInterval(() => {
      setPlayback((currentPlayback) => {
        if (currentPlayback.status !== "playing") {
          return currentPlayback;
        }

        const lastSegmentIndex = Math.max(0, steps.length - 2);
        let nextSegmentIndex = currentPlayback.segmentIndex;
        let nextProgress =
          currentPlayback.progress + PLAYBACK_TICK_MS / PLAYBACK_STEP_DURATION_MS;

        while (nextProgress >= 1 && nextSegmentIndex < lastSegmentIndex) {
          nextProgress -= 1;
          nextSegmentIndex += 1;
        }

        if (nextProgress >= 1 && nextSegmentIndex >= lastSegmentIndex) {
          return {
            status: "ended",
            segmentIndex: lastSegmentIndex,
            progress: 1,
          };
        }

        return {
          status: "playing",
          segmentIndex: nextSegmentIndex,
          progress: nextProgress,
        };
      });
    }, PLAYBACK_TICK_MS);

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
    setPlayback(IDLE_PLAYBACK);
  }

  function restoreDefaultLayout() {
    updateCurrentStepBoard(() => createInitialBoardState());
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
      setActiveTool("move");
      return [...currentSteps, nextStep];
    });
  }

  function updateStepNote(note) {
    setSteps((currentSteps) =>
      currentSteps.map((step) =>
        step.id === activeStepId ? { ...step, note } : step,
      ),
    );
  }

  function playSteps() {
    if (!canPlay) {
      return;
    }

    setActiveTool("move");
    setSelectedPathId(null);
    setPlayback((currentPlayback) => {
      if (currentPlayback.status === "paused") {
        return {
          ...currentPlayback,
          status: "playing",
        };
      }

      return {
        status: "playing",
        segmentIndex: 0,
        progress: 0,
      };
    });
  }

  function pausePlayback() {
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
    setPlayback({
      status: "playing",
      segmentIndex: 0,
      progress: 0,
    });
  }

  function returnToEdit() {
    if (displayedStep?.id) {
      setActiveStepId(displayedStep.id);
    }

    resetPlayback();
    setSelectedPathId(null);
    setActiveTool("move");
  }

  function enterPresentationMode() {
    resetPlayback();
    setSelectedPathId(null);
    setActiveTool("move");
    setAppMode("presentation");
  }

  function returnToEditMode() {
    returnToEdit();
    setAppMode("edit");
  }

  function enterViewerMode() {
    resetPlayback();
    setSelectedPathId(null);
    setActiveTool("move");
    setAppMode("viewer");
  }

  function goToStepByIndex(nextStepIndex) {
    const nextStep = steps[nextStepIndex];
    if (!nextStep) {
      return;
    }

    resetPlayback();
    setActiveStepId(nextStep.id);
    setSelectedPathId(null);
    setActiveTool("move");
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
            <button className="toggle action" type="button" onClick={enterPresentationMode}>
              展示模式
            </button>
            <button className="toggle action" type="button" onClick={enterViewerMode}>
              观看页
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

            <div className="step-panel" aria-label="分步状态">
              <div className="step-panel-header">
                <span>步骤</span>
                <button
                  className="small-button"
                  type="button"
                  onClick={addNextStep}
                  disabled={!canAddStep || editingDisabled}
                >
                  新增下一步
                </button>
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
              setSelectedPathId={setSelectedPathId}
              setBoardState={updateCurrentStepBoard}
            />
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
            <h1>战术动画板</h1>
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
            <h1>战术动画板</h1>
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
