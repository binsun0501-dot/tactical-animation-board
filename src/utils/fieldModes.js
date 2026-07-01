export const FIELD_MODES = {
  ATTACKING_HALF: "attacking_half",
  FULL_FIELD: "full_field",
};

export function normalizeFieldView(fieldView) {
  if (fieldView === "full" || fieldView === FIELD_MODES.FULL_FIELD) {
    return FIELD_MODES.FULL_FIELD;
  }

  return FIELD_MODES.ATTACKING_HALF;
}
