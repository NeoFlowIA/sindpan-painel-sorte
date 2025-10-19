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
              "group flex flex-col gap-4 rounded-3xl border border-secondary/40 bg-card p-4 shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background dark:bg-secondary/20",
              disabled && "cursor-not-allowed opacity-60 hover:translate-y-0 hover:shadow-lg"
            )}
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/15 text-primary shadow-inner">
                <Sparkles className="h-6 w-6" aria-hidden="true" />
              </div>
              <div className="flex-1 space-y-1 text-center sm:text-left">
                <p className="text-xl font-semibold text-foreground">Sortear</p>
                <p className="text-sm text-muted-foreground">
                  {disabled ? "Sem cupons disponíveis" : "Pronto para iniciar? Pressione S para sortear"}
                </p>
              </div>
              <Button
                disabled={disabled}
                onClick={(event) => {
                  event.stopPropagation();
                  onSortear();
                }}
                className="w-full bg-primary text-primary-foreground shadow-lg transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:w-auto"
              >
                Sortear
              </Button>
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="bg-popover text-popover-foreground">
          Pressione S para sortear
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
