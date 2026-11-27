"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { BrandLogo } from "@/components/BrandLogo";
import { DrawTicker } from "@/components/DrawTicker";
import { LotoCardGrid } from "@/components/LotoCardGrid";
import { MARKER_TYPES, WIN_MODE_LABELS } from "@/lib/loto/constants";
import { createClient } from "@/lib/supabase/client";
import type { ClaimWinMode, Draw, LotoGrid, MarkerType, PlayerCard, Session } from "@/lib/types";

type MarkRow = {
  player_card_id: string;
  row: number;
  col: number;
  marker_type: MarkerType;
};

export default function PlayPage() {
  const { slug } = useParams<{ slug: string }>();
  const supabase = useMemo(() => createClient(), []);

  const [session, setSession] = useState<Session | null>(null);
  const [draws, setDraws] = useState<Draw[]>([]);
  const [cards, setCards] = useState<PlayerCard[]>([]);
  const [marks, setMarks] = useState<MarkRow[]>([]);
  const [points, setPoints] = useState(0);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [nickname, setNickname] = useState("");
  const [consent, setConsent] = useState(false);
  const [authStage, setAuthStage] = useState<"email" | "otp" | "in">("email");
  const [activeMarker, setActiveMarker] = useState<MarkerType>("star");
  const [message, setMessage] = useState<string | null>(null);

  const loadPublic = useCallback(async () => {
    const res = await fetch(`/api/sessions/${slug}`);
    const data = await res.json();
    if (res.ok) {
      setSession(data.session);
      setDraws(data.draws);
    }
  }, [slug]);

  const loadMe = useCallback(async () => {
    const res = await fetch(`/api/player/${slug}/me`);
    if (res.status === 401) return;
    const data = await res.json();
    if (!res.ok) return;
    setSession(data.session);
    setCards(data.cards ?? []);
    setMarks(data.marks ?? []);
    setPoints(data.points ?? 0);
    if (data.player) setAuthStage("in");
  }, [slug]);

  useEffect(() => {
    void loadPublic();
    void loadMe();
    const poll = setInterval(() => void loadPublic(), 2000);
    return () => clearInterval(poll);
  }, [loadPublic, loadMe]);

  useEffect(() => {
    if (!session?.id) return;
    const channel = supabase
      .channel(`session-${session.id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "draws", filter: `session_id=eq.${session.id}` },
        () => void loadPublic(),
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [session?.id, supabase, loadPublic]);

  async function sendOtp() {
    setMessage(null);
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { shouldCreateUser: true },
    });
    if (error) setMessage(error.message);
    else setAuthStage("otp");
  }

  async function verifyOtp() {
    setMessage(null);
    const { error } = await supabase.auth.verifyOtp({
      email: email.trim(),
      token: otp.trim(),
      type: "email",
    });
    if (error) {
      setMessage(error.message);
      return;
    }
    setAuthStage("in");
    await registerPlayer();
    await loadMe();
  }

  async function registerPlayer() {
    if (!consent) {
      setMessage("Нужно согласие на обработку email");
      return;
    }
    const res = await fetch(`/api/sessions/${slug}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nickname, consent: true }),
    });
    const data = await res.json();
    if (!res.ok) setMessage(data.error ?? "Ошибка регистрации");
    else setMessage("Вы зарегистрированы. Дождитесь закрытия регистрации ведущим.");
    await loadMe();
  }

  const marksForCard = (cardId: string) => {
    const map: Record<string, MarkerType> = {};
    for (const m of marks.filter((x) => x.player_card_id === cardId)) {
      map[`${m.row}:${m.col}`] = m.marker_type;
    }
    return map;
  };

  async function toggleMark(cardId: string, row: number, col: number) {
    const key = `${row}:${col}`;
    const existing = marksForCard(cardId)[key];
    const res = await fetch(`/api/player/${slug}/marks`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(
        existing
          ? { playerCardId: cardId, row, col, markerType: activeMarker, remove: true }
          : { playerCardId: cardId, row, col, markerType: activeMarker },
      ),
    });
    if (res.ok) await loadMe();
  }

  async function submitClaim(cardId: string, mode: ClaimWinMode) {
    const res = await fetch(`/api/player/${slug}/claim`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ playerCardId: cardId, winMode: mode }),
    });
    const data = await res.json();
    if (!res.ok) setMessage(data.error ?? "Ошибка заявки");
    else setMessage("Заявка «Лото!» отправлена ведущему");
  }

  const drawn = draws.map((d) => d.barrel);

  return (
    <main className="mx-auto max-w-lg space-y-6 px-4 py-8">
      <header className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <BrandLogo />
          <div>
            <h1 className="text-lg font-semibold">Лото онлайн</h1>
            <p className="text-xs text-slate-400">
              {session?.status === "registration"
                ? "Регистрация открыта"
                : session?.status === "playing"
                  ? "Идёт игра"
                  : "Ожидание"}
            </p>
          </div>
        </div>
        {authStage === "in" && (
          <div className="glass-panel px-3 py-1 text-sm text-loto-gold">
            {points} очк.
          </div>
        )}
      </header>

      <DrawTicker draws={draws} />

      {authStage !== "in" && (
        <section className="glass-panel space-y-3 p-5">
          <p className="text-sm text-slate-300">Вход по email (код OTP)</p>
          {authStage === "email" && (
            <>
              <input
                className="input-field"
                type="email"
                placeholder="email@company.ru"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <input
                className="input-field"
                placeholder="Ник (необязательно)"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
              />
              <label className="flex items-start gap-2 text-xs text-slate-400">
                <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
                Согласен на обработку email для участия в игре
              </label>
              <button type="button" className="btn-primary w-full" onClick={() => void sendOtp()}>
                Получить код
              </button>
            </>
          )}
          {authStage === "otp" && (
            <>
              <input
                className="input-field"
                placeholder="Код из письма"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
              />
              <button type="button" className="btn-primary w-full" onClick={() => void verifyOtp()}>
                Войти и зарегистрироваться
              </button>
            </>
          )}
        </section>
      )}

      {authStage === "in" && !cards.length && (
        <p className="glass-panel p-4 text-sm text-slate-300">
          Регистрация принята. Карточки появятся после того, как ведущий закроет регистрацию.
        </p>
      )}

      {authStage === "in" && cards.length > 0 && (
        <>
          <div className="flex flex-wrap gap-2">
            {MARKER_TYPES.map((m) => (
              <button
                key={m}
                type="button"
                className={`rounded-lg border px-3 py-1 text-xs ${
                  activeMarker === m ? "border-loto-cyan bg-loto-cyan/20" : "border-white/10"
                }`}
                onClick={() => setActiveMarker(m)}
              >
                {m}
              </button>
            ))}
          </div>

          {cards.map((card) => (
            <section key={card.id} className="glass-panel space-y-3 p-4">
              <h2 className="text-sm font-medium text-loto-cyan">Карточка №{card.card_number}</h2>
              <LotoCardGrid
                grid={card.grid as LotoGrid}
                drawn={drawn}
                marks={marksForCard(card.id)}
                highlightDrawn
                onToggle={(r, c) => void toggleMark(card.id, r, c)}
              />
              <div className="flex flex-wrap gap-2">
                {(Object.keys(WIN_MODE_LABELS) as ClaimWinMode[]).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    className="btn-ghost text-xs"
                    onClick={() => void submitClaim(card.id, mode)}
                  >
                    Лото! · {WIN_MODE_LABELS[mode]}
                  </button>
                ))}
              </div>
            </section>
          ))}
        </>
      )}

      {message && <p className="text-center text-sm text-slate-400">{message}</p>}
    </main>
  );
}