import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Calendar as DatePicker } from "@/components/ui/calendar";
import { useGraphQLQuery, useGraphQLMutation } from "@/hooks/useGraphQL";
import { GET_NEXT_SORTEIO, SCHEDULE_SORTEIO, UPDATE_SORTEIO, GET_ALL_CUPONS_FOR_GLOBAL_SORTEIO, GET_GANHADORES_COM_DADOS_COMPLETOS, SALVAR_GANHADOR, REATIVAR_CUPOM, GET_PADARIAS } from "@/graphql/queries";
import { toast } from "sonner";
import { format } from "date-fns";
import { Trophy, Calendar as CalendarIcon, X, Save, RotateCcw, Sparkles, Clock, Pencil } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

// Interface para cupom do sorteio
interface CupomSorteio {
  id: string;
  numero_sorte: string;
  valor_compra: number;
  data_compra: string;
  status: string;
  cliente: {
    id: string;
    nome: string;
    cpf: string;
    whatsapp: string;
    resposta_pergunta: string;
    padaria: {
      id: string;
      nome: string;
    };
  };
}

export default function Sorteios() {
  const navigate = useNavigate();
  const [showRaffleModal, setShowRaffleModal] = useState(false);
  const [showWinnerDetails, setShowWinnerDetails] = useState(false);
  const [selectedWinner, setSelectedWinner] = useState<typeof participants[0] | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [currentNumber, setCurrentNumber] = useState("00000");
  const [finalNumber, setFinalNumber] = useState("");
  const [winner, setWinner] = useState<typeof participants[0] | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedTime, setSelectedTime] = useState("");
  const [editingSorteioId, setEditingSorteioId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPadaria, setSelectedPadaria] = useState<string>("all");
  const [cupomSorteadoId, setCupomSorteadoId] = useState<string | null>(null);
  const [numeroDigitado, setNumeroDigitado] = useState<string>("");

  // Query para buscar próximo sorteio
  const { data: nextSorteioData } = useGraphQLQuery<{ sorteios: { id: string; data_sorteio: string }[] }>(['next-sorteio'], GET_NEXT_SORTEIO);
  const nextSorteio = nextSorteioData?.sorteios[0];

  // Query para buscar todos os cupons ativos
  const { data: cuponsData, isLoading: cuponsLoading } = useGraphQLQuery<{ cupons: CupomSorteio[] }>(
    ['all-cupons-global-sorteio'],
    GET_ALL_CUPONS_FOR_GLOBAL_SORTEIO
  );

  // Query para buscar ganhadores salvos (da tabela sorteios)
  const { data: ganhadoresData, isLoading: ganhadoresLoading, refetch: refetchGanhadores } = useGraphQLQuery<{ 
    sorteios: Array<{
      id: string;
      numero_sorteado: string;
      data_sorteio: string;
      status: string;
      ganhador_id: string;
      cupom_vencedor_id: string;
      ganhador: {
        id: string;
        nome: string;
        cpf: string;
        telefone: string;
        email: string;
      };
      cupom_vencedor: {
        id: string;
        numero_sorte: string;
        numero_cupom: string;
        padaria: {
          id: string;
          nome: string;
        };
      };
    }>
  }>(
    ['ganhadores-salvos'],
    GET_GANHADORES_COM_DADOS_COMPLETOS
  );

  // Query para buscar padarias
  const { data: padariasData } = useGraphQLQuery<{ padarias: { id: string; nome: string }[] }>(
    ['padarias-sorteio'],
    GET_PADARIAS
  );

  // Debug logs
  console.log('🔍 Cupons carregados:', cuponsData?.cupons);
  console.log('🔍 Loading state:', cuponsLoading);

  // Converter cupons para formato de participantes
  const participants = (cuponsData?.cupons || [])
    .filter(cupom => 
      cupom && 
      cupom.cliente && 
      cupom.cliente.padaria && 
      cupom.cliente.nome && 
      cupom.cliente.cpf &&
      cupom.numero_sorte
    ) // Filtrar cupons com dados completos
    .map(cupom => ({
      name: cupom.cliente.nome || 'Nome não informado',
      cpf: `***${(cupom.cliente.cpf || '').slice(-3)}`,
      bakery: cupom.cliente.padaria.nome || 'Padaria não informada',
      answer: cupom.cliente.resposta_pergunta || null,
      numero_sorte: cupom.numero_sorte || '00000',
      valor_compra: cupom.valor_compra || 0,
      data_compra: cupom.data_compra || new Date().toISOString()
    }));

  const { mutate: scheduleSorteio, isPending: isScheduling } = useGraphQLMutation(SCHEDULE_SORTEIO, {
    invalidateQueries: [['next-sorteio']],
    onSuccess: () => {
      toast.success('Sorteio agendado!');
      setShowScheduleModal(false);
      setSelectedDate(undefined);
      setSelectedTime('');
    },
    onError: () => {
      toast.error('Erro ao agendar sorteio');
    }
  });

  const { mutate: updateSorteio, isPending: isUpdating } = useGraphQLMutation(UPDATE_SORTEIO, {
    invalidateQueries: [['next-sorteio']],
    onSuccess: () => {
      toast.success('Sorteio atualizado!');
      setShowScheduleModal(false);
      setSelectedDate(undefined);
      setSelectedTime('');
      setEditingSorteioId(null);
    },
    onError: () => {
      toast.error('Erro ao atualizar sorteio');
    }
  });

  // Mutation para salvar ganhador (cupom específico + dados completos)
  const { mutate: salvarGanhador, isPending: isMarcandoSorteado } = useGraphQLMutation(SALVAR_GANHADOR, {
    invalidateQueries: [['all-cupons-global-sorteio'], ['ganhadores-salvos']],
    onSuccess: (data) => {
      console.log('🔍 Ganhador salvo com sucesso:', data);
      toast.success('Ganhador salvo com todos os dados!');
      setCupomSorteadoId(null);
    },
    onError: (error) => {
      console.error('🔍 Erro ao salvar ganhador:', error);
      toast.error('Erro ao salvar ganhador');
    }
  });

  // Mutation para reativar cupom
  const { mutate: reativarCupom, isPending: isReativando } = useGraphQLMutation(REATIVAR_CUPOM, {
    invalidateQueries: [['all-cupons-global-sorteio'], ['ganhadores-salvos']],
    onSuccess: () => {
      toast.success('Cupom reativado!');
    },
    onError: () => {
      toast.error('Erro ao reativar cupom');
    }
  });

  const isMutating = isScheduling || isUpdating;

  const handleSchedule = () => {
    if (!selectedDate || !selectedTime) return;
    const [hours, minutes] = selectedTime.split(':').map(Number);
    const date = new Date(selectedDate);
    date.setHours(hours);
    date.setMinutes(minutes);
    if (editingSorteioId) {
      updateSorteio({ id: editingSorteioId, data: date.toISOString() });
    } else {
      scheduleSorteio({ id: crypto.randomUUID(), data: date.toISOString() });
    }
  };

  const handleEdit = () => {
    if (!nextSorteio) return;
    const date = new Date(nextSorteio.data_sorteio);
    setSelectedDate(date);
    setSelectedTime(format(date, 'HH:mm'));
    setEditingSorteioId(nextSorteio.id);
    setShowScheduleModal(true);
  };

  const generateRandomNumber = () => {
    // Usar números de sorte reais dos cupons
    if (participants.length > 0) {
      const randomParticipant = participants[Math.floor(Math.random() * participants.length)];
      return randomParticipant.numero_sorte;
    }
    return Math.floor(Math.random() * 100000).toString().padStart(5, '0');
  };

  const startRaffle = () => {
    if (participants.length === 0) {
      toast.error('Não há participantes para o sorteio');
      return;
    }

    if (!numeroDigitado || numeroDigitado.trim() === '') {
      toast.error('Digite um número para o sorteio');
      return;
    }

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
        
        // Encontrar o número mais próximo do digitado
        const numeroAlvo = parseInt(numeroDigitado);
        
        // Primeiro, tentar encontrar número exato
        let winnerParticipant = participants.find(p => parseInt(p.numero_sorte) === numeroAlvo);
        
        // Se não encontrar exato, buscar o mais próximo
        if (!winnerParticipant && participants.length > 0) {
          let menorDiferenca = Infinity;
          let indexMaisProximo = 0;
          
          participants.forEach((participant, index) => {
            const diferenca = Math.abs(parseInt(participant.numero_sorte) - numeroAlvo);
            if (diferenca < menorDiferenca) {
              menorDiferenca = diferenca;
              indexMaisProximo = index;
            }
          });
          
          winnerParticipant = participants[indexMaisProximo];
          
          if (menorDiferenca > 0) {
            toast.info(`Número exato não encontrado. Selecionado o mais próximo: ${winnerParticipant.numero_sorte}`);
          }
        }
        
        if (!winnerParticipant) {
          toast.error('Nenhum participante encontrado');
          setIsAnimating(false);
          return;
        }
        
        // Encontrar o cupom original para salvar o ID
        const cupomOriginal = (cuponsData?.cupons || []).find(cupom => 
          cupom.numero_sorte === winnerParticipant!.numero_sorte &&
          cupom.cliente.nome === winnerParticipant!.name
        );
        
        setFinalNumber(winnerParticipant.numero_sorte);
        setCurrentNumber(winnerParticipant.numero_sorte);
        setWinner(winnerParticipant);
        setCupomSorteadoId(cupomOriginal?.id || null);
        setIsAnimating(false);
        setShowResult(true);
        setShowConfetti(true);
        
        // Hide confetti after 3 seconds
        setTimeout(() => setShowConfetti(false), 3000);
      }
    }, 100);
  };

  const saveResult = () => {
    if (!winner || !cupomSorteadoId || !numeroDigitado) return;
    
    console.log('🔍 Salvando ganhador:', { 
      cupomId: cupomSorteadoId, 
      numeroSorteado: numeroDigitado,
      winner 
    });
    
    // Encontrar o cupom específico que ganhou
    const cupomGanhador = cuponsData?.cupons.find(cupom => cupom.id === cupomSorteadoId);
    if (!cupomGanhador || !cupomGanhador.cliente?.id) {
      toast.error("Erro: Cupom ou cliente não encontrado");
      return;
    }
    
    console.log('🔍 Dados do cupom ganhador:', {
      cupom_vencedor_id: cupomSorteadoId,
      ganhador_id: cupomGanhador.cliente.id,
      numero_sorteado: numeroDigitado,
      numero_sorte: cupomGanhador.numero_sorte
    });
    
    // Salvar o ganhador na tabela sorteios
    salvarGanhador({
      numero_sorteado: numeroDigitado,
      data_sorteio: new Date().toISOString(),
      ganhador_id: cupomGanhador.cliente.id,
      cupom_vencedor_id: cupomSorteadoId,
      cliente_id: cupomGanhador.cliente.id
    });
    
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
    setCupomSorteadoId(null);
    setNumeroDigitado("");
  };

  const continuarSorteio = () => {
    setShowRaffleModal(true);
    resetRaffle();
  };

  const reativarCupomGanhador = (clienteId: string) => {
    reativarCupom({ cliente_id: clienteId });
  };

  const cancelRaffle = () => {
    setShowRaffleModal(false);
    resetRaffle();
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
            <p className="text-muted-foreground">
              Gerencie e execute sorteios da campanha • {participants.length} participantes cadastrados
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => {
                setEditingSorteioId(null);
                setSelectedDate(undefined);
                setSelectedTime('');
                setShowScheduleModal(true);
              }}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <CalendarIcon className="w-4 h-4 mr-2" />
              Agendar novo sorteio
            </Button>
            <Button 
              onClick={() => setShowRaffleModal(true)}
              disabled={participants.length === 0}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <Trophy className="w-4 h-4 mr-2" />
              Iniciar Sorteio
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
              {nextSorteio ? (
                <>
                  <div>
                    <p className="text-2xl font-bold text-primary">{format(new Date(nextSorteio.data_sorteio), 'dd/MM/yyyy')}</p>
                    <p className="text-sm text-muted-foreground">{format(new Date(nextSorteio.data_sorteio), 'HH:mm')}h</p>
                  </div>
                  <div className="ml-auto flex items-center gap-2">
                    <Badge variant="outline" className="text-secondary border-secondary">
                      <CalendarIcon className="w-3 h-3 mr-1" />
                      Agendado
                    </Badge>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleEdit}
                      aria-label="Editar data do sorteio"
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                  </div>
                </>
              ) : (
                <p className="text-muted-foreground">Nenhum sorteio agendado</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Participants Info Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-primary" />
              Participantes do Sorteio
            </CardTitle>
          </CardHeader>
          <CardContent>
            {cuponsLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-3">
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary">{participants.length}</div>
                  <div className="text-sm text-muted-foreground">Total de Cupons Participantes</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-secondary">
                    {participants.filter(p => p.answer === "Na padaria").length}
                  </div>
                  <div className="text-sm text-muted-foreground">Resposta: Na padaria</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-accent">
                    {participants.filter(p => p.answer === "Outro lugar").length}
                  </div>
                  <div className="text-sm text-muted-foreground">Resposta: Outro lugar</div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Ganhadores List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-primary" />
              Ganhadores Salvos
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Filters */}
            <div className="flex gap-4 items-center mb-4">
              <Input 
                placeholder="Buscar por ganhador..." 
                className="max-w-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <Select value={selectedPadaria} onValueChange={setSelectedPadaria}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Filtrar por padaria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as padarias</SelectItem>
                  {padariasData?.padarias?.map((padaria: any) => (
                    <SelectItem key={padaria.id} value={padaria.id}>
                      {padaria.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Ganhadores Table */}
            {ganhadoresLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>CPF</TableHead>
                    <TableHead>Telefone</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Nº Sorteado</TableHead>
                    <TableHead>Nº da Sorte</TableHead>
                    <TableHead>Data do Sorteio</TableHead>
                    <TableHead>Padaria</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(ganhadoresData?.sorteios || [])
                    .filter(sorteio => {
                      const matchesSearch = !searchTerm || 
                        sorteio?.ganhador?.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        sorteio?.ganhador?.cpf?.includes(searchTerm) ||
                        sorteio?.ganhador?.telefone?.includes(searchTerm);
                      
                      const matchesPadaria = selectedPadaria === "all" || 
                        sorteio?.cupom_vencedor?.padaria?.id === selectedPadaria;
                      
                      return matchesSearch && matchesPadaria;
                    })
                    .map((sorteio) => (
                      <TableRow key={sorteio.id}>
                        <TableCell className="font-medium">{sorteio.ganhador?.nome || 'N/A'}</TableCell>
                        <TableCell>{sorteio.ganhador?.cpf || 'N/A'}</TableCell>
                        <TableCell>{sorteio.ganhador?.telefone || 'N/A'}</TableCell>
                        <TableCell className="text-xs">{sorteio.ganhador?.email || 'N/A'}</TableCell>
                        <TableCell>
                          <Badge variant="default" className="bg-green-600">
                            {sorteio.numero_sorteado || 'N/A'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-primary border-primary">
                            {sorteio.cupom_vencedor?.numero_sorte || 'N/A'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {sorteio.data_sorteio ? 
                            format(new Date(sorteio.data_sorteio), 'dd/MM/yyyy HH:mm') : 
                            'N/A'
                          }
                        </TableCell>
                        <TableCell>{sorteio.cupom_vencedor?.padaria?.nome || 'N/A'}</TableCell>
                        <TableCell>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => reativarCupomGanhador(sorteio.ganhador_id)}
                            disabled={isReativando}
                          >
                            {isReativando ? "Reativando..." : "Reativar"}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
        <Dialog
          open={showScheduleModal}
          onOpenChange={(open) => {
            setShowScheduleModal(open);
            if (!open) {
              setEditingSorteioId(null);
              setSelectedDate(undefined);
              setSelectedTime('');
            }
          }}
        >
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>{editingSorteioId ? 'Editar Sorteio' : 'Agendar Sorteio'}</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col gap-4 py-4">
              <DatePicker mode="single" selected={selectedDate} onSelect={setSelectedDate} className="rounded-md border" />
              <Input type="time" value={selectedTime} onChange={(e) => setSelectedTime(e.target.value)} />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowScheduleModal(false)}>Cancelar</Button>
              <Button onClick={handleSchedule} disabled={!selectedDate || !selectedTime || isMutating}>
                {isMutating
                  ? editingSorteioId
                    ? 'Salvando...'
                    : 'Agendando...'
                  : editingSorteioId
                  ? 'Salvar'
                  : 'Agendar'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

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

              {/* Input para número do sorteio */}
              {!isAnimating && !showResult && countdown === 0 && (
                <div className="mb-8 w-full max-w-md">
                  <label className="block text-sm font-medium text-center mb-2">
                    Digite o número do sorteio
                  </label>
                  <Input 
                    type="number"
                    placeholder="Ex: 12345"
                    value={numeroDigitado}
                    onChange={(e) => setNumeroDigitado(e.target.value)}
                    className="text-center text-2xl font-mono h-14"
                    maxLength={5}
                  />
                  <p className="text-xs text-muted-foreground text-center mt-2">
                    O sistema buscará o número exato ou o mais próximo
                  </p>
                </div>
              )}

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
                  <Button 
                    onClick={saveResult} 
                    className="bg-green-600 hover:bg-green-700 text-white"
                    disabled={isMarcandoSorteado}
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {isMarcandoSorteado ? "Salvando..." : "Salvar resultado"}
                  </Button>
                  <Button onClick={continuarSorteio} className="bg-blue-600 hover:bg-blue-700 text-white">
                    <Trophy className="w-4 h-4 mr-2" />
                    Continuar sorteio
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