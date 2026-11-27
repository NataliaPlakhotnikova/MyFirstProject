export type SessionStatus = "draft" | "registration" | "playing" | "finished";

export type WinModes = {
  one_line: boolean;
  two_lines: boolean;
  full_card: boolean;
};

export type MarkerType =
  | "star"
  | "circle"
  | "diamond"
  | "heart"
  | "oval"
  | "logo";

export type LotoGrid = (number | null)[][];

export type PlayerCard = {
  id: string;
  session_id: string;
  player_id: string;
  card_number: number;
  grid: LotoGrid;
};

export type Draw = {
  id: string;
  session_id: string;
  sequence: number;
  barrel: number;
  confirmed_at: string;
};

export type Session = {
  id: string;
  host_token: string;
  slug: string;
  status: SessionStatus;
  cards_per_player: number;
  win_modes: WinModes;
  registration_open: boolean;
  created_at: string;
};

export type ClaimWinMode = "one_line" | "two_lines" | "full_card";