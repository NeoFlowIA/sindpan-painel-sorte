import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogOverlay } from "@/components/ui/dialog";
import { Trophy, Download, Plus, Calendar, Monitor, X, Save, RotateCcw, Sparkles, Eye, User, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { CinematicPresentation } from "@/components/CinematicPresentation";
import { PreviewModal } from "@/components/PreviewModal";

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
  { name: "Maria Silva Santos", cpf: "***456", bakery: "Padaria Central", answer: "Na padaria" },
  { name: "João Pereira Lima", cpf: "***789", bakery: "Pão Dourado", answer: "Outro lugar" },
  { name: "Ana Costa Oliveira", cpf: "***123", bakery: "Delícias do Forno", answer: "Na padaria" },
  { name: "Carlos Eduardo", cpf: "***234", bakery: "Padaria Central", answer: null },
  { name: "Fernanda Santos", cpf: "***567", bakery: "Pão Dourado", answer: "Outro lugar" },
  { name: "Roberto Silva", cpf: "***890", bakery: "Delícias do Forno", answer: "Na padaria" }
];

export default function Sorteios() {
  const navigate = useNavigate();
  const [showRaffleModal, setShowRaffleModal] = useState(false);
  const [presentationMode, setPresentationMode] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showWinnerDetails, setShowWinnerDetails] = useState(false);
  const [selectedWinner, setSelectedWinner] = useState<typeof participants[0] | null>(null);
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

  const handleRaffleComplete = (result: { number: string; winner: typeof participants[0] }) => {
    console.log("Raffle completed:", result);
    setPresentationMode(false);
    // Here you would save to database/state
  };

  const showWinnerInfo = (winner: typeof participants[0]) => {
    setSelectedWinner(winner);
    setShowWinnerDetails(true);
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
              onClick={() => window.open('/sorteios/live', '_blank')}
              className="border-primary text-primary hover:bg-primary/10"
            >
              <Monitor className="w-4 h-4 mr-2" />
              Modo apresentação
            </Button>
            <Button 
              variant="outline" 
              onClick={() => window.open('/sorteios/live?preview=1', '_blank')}
              className="border-secondary text-secondary hover:bg-secondary/10"
            >
              <Eye className="w-4 h-4 mr-2" />
              Pré-visualizar
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
          <Button 
            variant="outline" 
            onClick={() => navigate('/relatorios/sorteios')}
            className="ml-auto"
          >
            <Clock className="w-4 h-4 mr-2" />
            Ver histórico completo
          </Button>
        </div>

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
                        <div className="mt-3">
                          <Badge 
                            className={
                              winner.answer === "Na padaria" 
                                ? "bg-green-500 text-white hover:bg-green-600" 
                                : winner.answer === "Outro lugar"
                                ? "bg-yellow-500 text-black hover:bg-yellow-600"
                                : "bg-gray-300 text-black hover:bg-gray-400"
                            }
                            aria-label={`Resposta da pergunta: ${winner.answer || "Não informado"}`}
                          >
                            {winner.answer || "Não informado"}
                          </Badge>
                        </div>
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

        {/* Cinematic Presentation Mode */}
        <CinematicPresentation
          isOpen={presentationMode}
          onClose={() => setPresentationMode(false)}
          participants={participants}
          onRaffleComplete={handleRaffleComplete}
        />

        {/* Preview Modal */}
        <PreviewModal
          isOpen={showPreviewModal}
          onClose={() => setShowPreviewModal(false)}
        />

        {/* Winner Details Modal */}
        <Dialog open={showWinnerDetails} onOpenChange={setShowWinnerDetails}>
          <DialogContent className="max-w-md">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-primary" />
                <h3 className="text-lg font-semibold">Detalhes do Ganhador</h3>
              </div>
              
              {selectedWinner && (
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Nome Completo</label>
                    <p className="text-lg">{selectedWinner.name}</p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">CPF Completo</label>
                    <p className="text-lg font-mono">{selectedWinner.cpf}789</p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Padaria</label>
                    <p className="text-lg">{selectedWinner.bakery}</p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Resposta da pergunta</label>
                    <p className="text-lg">{selectedWinner.answer || "Não informado"}</p>
                  </div>
                  
                  <div className="flex gap-2 pt-4">
                    <Button variant="outline" className="flex-1">
                      Entrar em contato
                    </Button>
                    <Button onClick={() => setShowWinnerDetails(false)}>
                      Fechar
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
  );
}