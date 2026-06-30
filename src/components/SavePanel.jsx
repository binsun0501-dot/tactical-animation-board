import { useRef } from "react";

export function SavePanel({
  tacticTitle,
  onTitleChange,
  onSave,
  onLoadSaved,
  onExportJson,
  onImportJson,
  onExportStepImage,
  savedSummary,
  status,
  disabled,
}) {
  const fileInputRef = useRef(null);

  function openFilePicker() {
    fileInputRef.current?.click();
  }

  function handleFileChange(event) {
    const [file] = event.target.files;
    if (file) {
      onImportJson(file);
    }

    event.target.value = "";
  }

  return (
    <section className="save-panel" aria-label="保存战术">
      <label className="tactic-title-field">
        <span>战术名称</span>
        <input
          data-testid="tactic-title-input"
          type="text"
          value={tacticTitle}
          onChange={(event) => onTitleChange(event.target.value)}
          placeholder="我的战术"
          disabled={disabled}
        />
      </label>

      <div className="save-actions">
        <button
          className="small-button"
          type="button"
          data-testid="save-tactic"
          onClick={onSave}
          disabled={disabled}
        >
          保存战术
        </button>
        <button className="small-button" type="button" data-testid="load-saved-tactic" onClick={onLoadSaved}>
          打开最近
        </button>
      </div>

      <div className="save-actions">
        <button
          className="small-button"
          type="button"
          data-testid="export-json"
          onClick={onExportJson}
          disabled={disabled}
        >
          导出战术
        </button>
        <button
          className="small-button"
          type="button"
          data-testid="import-json"
          onClick={openFilePicker}
          disabled={disabled}
        >
          打开文件
        </button>
      </div>

      <button
        className="small-button"
        type="button"
        data-testid="export-step-image"
        onClick={onExportStepImage}
        disabled={disabled}
      >
        导出当前步骤图片
      </button>

      <input
        ref={fileInputRef}
        className="file-input"
        data-testid="import-json-file"
        type="file"
        accept="application/json,.json"
        onChange={handleFileChange}
        tabIndex={-1}
      />

      <p className="saved-summary">
        {savedSummary ? `最近保存：${savedSummary.title}` : "还没有本地保存"}
      </p>
      {status ? <p className="save-status">{status}</p> : null}
    </section>
  );
}
