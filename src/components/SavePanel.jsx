export function SavePanel({
  tacticTitle,
  onTitleChange,
  onSave,
  onLoadSaved,
  savedSummary,
  status,
  disabled,
}) {
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

      <p className="saved-summary">
        {savedSummary ? `最近保存：${savedSummary.title}` : "还没有本地保存"}
      </p>
      {status ? <p className="save-status">{status}</p> : null}
    </section>
  );
}
