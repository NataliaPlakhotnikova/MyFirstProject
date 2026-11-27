"use client";

import Image from "next/image";
import type { Draw } from "@/lib/types";

export function DrawTicker({ draws }: { draws: Draw[] }) {
  const latest = draws.length ? draws[draws.length - 1] : null;

  return (
    <div className="glass-panel flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
      <motionBarrel latest={latest?.barrel} />
      <div className="flex-1">
        <p className="text-xs uppercase tracking-wide text-slate-400">Выпавшие бочонки</p>
        <div className="mt-2 flex max-h-24 flex-wrap gap-1.5 overflow-y-auto">
          {draws.map((d) => (
            <span
              key={d.id}
              className="rounded-lg border border-white/10 bg-black/30 px-2 py-0.5 text-xs font-mono text-loto-cyan"
            >
              {d.barrel}
            </span>
          ))}
          {!draws.length && (
            <span className="text-sm text-slate-500">Ожидаем первый бочонок…</span>
          )}
        </div>
      </div>
    </div>
  );
}

function motionBarrel({ latest }: { latest?: number }) {
  return (
    <div className="flex items-center gap-3">
      <Image
        src="/brand/barrel.svg"
        alt=""
        width={56}
        height={56}
        className={latest ? "animate-barrel-in h-14 w-14" : "h-14 w-14 opacity-60"}
      />
      <div>
        <p className="text-xs text-slate-400">Последний</p>
        <p className="text-3xl font-bold text-loto-gold">{latest ?? "—"}</p>
      </div>
    </div>
  );
}