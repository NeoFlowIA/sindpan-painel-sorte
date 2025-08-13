import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogOverlay } from "@/components/ui/dialog";
import { Trophy, Volume2, VolumeX, RotateCcw, X, Zap } from "lucide-react";
import { useState, useEffect, useCallback, useRef } from "react";

interface Participant {
  name: string;
  cpf: string;
  bakery: string;
}

interface CinematicPresentationProps {
  isOpen: boolean;
  onClose: () => void;
  participants: Participant[];
  onRaffleComplete?: (result: { number: string; winner: Participant }) => void;
}

type RafflePhase = 'waiting' | 'countdown' | 'spinning' | 'revealing' | 'celebrating' | 'finished';

export function CinematicPresentation({
  isOpen,
  onClose,
  participants,
  onRaffleComplete
}: CinematicPresentationProps) {
  const [phase, setPhase] = useState<RafflePhase>('waiting');
  const [countdown, setCountdown] = useState(0);
  const [currentNumber, setCurrentNumber] = useState("00000");
  const [finalNumber, setFinalNumber] = useState("");
  const [winner, setWinner] = useState<Participant | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [showKeyboardHints, setShowKeyboardHints] = useState(true);
  
  const audioRefs = useRef<{ [key: string]: HTMLAudioElement }>({});
  const spinIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Audio sources (using free sounds)
  const audioSources = {
    ambient: 'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav',
    boom: 'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav',
    tick: 'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav',
    drumroll: 'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav',
    fanfare: 'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav',
    applause: 'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav'
  };

  // Initialize audio (using Web Audio API for better control)
  useEffect(() => {
    Object.entries(audioSources).forEach(([key, src]) => {
      const audio = new Audio();
      audio.src = src;
      audio.preload = 'auto';
      audio.volume = isMuted ? 0 : 0.7;
      audioRefs.current[key] = audio;
    });

    return () => {
      Object.values(audioRefs.current).forEach(audio => {
        audio.pause();
        audio.currentTime = 0;
      });
    };
  }, []);

  // Update audio volume when mute state changes
  useEffect(() => {
    Object.values(audioRefs.current).forEach(audio => {
      audio.volume = isMuted ? 0 : 0.7;
    });
  }, [isMuted]);

  // Hide keyboard hints after 3 seconds
  useEffect(() => {
    if (showKeyboardHints && isOpen) {
      const timer = setTimeout(() => setShowKeyboardHints(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [showKeyboardHints, isOpen]);

  const playSound = useCallback((soundName: string) => {
    if (!isMuted && audioRefs.current[soundName]) {
      audioRefs.current[soundName].currentTime = 0;
      audioRefs.current[soundName].play().catch(console.warn);
    }
  }, [isMuted]);

  const generateRandomNumber = () => {
    return Math.floor(Math.random() * 100000).toString().padStart(5, '0');
  };

  const startRaffle = useCallback(() => {
    setPhase('countdown');
    setCountdown(3);
    playSound('ambient');
    
    // Countdown sequence
    const countdownInterval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(countdownInterval);
          setPhase('spinning');
          startSpinning();
          return 0;
        }
        playSound('boom');
        return prev - 1;
      });
    }, 1000);
  }, [playSound]);

  const startSpinning = () => {
    playSound('drumroll');
    let iterations = 0;
    const maxIterations = 40; // 4 seconds of spinning
    let spinSpeed = 50; // Start fast

    const spin = () => {
      setCurrentNumber(generateRandomNumber());
      playSound('tick');
      iterations++;
      
      // Gradually slow down
      if (iterations > 25) {
        spinSpeed += 20; // Slow down more dramatically near the end
      }
      
      if (iterations >= maxIterations) {
        // Final reveal
        setTimeout(() => {
          setPhase('revealing');
          revealWinner();
        }, 500);
      } else {
        spinIntervalRef.current = setTimeout(spin, spinSpeed);
      }
    };
    
    spin();
  };

  const revealWinner = () => {
    // Generate final result
    const finalNum = generateRandomNumber();
    const randomWinner = participants[Math.floor(Math.random() * participants.length)];
    
    setFinalNumber(finalNum);
    setCurrentNumber(finalNum);
    setWinner(randomWinner);
    
    // Flash effect and celebration
    setTimeout(() => {
      setPhase('celebrating');
      playSound('fanfare');
      setTimeout(() => playSound('applause'), 1000);
      
      // Move to finished state
      setTimeout(() => {
        setPhase('finished');
        onRaffleComplete?.({ number: finalNum, winner: randomWinner });
      }, 4000);
    }, 1000);
  };

  const resetRaffle = useCallback(() => {
    if (spinIntervalRef.current) {
      clearTimeout(spinIntervalRef.current);
    }
    setPhase('waiting');
    setCountdown(0);
    setCurrentNumber("00000");
    setFinalNumber("");
    setWinner(null);
  }, []);

  const replayAnimation = useCallback(() => {
    if (phase === 'finished' && winner && finalNumber) {
      setPhase('celebrating');
      playSound('fanfare');
      setTimeout(() => setPhase('finished'), 3000);
    }
  }, [phase, winner, finalNumber, playSound]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      
      switch (e.key) {
        case ' ':
        case 'Enter':
          e.preventDefault();
          if (phase === 'waiting') startRaffle();
          break;
        case 'Escape':
          e.preventDefault();
          onClose();
          break;
        case 'm':
        case 'M':
          e.preventDefault();
          setIsMuted(!isMuted);
          break;
        case 'r':
        case 'R':
          e.preventDefault();
          if (phase === 'finished') replayAnimation();
          else resetRaffle();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, phase, startRaffle, onClose, isMuted, replayAnimation, resetRaffle]);

  const getResponsiveTextSize = (baseSize: string) => {
    const sizeMap: { [key: string]: string } = {
      'title': 'text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl',
      'countdown': 'text-8xl sm:text-9xl md:text-[12rem] lg:text-[15rem] xl:text-[18rem]',
      'number': 'text-6xl sm:text-7xl md:text-8xl lg:text-9xl xl:text-[10rem]',
      'winner-title': 'text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl',
      'winner-name': 'text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl',
      'winner-details': 'text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl'
    };
    return sizeMap[baseSize] || baseSize;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogOverlay className="bg-black" />
      <DialogContent className="w-screen h-screen max-w-none p-0 m-0 border-0 rounded-none overflow-hidden">
        <div 
          className="relative h-full flex flex-col items-center justify-center text-white overflow-hidden"
          style={{
            background: phase === 'waiting' 
              ? 'linear-gradient(45deg, hsl(var(--primary)), hsl(var(--secondary)), hsl(var(--accent)))'
              : 'linear-gradient(135deg, hsl(0 0% 5%), hsl(var(--primary) / 0.8), hsl(0 0% 10%))',
            backgroundSize: '400% 400%',
            animation: phase === 'waiting' ? 'gradient-shift 8s ease-in-out infinite' : 'none'
          }}
        >
          {/* Safe area padding for projectors */}
          <div className="absolute inset-4 sm:inset-8 md:inset-12 lg:inset-16 flex flex-col items-center justify-center">
            
            {/* Keyboard hints */}
            {showKeyboardHints && (
              <div 
                className="absolute top-4 left-4 bg-black/50 text-white text-xs sm:text-sm p-2 sm:p-3 rounded-lg animate-fade-in"
                aria-live="polite"
              >
                <p>Espaço/Enter: Iniciar | Esc: Sair | M: Som | R: Replay</p>
              </div>
            )}

            {/* Control buttons */}
            <div className="absolute top-4 right-4 flex gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsMuted(!isMuted)}
                className="text-white hover:bg-white/20 h-8 w-8 sm:h-10 sm:w-10"
                aria-label={isMuted ? "Ativar som" : "Silenciar"}
              >
                {isMuted ? <VolumeX className="w-4 h-4 sm:w-5 sm:h-5" /> : <Volume2 className="w-4 h-4 sm:w-5 sm:h-5" />}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="text-white hover:bg-white/20 h-8 w-8 sm:h-10 sm:w-10"
                aria-label="Fechar apresentação"
              >
                <X className="w-4 h-4 sm:w-5 sm:h-5" />
              </Button>
            </div>

            {/* Confetti effect */}
            {phase === 'celebrating' && (
              <div className="absolute inset-0 pointer-events-none overflow-hidden">
                {Array.from({ length: 100 }).map((_, i) => (
                  <div
                    key={i}
                    className="absolute animate-confetti-fall"
                    style={{
                      left: `${Math.random() * 100}%`,
                      top: `-10%`,
                      animationDelay: `${Math.random() * 3}s`,
                      animationDuration: `${3 + Math.random() * 2}s`
                    }}
                  >
                    <div 
                      className="w-2 h-2 sm:w-3 sm:h-3 md:w-4 md:h-4"
                      style={{
                        backgroundColor: ['#F57C00', '#FBC02D', '#8B1A1A', '#ffffff'][Math.floor(Math.random() * 4)]
                      }}
                    />
                  </div>
                ))}
              </div>
            )}

            {/* Main content */}
            <div className="text-center max-w-6xl w-full space-y-4 sm:space-y-6 md:space-y-8">
              
              {/* Title */}
              <h1 
                className={`font-bold ${getResponsiveTextSize('title')} ${
                  phase === 'waiting' ? 'animate-bounce-soft' : ''
                }`}
                style={{
                  textShadow: '2px 2px 4px rgba(0,0,0,0.5)'
                }}
              >
                SORTEIO DIGITAL SINDPAN
              </h1>

              {/* Countdown */}
              {phase === 'countdown' && countdown > 0 && (
                <div 
                  className={`font-bold ${getResponsiveTextSize('countdown')} animate-zoom-in text-yellow-300`}
                  style={{
                    textShadow: '0 0 30px rgba(255,193,7,0.8)'
                  }}
                  aria-live="assertive"
                >
                  {countdown}
                </div>
              )}

              {/* Number display */}
              {(phase === 'spinning' || phase === 'revealing' || phase === 'celebrating' || phase === 'finished') && (
                <div className="relative">
                  <div 
                    className={`
                      font-mono font-bold text-center p-4 sm:p-6 md:p-8 lg:p-12 rounded-2xl sm:rounded-3xl border-4 sm:border-8 transition-all duration-500
                      ${getResponsiveTextSize('number')}
                      ${phase === 'spinning' 
                        ? 'border-yellow-400 bg-yellow-400/20 animate-slot-spin' 
                        : phase === 'revealing'
                        ? 'border-white bg-white/20 animate-glow-pulse'
                        : 'border-yellow-300 bg-yellow-300/20 animate-glow-pulse'
                      }
                    `}
                    style={{
                      textShadow: phase !== 'spinning' ? '0 0 20px rgba(255,255,255,0.8)' : 'none',
                      boxShadow: phase !== 'spinning' ? '0 0 50px rgba(255,193,7,0.6)' : 'none'
                    }}
                    aria-live="polite"
                  >
                    {currentNumber}
                  </div>
                </div>
              )}

              {/* Winner information */}
              {(phase === 'celebrating' || phase === 'finished') && winner && (
                <div className="animate-fade-in space-y-3 sm:space-y-4 md:space-y-6" aria-live="polite">
                  <h2 className={`font-bold text-yellow-300 flex items-center justify-center gap-2 sm:gap-4 ${getResponsiveTextSize('winner-title')}`}>
                    <Trophy className="w-6 h-6 sm:w-8 sm:h-8 md:w-12 md:h-12 lg:w-16 lg:h-16" />
                    GANHADOR!
                    <Zap className="w-6 h-6 sm:w-8 sm:h-8 md:w-12 md:h-12 lg:w-16 lg:h-16" />
                  </h2>
                  <div className="space-y-2 sm:space-y-3 md:space-y-4">
                    <p className={`font-bold ${getResponsiveTextSize('winner-name')}`} style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.5)' }}>
                      {winner.name}
                    </p>
                    <p className={`font-semibold text-yellow-300 ${getResponsiveTextSize('winner-details')}`}>
                      {winner.bakery}
                    </p>
                    {/* CPF hidden in presentation mode for privacy */}
                  </div>
                </div>
              )}

              {/* Action buttons */}
              {phase === 'waiting' && (
                <Button 
                  onClick={startRaffle}
                  size="lg"
                  className="text-lg sm:text-xl md:text-2xl lg:text-3xl px-6 sm:px-8 md:px-12 lg:px-16 py-3 sm:py-4 md:py-6 lg:py-8 bg-white text-primary hover:bg-white/90 font-bold animate-glow-pulse"
                >
                  <Trophy className="w-4 h-4 sm:w-6 sm:h-6 md:w-8 md:h-8 mr-2 sm:mr-4" />
                  INICIAR SORTEIO
                </Button>
              )}

              {phase === 'finished' && (
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
                  <Button 
                    onClick={resetRaffle}
                    size="lg"
                    className="text-base sm:text-lg md:text-xl px-4 sm:px-6 md:px-8 py-2 sm:py-3 md:py-4 bg-white/20 text-white hover:bg-white/30 border-2 border-white"
                  >
                    <RotateCcw className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                    NOVO SORTEIO
                  </Button>
                  <Button 
                    onClick={replayAnimation}
                    variant="outline"
                    size="lg"
                    className="text-base sm:text-lg md:text-xl px-4 sm:px-6 md:px-8 py-2 sm:py-3 md:py-4 border-white text-white hover:bg-white/10"
                  >
                    <Zap className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                    REPLAY
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}