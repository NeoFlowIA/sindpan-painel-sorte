import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogOverlay } from "@/components/ui/dialog";
import { Trophy, Download, Plus, Calendar, Monitor, X, Save, RotateCcw, Sparkles } from "lucide-react";
import { useState, useEffect } from "react";

const raffles = [
  {
    date: "15/01/2024",
    number: "07349",
    winner: "Maria Silva Santos",
    cpf: "***456",
    bakery: "Padaria Central"
  },
  {
    date: "08/01/2024", 
    number: "02841",
    winner: "João Pereira Lima",
    cpf: "***789",
    bakery: "Pão Dourado"
  },
  {
    date: "01/01/2024",
    number: "09673", 
    winner: "Ana Costa Oliveira",
    cpf: "***123",
    bakery: "Delícias do Forno"
  }
];

// Mock data for participants
const participants = [
  { name: "Maria Silva Santos", cpf: "***456", bakery: "Padaria Central" },
  { name: "João Pereira Lima", cpf: "***789", bakery: "Pão Dourado" },
  { name: "Ana Costa Oliveira", cpf: "***123", bakery: "Delícias do Forno" },
  { name: "Carlos Eduardo", cpf: "***234", bakery: "Padaria Central" },
  { name: "Fernanda Santos", cpf: "***567", bakery: "Pão Dourado" },
  { name: "Roberto Silva", cpf: "***890", bakery: "Delícias do Forno" }
];

export default function Sorteios() {
  const [showRaffleModal, setShowRaffleModal] = useState(false);
  const [presentationMode, setPresentationMode] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [currentNumber, setCurrentNumber] = useState("00000");
  const [finalNumber, setFinalNumber] = useState("");
  const [winner, setWinner] = useState<typeof participants[0] | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  const generateRandomNumber = () => {
    return Math.floor(Math.random() * 100000).toString().padStart(5, '0');
  };

  const startRaffle = () => {
    setIsAnimating(true);
    setShowResult(false);
    setShowConfetti(false);
    setCountdown(3);
    
    // Countdown animation
    const countdownInterval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(countdownInterval);
          // Start number animation
          animateNumbers();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const animateNumbers = () => {
    let iterations = 0;
    const maxIterations = 30;
    
    const numberInterval = setInterval(() => {
      setCurrentNumber(generateRandomNumber());
      iterations++;
      
      if (iterations >= maxIterations) {
        clearInterval(numberInterval);
        // Generate final result
        const finalNum = generateRandomNumber();
        const randomWinner = participants[Math.floor(Math.random() * participants.length)];
        
        setFinalNumber(finalNum);
        setCurrentNumber(finalNum);
        setWinner(randomWinner);
        setIsAnimating(false);
        setShowResult(true);
        setShowConfetti(true);
        
        // Hide confetti after 3 seconds
        setTimeout(() => setShowConfetti(false), 3000);
      }
    }, 100);
  };

  const saveResult = () => {
    // Here you would save to database/state
    console.log("Saving raffle result:", { number: finalNumber, winner });
    setShowRaffleModal(false);
    resetRaffle();
  };

  const resetRaffle = () => {
    setIsAnimating(false);
    setCountdown(0);
    setCurrentNumber("00000");
    setFinalNumber("");
    setWinner(null);
    setShowResult(false);
    setShowConfetti(false);
  };

  const cancelRaffle = () => {
    setShowRaffleModal(false);
    resetRaffle();
  };

  return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-primary">Sorteios Digitais</h1>
            <p className="text-muted-foreground">Gerencie e execute sorteios da campanha</p>
          </div>
          <div className="flex gap-2">
            <Button 
              onClick={() => setShowRaffleModal(true)}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Plus className="w-4 h-4 mr-2" />
              Realizar novo sorteio
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setPresentationMode(true)}
              className="border-primary text-primary hover:bg-primary/10"
            >
              <Monitor className="w-4 h-4 mr-2" />
              Modo apresentação
            </Button>
          </div>
        </div>

        {/* Next Raffle Card */}
        <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-secondary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-primary">
              <Trophy className="w-5 h-5" />
              Próximo Sorteio
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div>
                <p className="text-2xl font-bold text-primary">22/01/2024</p>
                <p className="text-sm text-muted-foreground">15:00h</p>
              </div>
              <div className="ml-auto">
                <Badge variant="outline" className="text-secondary border-secondary">
                  <Calendar className="w-3 h-3 mr-1" />
                  Agendado
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Filters */}
        <div className="flex gap-4 items-center">
          <Input 
            placeholder="Buscar por ganhador..." 
            className="max-w-sm"
          />
          <Select>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filtrar por padaria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as padarias</SelectItem>
              <SelectItem value="central">Padaria Central</SelectItem>
              <SelectItem value="dourado">Pão Dourado</SelectItem>
              <SelectItem value="delicias">Delícias do Forno</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Exportar PDF
          </Button>
        </div>

        {/* Raffles Table */}
        <Card>
          <CardHeader>
            <CardTitle>Histórico de Sorteios</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data do Sorteio</TableHead>
                  <TableHead>Número Sorteado</TableHead>
                  <TableHead>Ganhador</TableHead>
                  <TableHead>CPF</TableHead>
                  <TableHead>Padaria</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {raffles.map((raffle, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{raffle.date}</TableCell>
                    <TableCell>
                      <Badge className="bg-secondary text-secondary-foreground">
                        {raffle.number}
                      </Badge>
                    </TableCell>
                    <TableCell>{raffle.winner}</TableCell>
                    <TableCell>{raffle.cpf}</TableCell>
                    <TableCell>{raffle.bakery}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm">
                        Ver detalhes
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Raffle Animation Modal */}
        <Dialog open={showRaffleModal} onOpenChange={setShowRaffleModal}>
          <DialogContent className="max-w-4xl w-full h-[80vh] p-0 overflow-hidden">
            <div className="relative h-full bg-gradient-to-br from-primary/10 via-background to-secondary/10 flex flex-col items-center justify-center">
              {/* Close button */}
              <Button
                variant="ghost"
                size="icon"
                onClick={cancelRaffle}
                className="absolute top-4 right-4 z-10"
              >
                <X className="w-4 h-4" />
              </Button>

              {/* Confetti Effect */}
              {showConfetti && (
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                  {Array.from({ length: 50 }).map((_, i) => (
                    <div
                      key={i}
                      className="absolute animate-bounce"
                      style={{
                        left: `${Math.random() * 100}%`,
                        top: `${Math.random() * 100}%`,
                        animationDelay: `${Math.random() * 2}s`,
                        animationDuration: `${1 + Math.random()}s`
                      }}
                    >
                      <Sparkles className="w-4 h-4 text-primary" />
                    </div>
                  ))}
                </div>
              )}

              {/* Title */}
              <h2 className="text-3xl font-bold text-primary mb-8">Sorteio Digital SINDPAN</h2>

              {/* Countdown */}
              {countdown > 0 && (
                <div className="text-8xl font-bold text-primary animate-pulse mb-8">
                  {countdown}
                </div>
              )}

              {/* Number Display */}
              {(isAnimating || showResult) && (
                <div className="relative">
                  <div className={`text-9xl font-mono font-bold text-center p-8 rounded-2xl border-4 transition-all duration-300 ${
                    isAnimating 
                      ? 'border-primary bg-primary/10 animate-pulse' 
                      : 'border-secondary bg-secondary/10 shadow-2xl'
                  }`}>
                    {currentNumber}
                  </div>
                  
                  {/* Winner Information */}
                  {showResult && winner && (
                    <Card className="mt-8 border-2 border-secondary bg-gradient-to-r from-secondary/20 to-primary/20">
                      <CardHeader className="text-center">
                        <CardTitle className="text-2xl text-primary flex items-center justify-center gap-2">
                          <Trophy className="w-6 h-6" />
                          Ganhador do Sorteio!
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="text-center space-y-2">
                        <p className="text-xl font-semibold">{winner.name}</p>
                        <p className="text-muted-foreground">CPF: {winner.cpf}</p>
                        <p className="text-secondary font-medium">{winner.bakery}</p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}

              {/* Start Button */}
              {!isAnimating && !showResult && countdown === 0 && (
                <Button 
                  onClick={startRaffle}
                  size="lg"
                  className="text-xl px-12 py-6 bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  <Trophy className="w-6 h-6 mr-2" />
                  Iniciar Sorteio
                </Button>
              )}

              {/* Action Buttons */}
              {showResult && (
                <div className="flex gap-4 mt-8">
                  <Button onClick={saveResult} className="bg-green-600 hover:bg-green-700 text-white">
                    <Save className="w-4 h-4 mr-2" />
                    Salvar resultado
                  </Button>
                  <Button onClick={resetRaffle} variant="outline">
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Refazer sorteio
                  </Button>
                  <Button onClick={cancelRaffle} variant="outline">
                    Cancelar
                  </Button>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Presentation Mode */}
        <Dialog open={presentationMode} onOpenChange={setPresentationMode}>
          <DialogOverlay className="bg-black" />
          <DialogContent className="w-screen h-screen max-w-none p-0 m-0 border-0 rounded-none">
            <div className="relative h-full bg-gradient-to-br from-primary via-secondary to-primary flex flex-col items-center justify-center text-white">
              {/* Close Presentation Mode */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setPresentationMode(false)}
                className="absolute top-4 right-4 z-10 text-white hover:bg-white/20"
              >
                <X className="w-6 h-6" />
              </Button>

              {/* Confetti Effect */}
              {showConfetti && (
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                  {Array.from({ length: 100 }).map((_, i) => (
                    <div
                      key={i}
                      className="absolute animate-bounce"
                      style={{
                        left: `${Math.random() * 100}%`,
                        top: `${Math.random() * 100}%`,
                        animationDelay: `${Math.random() * 3}s`,
                        animationDuration: `${1 + Math.random() * 2}s`
                      }}
                    >
                      <Sparkles className="w-6 h-6 text-yellow-300" />
                    </div>
                  ))}
                </div>
              )}

              {/* Title */}
              <h1 className="text-6xl font-bold mb-16 text-center">
                SORTEIO DIGITAL SINDPAN
              </h1>

              {/* Countdown */}
              {countdown > 0 && (
                <div className="text-[20rem] font-bold animate-pulse mb-16">
                  {countdown}
                </div>
              )}

              {/* Number Display */}
              {(isAnimating || showResult) && (
                <div className="relative">
                  <div className={`text-[15rem] font-mono font-bold text-center p-16 rounded-3xl border-8 transition-all duration-500 ${
                    isAnimating 
                      ? 'border-yellow-400 bg-yellow-400/20 animate-pulse' 
                      : 'border-white bg-white/20 shadow-2xl'
                  }`}>
                    {currentNumber}
                  </div>
                  
                  {/* Winner Information */}
                  {showResult && winner && (
                    <div className="mt-16 text-center space-y-8">
                      <h2 className="text-8xl font-bold text-yellow-300 flex items-center justify-center gap-4">
                        <Trophy className="w-16 h-16" />
                        GANHADOR!
                      </h2>
                      <div className="space-y-4">
                        <p className="text-6xl font-bold">{winner.name}</p>
                        <p className="text-4xl">CPF: {winner.cpf}</p>
                        <p className="text-5xl font-semibold text-yellow-300">{winner.bakery}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Start Button */}
              {!isAnimating && !showResult && countdown === 0 && (
                <Button 
                  onClick={startRaffle}
                  size="lg"
                  className="text-4xl px-24 py-12 bg-white text-primary hover:bg-white/90 font-bold"
                >
                  <Trophy className="w-12 h-12 mr-4" />
                  INICIAR SORTEIO
                </Button>
              )}

              {/* Restart Button for Presentation */}
              {showResult && (
                <Button 
                  onClick={resetRaffle}
                  size="lg"
                  className="mt-16 text-2xl px-16 py-8 bg-white/20 text-white hover:bg-white/30 border-2 border-white"
                >
                  <RotateCcw className="w-8 h-8 mr-4" />
                  NOVO SORTEIO
                </Button>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
  );
}