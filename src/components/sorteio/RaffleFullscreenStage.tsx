"use client";

import { useEffect, useMemo, useRef, useState } from "react";

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
  const revealTimeoutRef = useRef<number>();

  useEffect(() => {
    if (!open) {
      setDigits("00000");
      setShowConfetti(false);
    }
  }, [open]);

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
    }, COLUMN_STAGGER * 4 + 420);

    revealTimeoutRef.current = timeout;

    return () => window.clearTimeout(timeout);
  }, [estado, vencedor]);

  const slotsState = useMemo(() => (estado === "done" ? "done" : estado), [estado]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        aria-modal="true"
        className="max-w-none h-[100dvh] w-[100vw] border-0 bg-transparent p-0 focus:outline-none"
      >
        <div className="relative flex h-full w-full items-center justify-center overflow-hidden bg-gradient-to-br from-red-900 via-green-900 to-red-950 text-white">
          {/* Flocos de neve decorativos */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
            <div className="absolute top-[10%] left-[10%] text-6xl opacity-20 animate-pulse">❄️</div>
            <div className="absolute top-[20%] right-[15%] text-4xl opacity-30 animate-pulse" style={{ animationDelay: '0.5s' }}>❄️</div>
            <div className="absolute bottom-[15%] left-[20%] text-5xl opacity-25 animate-pulse" style={{ animationDelay: '1s' }}>❄️</div>
            <div className="absolute bottom-[25%] right-[10%] text-4xl opacity-20 animate-pulse" style={{ animationDelay: '1.5s' }}>❄️</div>
            <div className="absolute top-[50%] left-[5%] text-7xl opacity-15 animate-pulse" style={{ animationDelay: '0.8s' }}>🎄</div>
            <div className="absolute top-[40%] right-[8%] text-6xl opacity-15 animate-pulse" style={{ animationDelay: '1.2s' }}>🎄</div>
          </div>
          
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,215,0,0.1),transparent)]" aria-hidden="true" />

          <div className="relative z-10 flex h-full w-full max-w-6xl flex-col items-center justify-center gap-10 px-6 py-10 text-center">
            <header className="flex w-full flex-col items-center gap-4 text-center">
              <div className="space-y-2">
                <div className="flex items-center justify-center gap-3">
                  <span className="text-5xl animate-bounce" style={{ animationDelay: '0s' }}>🎄</span>
                  <p className="text-sm uppercase tracking-[0.35em] text-yellow-300 opacity-90">Sorteio Natalino</p>
                  <span className="text-5xl animate-bounce" style={{ animationDelay: '0.3s' }}>🎄</span>
                </div>
                <h1 className="mt-1 text-4xl font-black md:text-6xl text-white drop-shadow-[0_2px_10px_rgba(255,215,0,0.5)]">
                  {estado === "done" ? "🎅 Feliz Natal! 🎅" : "Prepare-se..."}
                </h1>
                <p className="text-base text-yellow-200 md:text-lg flex items-center justify-center gap-2">
                  <span>🎁</span>
                  {estado === "done" ? "Temos um ganhador!" : "Girando as roletas. Boa sorte!"}
                  <span>🎁</span>
                </p>
              </div>
            </header>

            <div className="flex flex-col items-center gap-8">
              <div className="grid grid-cols-5 gap-3 md:gap-4">
                {Array.from({ length: 5 }).map((_, index) => (
                  <SlotColumn key={index} target={digits[index] ?? "0"} state={slotsState} delay={index * COLUMN_STAGGER} />
                ))}
              </div>

              <div className="text-xl font-semibold tracking-widest text-yellow-300 md:text-3xl flex items-center gap-3">
                {estado === "spinning" && (
                  <>
                    <span className="animate-spin">🎰</span>
                    <span>Girando</span>
                    <span className="animate-spin">🎰</span>
                  </>
                )}
                {estado === "revealing" && (
                  <>
                    <span className="animate-pulse">✨</span>
                    <span>Revelando</span>
                    <span className="animate-pulse">✨</span>
                  </>
                )}
                {estado === "done" && (
                  <>
                    <span className="animate-bounce">🎉</span>
                    <span>Número Sorteado</span>
                    <span className="animate-bounce">🎉</span>
                  </>
                )}
              </div>

              <div
                className={cn(
                  "rounded-2xl border-4 border-yellow-400 bg-gradient-to-br from-red-600 to-green-600 px-8 py-6 shadow-2xl transition",
                  estado === "done" ? "opacity-100 scale-105" : "opacity-90"
                )}
                aria-live="polite"
              >
                <p className="text-sm uppercase tracking-[0.45em] text-yellow-200 flex items-center justify-center gap-2">
                  <span>🎁</span>
                  Número do Sorteio
                  <span>🎁</span>
                </p>
                <p className="text-4xl font-black text-white md:text-6xl drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)]">
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
                  className="w-full bg-gradient-to-r from-green-600 to-red-600 text-white font-bold transition hover:from-green-700 hover:to-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400 focus-visible:ring-offset-2 shadow-lg md:w-auto"
                >
                  <span className="mr-2">🎄</span>
                  {isProcessing ? "Sorteando..." : "Novo Sorteio"}
                  <span className="ml-2">🎁</span>
                </Button>
              )}
              <Button
                size="lg"
                variant="outline"
                onClick={onVoltar}
                className="w-full border-2 border-yellow-400 bg-white/10 text-white font-semibold backdrop-blur transition hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400 focus-visible:ring-offset-2 md:w-auto"
              >
                Voltar ao Painel
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

function WinnerCard({ vencedor }: { vencedor: RaffleWinner }) {
  return (
    <div className="w-full max-w-lg rounded-3xl border-4 border-yellow-400 bg-gradient-to-br from-green-700 to-red-700 p-8 text-center shadow-2xl backdrop-blur">
      <p className="flex items-center justify-center gap-2 text-lg font-bold uppercase tracking-[0.35em] text-yellow-300">
        <span aria-hidden="true" className="text-3xl">🏆</span>
        Ganhador
        <span aria-hidden="true" className="text-3xl">🏆</span>
      </p>
      <div className="mt-6 space-y-3 text-white">
        {vencedor.nome && (
          <p className="text-2xl font-bold text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
            {vencedor.nome}
          </p>
        )}
        {vencedor.telefone && (
          <p className="text-base text-yellow-100">
            📞 Telefone: {vencedor.telefone}
          </p>
        )}
        {vencedor.cupom && (
          <p className="font-mono text-xl text-yellow-300 font-bold">
            🎫 Cupom: {vencedor.cupom}
          </p>
        )}
      </div>
    </div>
  );
}

function ConfettiOverlay() {
  const christmasColors = [
    '#DC2626', // Vermelho
    '#16A34A', // Verde
    '#EAB308', // Dourado
    '#FEF08A', // Amarelo claro
    '#991B1B', // Vermelho escuro
    '#166534', // Verde escuro
  ];

  return (
    <div className="pointer-events-none absolute inset-0 z-20 overflow-hidden">
      {Array.from({ length: 100 }).map((_, index) => (
        <span
          key={index}
          className="absolute h-3 w-3 animate-[raffle-confetti_3.5s_linear_forwards] rounded-sm"
          style={{
            left: `${Math.random() * 100}%`,
            top: `-10%`,
            animationDelay: `${Math.random() * 1.2}s`,
            backgroundColor: christmasColors[index % christmasColors.length],
          }}
        />
      ))}
      <style>{`
        @keyframes raffle-confetti {
          0% { transform: translateY(0) rotate(0deg); opacity: 1; }
          100% { transform: translateY(120vh) rotate(720deg); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
