import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Flame, Volume2, VolumeX, Maximize, RotateCcw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import sindpanLogo from "@/assets/sindpan-logo.png";

interface Participant {
  name: string;
  bakery: string;
}

// Mock participants for preview mode
const mockParticipants: Participant[] = [
  { name: "Maria Silva Santos", bakery: "Padaria Central" },
  { name: "João Pereira Lima", bakery: "Pão Dourado" },
  { name: "Ana Costa Oliveira", bakery: "Delícias do Forno" },
  { name: "Carlos Eduardo Silva", bakery: "Padaria Central" },
  { name: "Fernanda Santos", bakery: "Pão Dourado" },
  { name: "Roberto Silva", bakery: "Delícias do Forno" }
];

type Phase = 'initial' | 'countdown' | 'spinning' | 'revealing' | 'celebrating';

export default function SorteiosLive() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isPreview = searchParams.get('preview') === '1';
  const { toast } = useToast();

  const [phase, setPhase] = useState<Phase>('initial');
  const [countdown, setCountdown] = useState(0);
  const [currentNumber, setCurrentNumber] = useState("00000");
  const [winner, setWinner] = useState<Participant | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const audioRef = useRef<{ [key: string]: HTMLAudioElement }>({});
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Show keyboard shortcuts hint on load
  useEffect(() => {
    toast({
      title: "Atalhos de Teclado",
      description: "Espaço/Enter: Iniciar • N: Novo sorteio • M: Mutar • F: Tela cheia • Esc: Sair",
      duration: 3000,
    });
  }, [toast]);

  const generateRandomNumber = useCallback(() => {
    return Math.floor(Math.random() * 100000).toString().padStart(5, '0');
  }, []);

  const playSound = useCallback((soundType: string) => {
    if (isMuted) return;
    
    // Mock sound playing - in real implementation, you'd have actual audio files
  }, [isMuted]);

  const startRaffle = useCallback(() => {
    setPhase('countdown');
    setCountdown(3);
    playSound('intro');

    const countdownInterval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(countdownInterval);
          startSpinning();
          return 0;
        }
        playSound('boom');
        return prev - 1;
      });
    }, 1000);
  }, [playSound]);

  const startSpinning = useCallback(() => {
    setPhase('spinning');
    playSound('drumroll');
    
    let iterations = 0;
    const maxIterations = 80; // Increased from 50 to make it last 3s longer
    let speed = 50;

    const spinInterval = setInterval(() => {
      setCurrentNumber(generateRandomNumber());
      iterations++;
      
      // Gradually slow down - adjusted threshold for longer duration
      if (iterations > 60) {
        speed += 20;
        clearInterval(spinInterval);
        
        setTimeout(() => {
          if (iterations < maxIterations) {
            const slowInterval = setInterval(() => {
              setCurrentNumber(generateRandomNumber());
              iterations++;
              
              if (iterations >= maxIterations) {
                clearInterval(slowInterval);
                revealWinner();
              }
            }, speed);
          } else {
            revealWinner();
          }
        }, 200); // Increased delay for smoother transition
      }
      
      playSound('tick');
    }, speed);

    intervalRef.current = spinInterval;
  }, [generateRandomNumber, playSound]);

  const revealWinner = useCallback(() => {
    const finalNumber = generateRandomNumber();
    setCurrentNumber(finalNumber);
    
    const randomWinner = mockParticipants[Math.floor(Math.random() * mockParticipants.length)];
    
    setTimeout(() => {
      setPhase('revealing');
      playSound('flash');
      
      setTimeout(() => {
        setWinner(randomWinner);
        setPhase('celebrating');
        playSound('fanfare');
        
        // Play applause for 1 minute then stop
        setTimeout(() => {
          playSound('stop');
        }, 60000);
      }, 1000);
    }, 500);
  }, [generateRandomNumber, playSound]);

  const resetRaffle = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    
    setPhase('initial');
    setCountdown(0);
    setCurrentNumber("00000");
    setWinner(null);
    playSound('stop');
  }, [playSound]);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  }, []);

  const handleEscape = useCallback(() => {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    }
    navigate('/sorteios');
  }, [navigate]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      switch (e.key.toLowerCase()) {
        case ' ':
        case 'enter':
          e.preventDefault();
          if (phase === 'initial') startRaffle();
          break;
        case 'n':
          if (phase === 'celebrating') resetRaffle();
          break;
        case 'm':
          setIsMuted(prev => !prev);
          break;
        case 'f':
          toggleFullscreen();
          break;
        case 'escape':
          handleEscape();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [phase, startRaffle, resetRaffle, toggleFullscreen, handleEscape]);

  // Dynamic background based on phase
  const getBackgroundClasses = () => {
    switch (phase) {
      case 'initial':
        return 'bg-gradient-to-br from-amber-200 via-orange-100 to-emerald-200';
      case 'countdown':
        return 'bg-gradient-to-br from-orange-950 via-red-900 to-yellow-800';
      case 'spinning':
        return 'bg-gradient-to-br from-emerald-700 via-amber-500 to-red-700 animate-gradient-x';
      case 'revealing':
        return 'bg-gradient-to-br from-yellow-100 via-orange-100 to-red-100 animate-pulse';
      case 'celebrating':
        return 'bg-gradient-to-br from-emerald-600 via-amber-400 to-red-600 animate-gradient-x';
      default:
        return 'bg-gradient-to-br from-amber-100 to-emerald-100';
    }
  };

  return (
    <div className={`min-h-screen w-full flex flex-col items-center justify-center p-8 transition-all duration-1000 ${getBackgroundClasses()}`}>
      {/* Logo - only show in initial phase */}
      {phase === 'initial' && (
        <div className="absolute top-8 left-8">
          <img 
            src={sindpanLogo} 
            alt="SINDPAN" 
            className="h-16 w-auto rounded-2xl bg-white/80 p-2 shadow-xl opacity-95"
          />
        </div>
      )}

      {/* Preview badge */}
      {isPreview && (
        <div className="absolute top-8 right-8">
          <Badge className="bg-amber-300 text-red-950 text-lg px-4 py-2 shadow-lg">
            MODO PREVIEW
          </Badge>
        </div>
      )}

      {/* Controls */}
      <div className="absolute top-8 right-8 flex gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsMuted(!isMuted)}
          className="bg-red-950/35 text-amber-100 hover:bg-red-950/55 border border-amber-200/40"
        >
          {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleFullscreen}
          className="bg-red-950/35 text-amber-100 hover:bg-red-950/55 border border-amber-200/40"
        >
          <Maximize className="w-5 h-5" />
        </Button>
      </div>

      {/* Main Content */}
      <div className="text-center space-y-8 max-w-4xl w-full relative z-10">
        {/* Title */}
        <h1 className={`font-bold transition-all duration-500 ${
          phase === 'initial' 
            ? 'text-6xl md:text-8xl text-red-800 drop-shadow-[0_4px_0_rgba(251,191,36,0.7)] animate-pulse' 
            : 'text-4xl md:text-6xl text-amber-100 drop-shadow-[0_4px_0_rgba(127,29,29,0.65)]'
        }`}>
          {phase === 'initial' ? 'ARRAIÁ SINDPAN' : 'SORTEIO JUNINO'}
        </h1>

        {/* Subtitle for initial phase */}
        {phase === 'initial' && (
          <p className="text-2xl md:text-4xl font-semibold text-red-900 mb-8 drop-shadow-sm">
            São João de Prêmios
          </p>
        )}

        {/* Countdown */}
        {phase === 'countdown' && countdown > 0 && (
          <div className="text-[12rem] md:text-[16rem] font-black text-amber-200 animate-bounce drop-shadow-[0_10px_0_rgba(127,29,29,0.75)]">
            {countdown}
          </div>
        )}

        {/* Number Display */}
        {(phase === 'spinning' || phase === 'revealing' || phase === 'celebrating') && (
          <div className="space-y-8">
            <div className={`
              text-[4rem] md:text-[8rem] lg:text-[12rem] 
              font-mono font-bold text-center p-8 rounded-3xl 
              transition-all duration-300 drop-shadow-2xl
              ${phase === 'spinning' 
                ? 'text-amber-100 bg-red-950/45 border-4 border-amber-200 animate-pulse shadow-[0_0_60px_rgba(251,191,36,0.45)]' 
                : phase === 'revealing'
                ? 'text-red-950 bg-amber-100/95 border-4 border-red-800 animate-pulse'
                : 'text-red-950 bg-gradient-to-r from-amber-200 via-yellow-300 to-orange-300 border-4 border-red-700 shadow-amber-300/60 shadow-2xl'
              }
            `}>
              {currentNumber}
            </div>

            {/* Winner Reveal */}
            {phase === 'celebrating' && winner && (
              <div className="animate-fade-in space-y-6">
                <div className="text-4xl md:text-6xl font-bold text-white drop-shadow-lg animate-bounce">
                  🔥 GANHADOR DO ARRAIÁ! 🌽
                </div>
                
                <div className="bg-red-950/35 backdrop-blur-sm rounded-3xl p-8 border-2 border-amber-200/60 shadow-2xl">
                  <div className="text-3xl md:text-5xl font-bold text-white mb-4 drop-shadow-lg">
                    {winner.name}
                  </div>
                  <div className="text-xl md:text-3xl text-amber-200 font-semibold drop-shadow-lg">
                    {winner.bakery}
                  </div>
                </div>

                {/* New Raffle Button */}
                <Button
                  onClick={resetRaffle}
                  size="lg"
                  className="text-xl px-8 py-4 bg-amber-300 text-red-950 border-2 border-red-800/50 hover:bg-amber-200 backdrop-blur-sm shadow-xl"
                >
                  <RotateCcw className="w-6 h-6 mr-2" />
                  Novo Sorteio
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Start Button */}
        {phase === 'initial' && (
          <Button 
            onClick={startRaffle}
            size="lg"
            className="text-2xl md:text-3xl px-12 py-8 bg-gradient-to-r from-red-700 via-orange-500 to-amber-400 text-white hover:from-red-800 hover:via-orange-600 hover:to-amber-500 shadow-2xl shadow-orange-700/30 animate-pulse border-2 border-amber-200"
          >
            <Flame className="w-8 h-8 mr-4" />
            ACENDER A FOGUEIRA
          </Button>
        )}
      </div>

      {/* Confetti Effect */}
      {phase === 'celebrating' && (
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
          {/* Top area emojis */}
          {Array.from({ length: 20 }).map((_, i) => (
            <div
              key={`top-${i}`}
              className="absolute animate-[float_3s_ease-in-out_infinite] opacity-70"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 15}%`, // Only in top 15% of screen
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${2 + Math.random() * 2}s`,
                fontSize: `${0.8 + Math.random() * 1.2}rem`
              }}
            >
              {['🔥', '🌽', '🎏', '✨'][Math.floor(Math.random() * 4)]}
            </div>
          ))}
          
          {/* Bottom area emojis */}
          {Array.from({ length: 20 }).map((_, i) => (
            <div
              key={`bottom-${i}`}
              className="absolute animate-[float_2.5s_ease-in-out_infinite] opacity-70"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${85 + Math.random() * 15}%`, // Only in bottom 15% of screen
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${1.5 + Math.random() * 2}s`,
                fontSize: `${0.8 + Math.random() * 1.2}rem`
              }}
            >
              {['🔥', '🌽', '🎏', '🪗'][Math.floor(Math.random() * 4)]}
            </div>
          ))}

          {/* Side area emojis */}
          {Array.from({ length: 30 }).map((_, i) => (
            <div
              key={`side-${i}`}
              className="absolute animate-[bounce_2s_infinite] opacity-60"
              style={{
                left: `${Math.random() < 0.5 ? Math.random() * 15 : 85 + Math.random() * 15}%`, // Left or right 15%
                top: `${20 + Math.random() * 60}%`, // Middle area
                animationDelay: `${Math.random() * 4}s`,
                animationDuration: `${2 + Math.random() * 3}s`,
                fontSize: `${0.6 + Math.random() * 1}rem`
              }}
            >
              {['🔥', '🌽', '🎏', '✨', '🪗', '🤠'][Math.random() < 0.7 ? Math.floor(Math.random() * 4) : Math.floor(Math.random() * 6)]}
            </div>
          ))}

          {/* Floating sparkles */}
          {Array.from({ length: 30 }).map((_, i) => (
            <div
              key={`sparkle-${i}`}
              className="absolute animate-[pulse_1.5s_ease-in-out_infinite] opacity-50"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 2}s`,
                fontSize: `${0.5 + Math.random() * 0.8}rem`,
                filter: 'blur(0.5px)'
              }}
            >
              ✨
            </div>
          ))}
        </div>
      )}
    </div>
  );
}