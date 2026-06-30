import React, { useMemo, useState } from "react";
import { TacticBoard } from "./components/TacticBoard.jsx";
import {
  cloneBoardState,
  createInitialBoardState,
  createInitialSteps,
} from "./data/initialBoard.js";

export default function App() {
  const initialBoardState = useMemo(() => createInitialBoardState(), []);
  const [steps, setSteps] = useState(() => createInitialSteps());
  const [activeStepId, setActiveStepId] = useState("step_0");
  const [fieldView, setFieldView] = useState("half");
  const [activeTool, setActiveTool] = useState("move");
  const [selectedPathId, setSelectedPathId] = useState(null);
  const activeStep = steps.find((step) => step.id === activeStepId) ?? steps[0];
  const boardState = {
    ...activeStep.state,
    paths: activeStep.paths,
  };
  const canAddStep = steps.length < 3;

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

        const currentBoard = {
          ...step.state,
          paths: step.paths,
        };
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
    setActiveStepId(stepId);
    setSelectedPathId(null);
    setActiveTool("move");
  }

  function addNextStep() {
    if (!canAddStep) {
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
          </div>
        </header>

        <div className="workspace">
          <aside className="tool-rail" aria-label="现场工具栏">
            <button
              className={activeTool === "move" ? "tool-button active" : "tool-button"}
              type="button"
              onClick={() => setActiveTool("move")}
            >
              移动
            </button>
            <button
              className={activeTool === "run" ? "tool-button active" : "tool-button"}
              type="button"
              onClick={() => setActiveTool("run")}
            >
              跑动箭头
            </button>
            <button
              className={activeTool === "pass" ? "tool-button active" : "tool-button"}
              type="button"
              onClick={() => setActiveTool("pass")}
            >
              球路箭头
            </button>
            <button
              className="tool-button"
              type="button"
              onClick={undoLatestPath}
              disabled={boardState.paths.length === 0}
            >
              撤销
            </button>
            <button
              className="tool-button"
              type="button"
              onClick={deleteSelectedPath}
              disabled={!selectedPathId}
            >
              删除路线
            </button>
            <button
              className="tool-button"
              type="button"
              onClick={clearPaths}
              disabled={boardState.paths.length === 0}
            >
              清除路线
            </button>
            <button className="tool-button" type="button" onClick={restoreDefaultLayout}>
              恢复默认
            </button>
            <button className="tool-button danger" type="button" onClick={clearBoard}>
              清空画面
            </button>

            <div className="step-panel" aria-label="分步状态">
              <div className="step-panel-header">
                <span>步骤</span>
                <button
                  className="small-button"
                  type="button"
                  onClick={addNextStep}
                  disabled={!canAddStep}
                >
                  新增下一步
                </button>
              </div>

              <div className="step-list">
                {steps.map((step) => (
                  <button
                    key={step.id}
                    className={
                      step.id === activeStepId ? "step-button active" : "step-button"
                    }
                    type="button"
                    onClick={() => selectStep(step.id)}
                  >
                    <strong>{step.title}</strong>
                    <span>{step.baseStateFromStepId ? "继承上一状态" : "初始站位"}</span>
                  </button>
                ))}
              </div>

              <label className="step-note">
                <span>本步说明</span>
                <textarea
                  value={activeStep.note}
                  onChange={(event) => updateStepNote(event.target.value)}
                  rows="3"
                />
              </label>
            </div>
          </aside>

          <section className="board-area">
            <TacticBoard
              activeTool={activeTool}
              boardState={boardState}
              fieldView={fieldView}
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
