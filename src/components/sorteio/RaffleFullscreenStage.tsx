"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

import { SlotColumn, type SlotColumnState } from "./SlotColumn";

export type RaffleWinner = {
  numero: string;
  nome?: string;
  telefone?: string;
  cupom?: string;
};

const SOUND_STORAGE_KEY = "sorteio-stage-muted";
const COLUMN_STAGGER = 140;

export type RaffleFullscreenStageProps = {
  open: boolean;
  onOpenChange: (value: boolean) => void;
  estado: SlotColumnState;
  vencedor?: RaffleWinner;
  onNovoSorteio?: () => void;
  onVoltar?: () => void;
  canSortearNovamente?: boolean;
  isProcessing?: boolean;
};

export function RaffleFullscreenStage({
  open,
  onOpenChange,
  estado,
  vencedor,
  onNovoSorteio,
  onVoltar,
  canSortearNovamente,
  isProcessing,
}: RaffleFullscreenStageProps) {
  const [digits, setDigits] = useState("00000");
  const [showConfetti, setShowConfetti] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const audioContextRef = useRef<AudioContext | null>(null);
  const revealTimeoutRef = useRef<number>();

  useEffect(() => {
    if (!open) {
      setDigits("00000");
      setShowConfetti(false);
    }
  }, [open]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem(SOUND_STORAGE_KEY);
    if (stored === null) {
      setIsMuted(true);
      return;
    }
    setIsMuted(stored === "true");
  }, []);

  const ensureAudioContext = useCallback(() => {
    if (typeof window === "undefined") return null;
    if (!audioContextRef.current) {
      type ExtendedWindow = Window & {
        webkitAudioContext?: typeof AudioContext;
      };
      const extendedWindow = window as ExtendedWindow;
      const AudioContextConstructor = window.AudioContext || extendedWindow.webkitAudioContext;
      if (!AudioContextConstructor) return null;
      audioContextRef.current = new AudioContextConstructor();
    }
    return audioContextRef.current;
  }, []);

  const playRevealSwell = useCallback(async () => {
    if (isMuted) return;
    const context = ensureAudioContext();
    if (!context) return;

    if (context.state === "suspended") {
      try {
        await context.resume();
      } catch (error) {
        console.error("Erro ao retomar áudio do sorteio", error);
        return;
      }
    }

    const oscillator = context.createOscillator();
    const gainNode = context.createGain();

    oscillator.type = "sine";
    const now = context.currentTime;
    oscillator.frequency.setValueAtTime(240, now);
    oscillator.frequency.exponentialRampToValueAtTime(880, now + 0.7);

    gainNode.gain.setValueAtTime(0.0001, now);
    gainNode.gain.exponentialRampToValueAtTime(0.4, now + 0.15);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.85);

    oscillator.connect(gainNode);
    gainNode.connect(context.destination);

    oscillator.start(now);
    oscillator.stop(now + 0.9);
  }, [ensureAudioContext, isMuted]);

  useEffect(() => {
    if (estado === "spinning") {
      setDigits("00000");
      setShowConfetti(false);
      if (revealTimeoutRef.current) {
        window.clearTimeout(revealTimeoutRef.current);
      }
    }
  }, [estado]);

  useEffect(() => {
    if (estado !== "revealing" || !vencedor?.numero) return;

    const padded = vencedor.numero.padStart(5, "0");
    setDigits(padded);

    const timeout = window.setTimeout(() => {
      setShowConfetti(true);
      void playRevealSwell();
    }, COLUMN_STAGGER * 4 + 420);

    revealTimeoutRef.current = timeout;

    return () => window.clearTimeout(timeout);
  }, [estado, vencedor, playRevealSwell]);

  const handleToggleSound = useCallback(() => {
    setIsMuted((prev) => {
      const next = !prev;
      if (typeof window !== "undefined") {
        window.localStorage.setItem(SOUND_STORAGE_KEY, String(next));
      }
      return next;
    });
  }, []);

  const slotsState = useMemo(() => (estado === "done" ? "done" : estado), [estado]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        aria-modal="true"
        className="max-w-none h-[100dvh] w-[100vw] border-0 bg-transparent p-0 focus:outline-none"
      >
        <div className="relative flex h-full w-full items-center justify-center overflow-hidden bg-[#0A1F44] text-white">
          <div className="absolute inset-0 backdrop-blur-sm" aria-hidden="true" />
          <div className="absolute inset-x-0 top-0 h-32 bg-[radial-gradient(circle_at_top,#00C2FF4d,transparent)]" aria-hidden="true" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,#006CFF14,transparent)]" aria-hidden="true" />

          <div className="relative z-10 flex h-full w-full max-w-6xl flex-col items-center justify-center gap-10 px-6 py-10 text-center">
            <header className="flex w-full items-center justify-between gap-4 text-left">
              <div>
                <p className="text-sm uppercase tracking-[0.35em] text-[#00C2FF] opacity-80">Sorteio em andamento</p>
                <h1 className="mt-1 text-3xl font-black md:text-5xl">Prepare-se...</h1>
                <p className="text-sm text-white/70 md:text-base">Girando roletas. Boa sorte!</p>
              </div>
              <SoundToggle muted={isMuted} onToggle={handleToggleSound} />
            </header>

            <div className="flex flex-col items-center gap-8">
              <div className="grid grid-cols-5 gap-3 md:gap-4">
                {Array.from({ length: 5 }).map((_, index) => (
                  <SlotColumn key={index} target={digits[index] ?? "0"} state={slotsState} delay={index * COLUMN_STAGGER} />
                ))}
              </div>

              <div className="text-lg font-semibold tracking-widest text-[#00C2FF] md:text-2xl">
                {estado === "spinning" && "Girando"}
                {estado === "revealing" && "Revelando"}
                {estado === "done" && "Número sorteado"}
              </div>

              <div
                className={cn(
                  "rounded-2xl border border-[#00C2FF]/30 bg-[#0A1F44]/60 px-6 py-4 shadow-lg transition",
                  estado === "done" ? "opacity-100" : "opacity-80"
                )}
                aria-live="polite"
              >
                <p className="text-sm uppercase tracking-[0.45em] text-[#00C2FF]">Número</p>
                <p className="text-3xl font-black text-white md:text-5xl">
                  {estado === "done" && vencedor ? vencedor.numero : digits}
                </p>
              </div>

              {estado === "done" && vencedor && (
                <WinnerCard vencedor={vencedor} />
              )}
            </div>

            <footer className="flex w-full flex-col items-center justify-center gap-3 md:flex-row md:gap-4">
              {estado === "done" && canSortearNovamente && (
                <Button
                  size="lg"
                  onClick={onNovoSorteio}
                  disabled={isProcessing}
                  className="w-full bg-[#006CFF] text-white hover:bg-[#0057cc] md:w-auto"
                >
                  {isProcessing ? "Sorteando..." : "Novo sorteio"}
                </Button>
              )}
              <Button
                size="lg"
                variant="outline"
                onClick={onVoltar}
                className="w-full border-[#00C2FF]/30 bg-[#0A1F44]/50 text-white hover:bg-[#0A1F44]/60 md:w-auto"
              >
                Voltar ao painel
              </Button>
            </footer>
          </div>

          <div className="sr-only" aria-live="polite">
            {estado === "done" && vencedor?.numero ? `Número sorteado: ${vencedor.numero}.` : undefined}
          </div>

          {showConfetti && <ConfettiOverlay />}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function SoundToggle({ muted, onToggle }: { muted: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="flex h-11 w-11 items-center justify-center rounded-full border border-[#00C2FF]/40 bg-[#0A1F44]/60 text-white transition hover:bg-[#0A1F44]/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00C2FF]"
      aria-label={muted ? "Ativar som" : "Desativar som"}
    >
      {muted ? <VolumeX className="h-5 w-5" aria-hidden="true" /> : <Volume2 className="h-5 w-5" aria-hidden="true" />}
    </button>
  );
}

function WinnerCard({ vencedor }: { vencedor: RaffleWinner }) {
  return (
    <div className="w-full max-w-lg rounded-3xl border border-[#00C2FF]/30 bg-[#0A1F44]/60 p-6 text-left shadow-xl backdrop-blur">
      <p className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.35em] text-[#00C2FF]">
        <span aria-hidden="true">🎉</span>
        Ganhador
      </p>
      <div className="mt-4 space-y-2 text-white">
        {vencedor.nome && <p className="text-xl font-semibold text-white">{vencedor.nome}</p>}
        {vencedor.telefone && <p className="text-sm text-white/80">Telefone: {vencedor.telefone}</p>}
        {vencedor.cupom && <p className="font-mono text-lg text-[#00C2FF]">Cupom: {vencedor.cupom}</p>}
      </div>
    </div>
  );
}

function ConfettiOverlay() {
  return (
    <div className="pointer-events-none absolute inset-0 z-20 overflow-hidden">
      {Array.from({ length: 80 }).map((_, index) => (
        <span
          key={index}
          className="absolute h-2 w-2 animate-[raffle-confetti_2.8s_linear_forwards] rounded-sm"
          style={{
            left: `${Math.random() * 100}%`,
            top: `-10%`,
            animationDelay: `${Math.random() * 0.8}s`,
            backgroundColor: ["#00C2FF", "#006CFF", "#0A1F44"][index % 3],
          }}
        />
      ))}
      <style>{`
        @keyframes raffle-confetti {
          0% { transform: translateY(0) rotate(0deg); opacity: 1; }
          100% { transform: translateY(120vh) rotate(540deg); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
