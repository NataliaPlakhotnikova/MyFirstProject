"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BrandLogo } from "@/components/BrandLogo";
import { PILOT_MAX_CARDS_PER_PLAYER } from "@/lib/loto/constants";

export default function HomePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function createHostSession() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cardsPerPlayer: PILOT_MAX_CARDS_PER_PLAYER }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Ошибка");
      router.push(`/host/${data.session.host_token}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col justify-center gap-8 px-6 py-12">
      <header className="flex items-center gap-4">
        <BrandLogo />
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Лото онлайн</h1>
          <p className="text-sm text-slate-400">Корпоративное мероприятие · MVP</p>
        </div>
      </header>

      <section className="glass-panel space-y-4 p-6">
        <p className="text-sm text-slate-300">
          Ведущий создаёт сессию, игроки подключаются по ссылке или QR. Пилот: до{" "}
          {PILOT_MAX_CARDS_PER_PLAYER} карточек на игрока.
        </p>
        <button
          type="button"
          className="btn-primary w-full disabled:opacity-50"
          disabled={loading}
          onClick={createHostSession}
        >
          {loading ? "Создаём…" : "Я ведущий — создать сессию"}
        </button>
        {error && <p className="text-sm text-red-400">{error}</p>}
      </section>

      <p className="text-center text-xs text-slate-500">
        Регистрация по email (OTP) · без звуков · без публичного лидерборда
      </p>
    </main>
  );
}