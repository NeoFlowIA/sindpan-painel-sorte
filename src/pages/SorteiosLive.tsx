import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trophy, Volume2, VolumeX, Maximize, RotateCcw } from "lucide-react";
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
    console.log(`Playing sound: ${soundType}`);
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
    const maxIterations = 50;
    let speed = 50;

    const spinInterval = setInterval(() => {
      setCurrentNumber(generateRandomNumber());
      iterations++;
      
      // Gradually slow down
      if (iterations > 30) {
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
        }, 100);
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
        return 'bg-gradient-to-br from-primary/20 via-background to-secondary/20 animate-pulse';
      case 'countdown':
        return 'bg-gradient-to-br from-red-900 via-black to-red-900';
      case 'spinning':
        return 'bg-gradient-to-br from-primary via-accent to-secondary animate-gradient-x';
      case 'revealing':
        return 'bg-white animate-pulse';
      case 'celebrating':
        return 'bg-gradient-to-br from-green-400 via-blue-500 to-purple-600 animate-gradient-x';
      default:
        return 'bg-gradient-to-br from-primary/10 to-secondary/10';
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
            className="h-16 w-auto opacity-90"
          />
        </div>
      )}

      {/* Preview badge */}
      {isPreview && (
        <div className="absolute top-8 right-8">
          <Badge className="bg-yellow-500 text-black text-lg px-4 py-2">
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
          className="bg-black/20 text-white hover:bg-black/40"
        >
          {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleFullscreen}
          className="bg-black/20 text-white hover:bg-black/40"
        >
          <Maximize className="w-5 h-5" />
        </Button>
      </div>

      {/* Main Content */}
      <div className="text-center space-y-8 max-w-4xl w-full">
        {/* Title */}
        <h1 className={`font-bold transition-all duration-500 ${
          phase === 'initial' 
            ? 'text-6xl md:text-8xl text-primary animate-pulse' 
            : 'text-4xl md:text-6xl text-white'
        }`}>
          {phase === 'initial' ? 'SINDPAN' : 'SORTEIO DIGITAL'}
        </h1>

        {/* Subtitle for initial phase */}
        {phase === 'initial' && (
          <p className="text-2xl md:text-4xl text-muted-foreground mb-8">
            Natal de Prêmios 2024
          </p>
        )}

        {/* Countdown */}
        {phase === 'countdown' && countdown > 0 && (
          <div className="text-[12rem] md:text-[16rem] font-bold text-white animate-bounce drop-shadow-2xl">
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
                ? 'text-white bg-black/20 border-4 border-white animate-pulse' 
                : phase === 'revealing'
                ? 'text-black bg-white/90 border-4 border-black animate-pulse'
                : 'text-white bg-gradient-to-r from-yellow-400 to-orange-500 border-4 border-yellow-300 shadow-yellow-400/50 shadow-2xl'
              }
            `}>
              {currentNumber}
            </div>

            {/* Winner Reveal */}
            {phase === 'celebrating' && winner && (
              <div className="animate-fade-in space-y-6">
                <div className="text-4xl md:text-6xl font-bold text-white drop-shadow-lg animate-bounce">
                  🏆 GANHADOR! 🏆
                </div>
                
                <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-8 border-2 border-white/30">
                  <div className="text-3xl md:text-5xl font-bold text-white mb-4 drop-shadow-lg">
                    {winner.name}
                  </div>
                  <div className="text-xl md:text-3xl text-yellow-200 font-semibold drop-shadow-lg">
                    {winner.bakery}
                  </div>
                </div>

                {/* New Raffle Button */}
                <Button
                  onClick={resetRaffle}
                  size="lg"
                  className="text-xl px-8 py-4 bg-white/20 text-white border-2 border-white/50 hover:bg-white/30 backdrop-blur-sm"
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
            className="text-2xl md:text-3xl px-12 py-8 bg-primary text-primary-foreground hover:bg-primary/90 shadow-2xl animate-pulse"
          >
            <Trophy className="w-8 h-8 mr-4" />
            INICIAR SORTEIO
          </Button>
        )}
      </div>

      {/* Confetti Effect */}
      {phase === 'celebrating' && (
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          {Array.from({ length: 100 }).map((_, i) => (
            <div
              key={i}
              className="absolute animate-bounce opacity-80"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${2 + Math.random() * 2}s`,
                fontSize: `${1 + Math.random() * 2}rem`
              }}
            >
              {['🎉', '🎊', '✨', '🏆', '🥖', '🍞'][Math.floor(Math.random() * 6)]}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}