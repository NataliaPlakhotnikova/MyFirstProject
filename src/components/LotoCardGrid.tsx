"use client";

import clsx from "clsx";
import type { LotoGrid, MarkerType } from "@/lib/types";

const MARKER_ICON: Record<MarkerType, string> = {
  star: "★",
  circle: "●",
  diamond: "◆",
  heart: "♥",
  oval: "⬭",
  logo: "◎",
};

type Props = {
  grid: LotoGrid;
  drawn: number[];
  marks: Record<string, MarkerType>;
  onToggle?: (row: number, col: number) => void;
  readonly?: boolean;
  highlightDrawn?: boolean;
};

export function LotoCardGrid({
  grid,
  drawn,
  marks,
  onToggle,
  readonly,
  highlightDrawn,
}: Props) {
  const drawnSet = new Set(drawn);

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[280px] border-collapse text-center text-sm sm:text-base">
        <tbody>
          {grid.map((row, r) => (
            <tr key={r}>
              {row.map((cell, c) => {
                const key = `${r}:${c}`;
                const marked = marks[key];
                const isDrawn = cell != null && drawnSet.has(cell);
                const showMark = marked || isDrawn;

                return (
                  <td key={c} className="p-0.5 sm:p-1">
                    <button
                      type="button"
                      disabled={readonly || cell == null}
                      onClick={() => onToggle?.(r, c)}
                      className={clsx(
                        "flex h-9 w-full min-w-[2rem] items-center justify-center rounded-lg border text-xs font-semibold transition sm:h-11 sm:min-w-[2.5rem] sm:text-sm",
                        cell == null
                          ? "border-transparent bg-white/5"
                          : "border-white/10 bg-white/10 hover:border-loto-cyan/50",
                        highlightDrawn && isDrawn && "animate-pulse-soft border-loto-cyan/60 bg-loto-cyan/15",
                        showMark && "shadow-neon",
                      )}
                    >
                      {cell == null ? (
                        ""
                      ) : showMark ? (
                        <span className="text-loto-gold">
                          {marked ? MARKER_ICON[marked] : "•"}
                        </span>
                      ) : (
                        cell
                      )}
                    </button>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}