export const COLUMN_RANGES: ReadonlyArray<[number, number]> = [
  [1, 9],
  [10, 19],
  [20, 29],
  [30, 39],
  [40, 49],
  [50, 59],
  [60, 69],
  [70, 79],
  [80, 90],
];

export const MARKER_TYPES = [
  "star",
  "circle",
  "diamond",
  "heart",
  "oval",
  "logo",
] as const;

export const WIN_MODE_LABELS: Record<string, string> = {
  one_line: "1 линия",
  two_lines: "2 линии",
  full_card: "Полная карточка",
};

export const PILOT_MAX_CARDS_PER_PLAYER = 2;