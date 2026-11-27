import type { ClaimWinMode, LotoGrid, WinModes } from "@/lib/types";
import type { MarkerType } from "@/lib/types";

export type MarkSet = Set<string>;

export function markKey(row: number, col: number): string {
  return `${row}:${col}`;
}

export function drawnSet(drawn: number[]): Set<number> {
  return new Set(drawn);
}

export function isCellMarked(
  grid: LotoGrid,
  marks: MarkSet,
  row: number,
  col: number,
  drawn: Set<number>,
): boolean {
  const val = grid[row][col];
  if (val == null) return true;
  if (drawn.has(val)) return true;
  return marks.has(markKey(row, col));
}

function completedLines(
  grid: LotoGrid,
  marks: MarkSet,
  drawn: Set<number>,
): number {
  let lines = 0;
  for (let row = 0; row < 3; row++) {
    let ok = true;
    for (let col = 0; col < 9; col++) {
      if (!isCellMarked(grid, marks, row, col, drawn)) {
        ok = false;
        break;
      }
    }
    if (ok) lines++;
  }
  return lines;
}

function isFullCard(
  grid: LotoGrid,
  marks: MarkSet,
  drawn: Set<number>,
): boolean {
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 9; col++) {
      if (!isCellMarked(grid, marks, row, col, drawn)) return false;
    }
  }
  return true;
}

export function validateClaim(
  grid: LotoGrid,
  marks: Map<string, MarkerType>,
  drawn: number[],
  mode: ClaimWinMode,
  activeModes: WinModes,
): { ok: boolean; reason?: string } {
  if (!activeModes[mode]) {
    return { ok: false, reason: "Режим победы не активен в этой сессии" };
  }

  const markSet: MarkSet = new Set(marks.keys());
  const drawnNums = drawnSet(drawn);

  const lines = completedLines(grid, markSet, drawnNums);

  if (mode === "one_line" && lines < 1) {
    return { ok: false, reason: "Нет закрытой линии" };
  }
  if (mode === "two_lines" && lines < 2) {
    return { ok: false, reason: "Нужны две закрытые линии" };
  }
  if (mode === "full_card" && !isFullCard(grid, markSet, drawnNums)) {
    return { ok: false, reason: "Карточка не заполнена полностью" };
  }

  for (const key of marks.keys()) {
    const [rowS, colS] = key.split(":");
    const row = Number(rowS);
    const col = Number(colS);
    const val = grid[row][col];
    if (val == null) continue;
    if (!drawnNums.has(val)) {
      return {
        ok: false,
        reason: `Число ${val} отмечено, но бочонок ещё не выпал`,
      };
    }
  }

  return { ok: true };
}

export function pointsForClaim(mode: ClaimWinMode): number {
  switch (mode) {
    case "one_line":
      return 10;
    case "two_lines":
      return 25;
    case "full_card":
      return 50;
    default:
      return 0;
  }
}