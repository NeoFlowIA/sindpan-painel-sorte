"use client";

import type { CSSProperties } from "react";
import { useEffect, useMemo, useState } from "react";

import { cn } from "@/lib/utils";

export type SlotColumnState = "idle" | "spinning" | "revealing" | "done";

export type SlotColumnProps = {
  target: string;
  state: SlotColumnState;
  delay: number;
};

const STYLE_ELEMENT_ID = "raffle-slot-column-styles";

function ensureGlobalStyles() {
  if (typeof document === "undefined") return;
  if (document.getElementById(STYLE_ELEMENT_ID)) return;

  const style = document.createElement("style");
  style.id = STYLE_ELEMENT_ID;
  style.innerHTML = `
    @keyframes slot-column-spin {
      0% { transform: translateY(0); }
      100% { transform: translateY(-1000%); }
    }
    @keyframes slot-column-pulse {
      0%, 100% { transform: scale(1); box-shadow: 0 0 0 rgba(251, 191, 36, 0.45); }
      50% { transform: scale(1.02); box-shadow: 0 0 48px rgba(220, 38, 38, 0.35), 0 0 72px rgba(251, 191, 36, 0.3); }
    }
  `;
  document.head.appendChild(style);
}

export function SlotColumn({ target, state, delay }: SlotColumnProps) {
  const digits = useMemo(() => Array.from({ length: 20 }, (_, index) => (index % 10).toString()), []);
  const [phase, setPhase] = useState<"idle" | "spinning" | "settling" | "settled">("idle");
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    ensureGlobalStyles();
  }, []);

  useEffect(() => {
    const numericTarget = Number.parseInt(target, 10) || 0;

    if (state === "spinning") {
      setPhase("spinning");
      setOffset(0);
      return;
    }

    if (state === "revealing") {
      const timeout = setTimeout(() => {
        setPhase("settling");
        setOffset(numericTarget * 100);
      }, delay);
      return () => clearTimeout(timeout);
    }

    if (state === "done") {
      setPhase("settled");
      setOffset(numericTarget * 100);
      return;
    }

    if (state === "idle") {
      setPhase("idle");
      setOffset(0);
    }
  }, [state, target, delay]);

  return (
    <div
      className={cn(
        "relative h-28 w-16 overflow-hidden rounded-[28px] border-2 border-red-700/35 bg-gradient-to-b from-amber-50 via-yellow-100 to-orange-100 text-red-950 shadow-[0_20px_60px_rgba(127,29,29,0.18)] dark:border-amber-300/40 dark:from-red-950 dark:via-orange-950 dark:to-red-900 dark:text-amber-50 transition-all md:h-36 md:w-20",
        phase === "settled" && "animate-[slot-column-pulse_1.6s_ease-in-out_1]"
      )}
    >
      <div className="absolute inset-0 bg-gradient-to-b from-amber-200/60 via-transparent to-red-900/10 dark:from-amber-300/20 dark:to-red-950/60" aria-hidden="true" />
      <div
        className={cn(
          "relative flex h-full w-full",
          phase === "spinning" ? "animate-[slot-column-spin_var(--slot-duration)_linear_infinite]" : "transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]"
        )}
        style={{
          transform: phase === "spinning" ? undefined : `translateY(-${offset}%)`,
          // base duration varies for subtle differences between columns
          // delay influences duration to avoid perfect sync
          "--slot-duration": `${1.1 + delay / 900}s`,
        } as CSSProperties}
      >
        <div
          className="grid w-full"
          style={{
            gridTemplateRows: `repeat(${digits.length}, 1fr)`,
            height: `${digits.length * 100}%`,
          }}
        >
          {digits.map((digit, index) => (
            <div
              key={`${digit}-${index}`}
              className="flex h-full items-center justify-center text-4xl font-black tracking-tight md:text-5xl"
            >
              {digit}
            </div>
          ))}
        </div>
      </div>
      <div className="pointer-events-none absolute inset-0 rounded-[28px] border border-red-900/10 shadow-inner dark:border-amber-100/10" aria-hidden="true" />
    </div>
  );
}
