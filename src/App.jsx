import { useMemo, useState } from "react";
import { TacticBoard } from "./components/TacticBoard.jsx";
import { createInitialBoardState } from "./data/initialBoard.js";

export default function App() {
  const initialBoardState = useMemo(() => createInitialBoardState(), []);
  const [boardState, setBoardState] = useState(initialBoardState);
  const [fieldView, setFieldView] = useState("half");

  function restoreDefaultLayout() {
    setBoardState(createInitialBoardState());
  }

  function clearBoard() {
    const shouldClear = window.confirm("清空当前画面？可用恢复默认布局找回初始摆位。");
    if (!shouldClear) {
      return;
    }

    setBoardState({
      players: [],
      opponents: [],
      ball: null,
    });
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
            <button className="tool-button active" type="button">
              移动
            </button>
            <button className="tool-button" type="button" onClick={restoreDefaultLayout}>
              恢复默认
            </button>
            <button className="tool-button danger" type="button" onClick={clearBoard}>
              清空画面
            </button>
          </aside>

          <section className="board-area">
            <TacticBoard
              boardState={boardState}
              fieldView={fieldView}
              setBoardState={setBoardState}
            />
          </section>
        </div>
      </section>
    </main>
  );
}
