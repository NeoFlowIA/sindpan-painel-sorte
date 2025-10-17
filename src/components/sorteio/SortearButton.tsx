"use client";

import { useEffect } from "react";
import { Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export type SortearButtonProps = {
  disabled?: boolean;
  onSortear: () => void;
};

export function SortearButton({ disabled, onSortear }: SortearButtonProps) {
  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (disabled) return;
      if (event.key === "s" || event.key === "S") {
        event.preventDefault();
        onSortear();
      }
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [disabled, onSortear]);

  return (
    <TooltipProvider delayDuration={100}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            role="button"
            tabIndex={disabled ? -1 : 0}
            aria-disabled={disabled}
            aria-label="Sortear número"
            onKeyDown={(event) => {
              if (disabled) return;
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                onSortear();
              }
            }}
            className={cn(
              "group flex flex-col gap-4 rounded-3xl border border-[#006CFF]/30 bg-[#006CFF]/10 p-4 shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00C2FF]/70 focus-visible:ring-offset-2 dark:border-[#00C2FF]/30 dark:bg-[#0A1F44]/80",
              disabled && "cursor-not-allowed opacity-60 hover:translate-y-0 hover:shadow-lg"
            )}
          >
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#006CFF]/15 text-[#006CFF] shadow-inner">
                <Sparkles className="h-6 w-6" aria-hidden="true" />
              </div>
              <div className="flex-1 space-y-1">
                <p className="text-xl font-semibold text-[#0A1F44] dark:text-white">Sortear</p>
                <p className="text-sm text-[#0A1F44]/70 dark:text-white/70">
                  {disabled ? "Sem cupons disponíveis" : "Pronto para iniciar? Pressione S para sortear"}
                </p>
              </div>
              <Button
                disabled={disabled}
                onClick={(event) => {
                  event.stopPropagation();
                  onSortear();
                }}
                className="bg-[#006CFF] text-white shadow-lg transition hover:bg-[#0057cc] focus-visible:ring-2 focus-visible:ring-[#00C2FF]"
              >
                Sortear
              </Button>
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="bg-[#0A1F44] text-white">
          Pressione S para sortear
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
