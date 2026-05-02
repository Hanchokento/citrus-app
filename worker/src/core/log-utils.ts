// worker/src/core/log-utils.ts
export const CLICK_COLUMNS = [
  "1_a", "1_r", "1_s",
  "2_a", "2_r", "2_s",
  "3_a", "3_r", "3_s"
] as const;

export type ClickColumn = typeof CLICK_COLUMNS[number];

export function isValidClickColumn(value: string): value is ClickColumn {
  return CLICK_COLUMNS.includes(value as ClickColumn);
}
