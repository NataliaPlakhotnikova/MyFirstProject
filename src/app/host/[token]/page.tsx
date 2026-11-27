"use client";

import { QRCodeSVG } from "qrcode.react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { BrandLogo } from "@/components/BrandLogo";
import { DrawTicker } from "@/components/DrawTicker";
import { PILOT_MAX_CARDS_PER_PLAYER, WIN_MODE_LABELS } from "@/lib/loto/constants";
import type { Draw, Session, WinModes } from "@/lib/types";

type PlayerRow = { id: string; email: string; nickname: string | null };
type CardRow = { id: string; player_id: string; card_number: number };
type ClaimRow = {
  id: string;
  status: string;
  claimed_win_mode: string;
  player_cards?: { card_number: number } | { card_number: number }[];
};

export default function HostPage() {
  const { token } = useParams<{ token: string }>();
  const [session, setSession] = useState<Session | null>(null);
  const [players, setPlayers] = useState<PlayerRow[]>([]);
  const [cards, setCards] = useState<CardRow[]>([]);
  const [draws, setDraws] = useState<Draw[]>([]);
  const [claims, setClaims] = useState<ClaimRow[]>([]);
  const [candidate, setCandidate] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const playUrl = useMemo(() => {
    if (!session) return "";
    const base = typeof window !== "undefined" ? window.location.origin : "";
    return `${base}/play/${session.slug}`;
  }, [session]);

  const load = useCallback(async () => {
    const res = await fetch(`/api/host/${token}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? "Ошибка загрузки");
    setSession(data.session);
    setPlayers(data.players);
    setCards(data.cards);
    setDraws(data.draws);
    setClaims(data.claims);
  }, [token]);

  useEffect(() => {
    load().catch((e) => setError(e.message));
    const t = setInterval(() => {
      load().catch(() => {});
    }, 2500);
    return () => clearInterval(t);
  }, [load]);

  async function patchSettings(patch: Record<string, unknown>) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/host/${token}/settings`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка");
    } finally {
      setBusy(false);
    }
  }

  async function closeRegistration() {
    setBusy(true);
    try {
      const res = await fetch(`/api/host/${token}/close-registration`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка");
    } finally {
      setBusy(false);
    }
  }

  async function pullRng() {
    setBusy(true);
    try {
      const res = await fetch(`/api/host/${token}/rng`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setCandidate(data.candidate);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка");
    } finally {
      setBusy(false);
    }
  }

  async function confirmDraw() {
    if (candidate == null) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/host/${token}/draw/confirm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ barrel: candidate }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setCandidate(null);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка");
    } finally {
      setBusy(false);
    }
  }

  async function resolveClaim(id: string, action: "accept" | "reject") {
    setBusy(true);
    try {
      const res = await fetch(`/api/host/${token}/claims/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка");
    } finally {
      setBusy(false);
    }
  }

  const cardsByPlayer = useMemo(() => {
    const map = new Map<string, number[]>();
    for (const c of cards) {
      const list = map.get(c.player_id) ?? [];
      list.push(c.card_number);
      map.set(c.player_id, list);
    }
    return map;
  }, [cards]);

  const winModes = (session?.win_modes ?? {}) as WinModes;

  function toggleWinMode(key: keyof WinModes) {
    if (!session) return;
    const next = { ...winModes, [key]: !winModes[key] };
    void patchSettings({ winModes: next });
  }

  if (!session) {
    return (
      <main className="flex min-h-screen items-center justify-center p-6">
        <p className="text-slate-400">{error ?? "Загрузка панели ведущего…"}</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-4xl space-y-6 px-4 py-8 sm:px-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <BrandLogo />
          <div>
            <h1 className="text-xl font-semibold">Панель ведущего</h1>
            <p className="text-xs text-slate-400">Статус: {session.status}</p>
          </div>
        </div>
        {playUrl && (
          <div className="glass-panel flex items-center gap-4 p-3">
            <QRCodeSVG value={playUrl} size={72} bgColor="transparent" fgColor="#22d3ee" />
            <div className="max-w-[200px] break-all text-xs text-loto-cyan">{playUrl}</div>
          </div>
        )}
      </header>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <section className="glass-panel grid gap-4 p-5 sm:grid-cols-2">
        <label className="text-sm text-slate-300">
          Карточек на игрока (пилот ≤{PILOT_MAX_CARDS_PER_PLAYER})
          <input
            type="number"
            min={1}
            max={PILOT_MAX_CARDS_PER_PLAYER}
            className="input-field mt-1"
            value={session.cards_per_player}
            disabled={session.status !== "draft" && session.status !== "registration"}
            onChange={(e) =>
              void patchSettings({ cardsPerPlayer: Number(e.target.value) })
            }
          />
        </label>
        <div className="space-y-2">
          <p className="text-sm text-slate-300">Регистрация</p>
          <button
            type="button"
            className="btn-ghost mr-2"
            disabled={busy || session.registration_open}
            onClick={() => void patchSettings({ registrationOpen: true })}
          >
            Открыть
          </button>
          <button
            type="button"
            className="btn-primary"
            disabled={busy || !session.registration_open}
            onClick={() => void closeRegistration()}
          >
            Закрыть и выдать карточки
          </button>
        </div>
        <div>
          <p className="mb-2 text-sm text-slate-300">Режимы побед</p>
          {(Object.keys(WIN_MODE_LABELS) as (keyof WinModes)[]).map((key) => (
            <label key={key} className="mb-1 flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={!!winModes[key]}
                onChange={() => toggleWinMode(key)}
              />
              {WIN_MODE_LABELS[key]}
            </label>
          ))}
        </div>
      </section>

      <DrawTicker draws={draws} />

      <section className="glass-panel flex flex-wrap items-center gap-4 p-5">
        <button type="button" className="btn-ghost" disabled={busy} onClick={() => void pullRng()}>
          Сгенерировать бочонок
        </button>
        {candidate != null && (
          <span className="text-lg">
            Кандидат: <strong className="text-loto-gold">{candidate}</strong>
          </span>
        )}
        <button
          type="button"
          className="btn-primary"
          disabled={busy || candidate == null}
          onClick={() => void confirmDraw()}
        >
          Подтвердить для всех
        </button>
        <p className="text-xs text-slate-500">RNG на сервере · без отката в MVP</p>
      </section>

      <section className="glass-panel overflow-x-auto p-5">
        <h2 className="mb-3 text-sm font-medium text-slate-300">Игроки ↔ № карточек</h2>
        <table className="w-full text-left text-sm">
          <thead className="text-slate-500">
            <tr>
              <th className="pb-2 pr-4">Email</th>
              <th className="pb-2 pr-4">Ник</th>
              <th className="pb-2">Карточки</th>
            </tr>
          </thead>
          <tbody>
            {players.map((p) => (
              <tr key={p.id} className="border-t border-white/5">
                <td className="py-2 pr-4 font-mono text-xs">{p.email}</td>
                <td className="py-2 pr-4">{p.nickname ?? "—"}</td>
                <td className="py-2">{(cardsByPlayer.get(p.id) ?? []).join(", ") || "—"}</td>
              </tr>
            ))}
            {!players.length && (
              <tr>
                <td colSpan={3} className="py-4 text-slate-500">
                  Пока нет зарегистрированных игроков
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>

      <section className="glass-panel p-5">
        <h2 className="mb-3 text-sm font-medium text-slate-300">Заявки «Лото!»</h2>
        <ul className="space-y-2">
          {claims
            .filter((c) => c.status === "pending")
            .map((c) => {
              const pc = c.player_cards;
              const num = Array.isArray(pc) ? pc[0]?.card_number : pc?.card_number;
              return (
                <li
                  key={c.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/10 bg-black/20 px-3 py-2"
                >
                  <span>
                    Карточка №{num} · {WIN_MODE_LABELS[c.claimed_win_mode] ?? c.claimed_win_mode}
                  </span>
                  <span className="flex gap-2">
                    <button
                      type="button"
                      className="btn-primary text-xs"
                      onClick={() => void resolveClaim(c.id, "accept")}
                    >
                      Принять
                    </button>
                    <button
                      type="button"
                      className="btn-ghost text-xs"
                      onClick={() => void resolveClaim(c.id, "reject")}
                    >
                      Отклонить
                    </button>
                  </span>
                </li>
              );
            })}
          {!claims.filter((c) => c.status === "pending").length && (
            <li className="text-slate-500">Нет ожидающих заявок</li>
          )}
        </ul>
      </section>
    </main>
  );
}