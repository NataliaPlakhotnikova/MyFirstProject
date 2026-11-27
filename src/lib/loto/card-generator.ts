import { COLUMN_RANGES } from "./constants";
import type { LotoGrid } from "@/lib/types";

function randomInt(min: number, max: number): number {
  const range = max - min + 1;
  const buf = new Uint32Array(1);
  crypto.getRandomValues(buf);
  return min + (buf[0] % range);
}

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = randomInt(0, i);
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function tryOnce(): LotoGrid | null {
  const grid: LotoGrid = [
    Array<number | null>(9).fill(null),
    Array<number | null>(9).fill(null),
    Array<number | null>(9).fill(null),
  ];
  const rowFilled = [0, 0, 0];

  for (let col = 0; col < 9; col++) {
    const rowsLeft = rowFilled.map((c, r) => (c < 5 ? r : -1)).filter((r) => r >= 0);
    const colsAfter = 9 - col - 1;
    const minNeeded = Math.max(1, 3 - colsAfter);
    const maxPossible = Math.min(3, rowsLeft.length, 15 - rowFilled.reduce((a, b) => a + b, 0) - colsAfter);
    if (maxPossible < minNeeded) return null;

    const count = randomInt(minNeeded, maxPossible);
    const pickedRows = shuffle(rowsLeft).slice(0, count);

    const [lo, hi] = COLUMN_RANGES[col];
    const pool: number[] = [];
    for (let n = lo; n <= hi; n++) pool.push(n);
    const nums = shuffle(pool).slice(0, count);

    pickedRows.forEach((row, i) => {
      grid[row][col] = nums[i];
      rowFilled[row]++;
    });
  }

  if (!rowFilled.every((c) => c === 5)) return null;
  return grid;
}

export function generateLotoCard(): LotoGrid {
  for (let attempt = 0; attempt < 800; attempt++) {
    const card = tryOnce();
    if (card) return card;
  }
  throw new Error("Не удалось сгенерировать карточку");
}

export function gridNumbers(grid: LotoGrid): number[] {
  const out: number[] = [];
  for (const row of grid) {
    for (const cell of row) {
      if (cell != null) out.push(cell);
    }
  }
  return out;
}