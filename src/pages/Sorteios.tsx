import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Calendar as DatePicker } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { useGraphQLQuery, useGraphQLMutation } from "@/hooks/useGraphQL";
import { GET_NEXT_SORTEIO, SCHEDULE_SORTEIO, UPDATE_SORTEIO, GET_CLIENTES_WITH_ACTIVE_CUPONS_BY_CAMPANHA, GET_GANHADORES_COM_DADOS_COMPLETOS, SALVAR_GANHADOR, MARCAR_CUPOM_SORTEADO, REATIVAR_CUPOM, GET_PADARIAS, LIST_CAMPANHAS, CREATE_CAMPANHA, DEACTIVATE_CAMPANHAS } from "@/graphql/queries";
import { toast } from "sonner";
import { format } from "date-fns";
import { Trophy, Calendar as CalendarIcon, X, Save, RotateCcw, Sparkles, Clock, Pencil, PlusCircle } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useState, useEffect, useMemo } from "react";
import { CampaignSelect } from "@/components/CampaignSelect";
import { CampaignFormDialog, type CampaignFormValues } from "@/components/CampaignFormDialog";
import { getCampaignStatus } from "@/components/CampaignStatusBadge";

// Interface para cupom do sorteio
interface CupomSorteio {
  id: string;
  numero_sorte: string;
  valor_compra: number;
  data_compra: string;
  status: string;
  padaria_id: string;
  padaria: {
    id: string;
    nome: string;
  };
  cliente: {
    id: string;
    nome: string | null;
    cpf: string | null;
    whatsapp: string | null;
    resposta_pergunta: string | null;
    padaria: {
      id: string;
      nome: string;
    } | null;
  };
}

interface ClienteWithCupons {
  id: string;
  nome: string | null;
  cpf: string | null;
  whatsapp: string | null;
  resposta_pergunta: string | null;
  padaria: {
    id: string;
    nome: string;
  } | null;
  cupons_aggregate: {
    aggregate: {
      count: number | null;
    } | null;
  } | null;
  cupons: Array<{
    id: string;
    numero_sorte: string;
    valor_compra: string | number | null;
    data_compra: string;
    status: string;
    campanha_id: number;
    padaria_id?: string | null;
  }>;
}

interface Participant {
  name: string;
  cpf: string;
  bakery: string;
  answer: string | null;
  numero_sorte: string;
  valor_compra: number;
  data_compra: string;
}

export default function Sorteios() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const searchParamsString = searchParams.toString();
  const urlCampaignId = useMemo(
    () => new URLSearchParams(searchParamsString).get("campanhaId") ?? undefined,
    [searchParamsString]
  );

  const [showRaffleModal, setShowRaffleModal] = useState(false);
  const [showWinnerDetails, setShowWinnerDetails] = useState(false);
  const [selectedWinner, setSelectedWinner] = useState<Participant | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [currentNumber, setCurrentNumber] = useState("00000");
  const [finalNumber, setFinalNumber] = useState("");
  const [winner, setWinner] = useState<Participant | null>(null);
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
  const [showLiveRaffle, setShowLiveRaffle] = useState(false);
  const [campaignDialogOpen, setCampaignDialogOpen] = useState(false);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | undefined>(urlCampaignId);
  const [selectedScheduleCampaignId, setSelectedScheduleCampaignId] = useState<string | undefined>(urlCampaignId);

  const parseCampaignId = (value?: string) => {
    if (!value) {
      return undefined;
    }

    const numericId = Number(value);
    return Number.isNaN(numericId) ? undefined : numericId;
  };

  const selectedCampaignIdNumber = useMemo(
    () => parseCampaignId(selectedCampaignId),
    [selectedCampaignId]
  );

  const selectedScheduleCampaignIdNumber = useMemo(
    () => parseCampaignId(selectedScheduleCampaignId),
    [selectedScheduleCampaignId]
  );
  
  // Função para entrar em fullscreen
  const enterFullscreen = () => {
    const elem = document.documentElement;
    if (elem.requestFullscreen) {
      elem.requestFullscreen();
    }
  };
  
  // Função para sair do fullscreen
  const exitFullscreen = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    }
  };
  
  // Listener para tecla ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showLiveRaffle) {
        exitFullscreen();
        setShowLiveRaffle(false);
        resetRaffle();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showLiveRaffle]);

  // Query para buscar campanhas
  const { data: campanhasData, isLoading: campaignsLoading } = useGraphQLQuery<{
    campanha: Array<{
      id: string;
      Nome: string;
      data_inicio: string;
      data_fim: string;
      ativo: boolean;
    }>;
  }>(['campanhas'], LIST_CAMPANHAS);

  const campaigns = (campanhasData as any)?.campanha || [];
  const activeCampaign = useMemo(
    () => campaigns.find((campaign) => getCampaignStatus(campaign.data_inicio, campaign.data_fim) === 'Ativa'),
    [campaigns]
  );
  // Filtrar campanhas: apenas as que estão ativas OU já encerradas (para permitir sorteios de campanhas antigas)
  const scheduleableCampaigns = useMemo(
    () =>
      campaigns.filter((c) => {
        const status = getCampaignStatus(c.data_inicio, c.data_fim);

        if (status === 'Ativa') {
          return true;
        }

        if (status === 'Encerrada') {
          return true;
        }

        // Para campanhas futuras, manter apenas as que continuam ativadas manualmente
        return c.ativo === true;
      }),
    [campaigns]
  );
  const activeCampaignIdString = activeCampaign ? String(activeCampaign.id) : undefined;

  useEffect(() => {
    if (campaignsLoading || scheduleableCampaigns.length === 0) {
      return;
    }

    const isSelectedCampaignAvailable =
      selectedCampaignIdNumber !== undefined
        ? scheduleableCampaigns.some((campaign) => Number(campaign.id) === selectedCampaignIdNumber)
        : false;

    if (isSelectedCampaignAvailable) {
      return;
    }

    const preferredCampaign = activeCampaign ?? scheduleableCampaigns[0];

    if (!preferredCampaign) {
      return;
    }

    const preferredCampaignId = String(preferredCampaign.id);

    setSelectedCampaignId((current) => {
      const hasCurrentSelection = current
        ? scheduleableCampaigns.some((campaign) => String(campaign.id) === current)
        : false;
      const shouldReplace =
        !hasCurrentSelection ||
        (activeCampaignIdString !== undefined && current !== activeCampaignIdString);

      return shouldReplace ? preferredCampaignId : current;
    });

    setSelectedScheduleCampaignId((current) => {
      const shouldReplace =
        !current ||
        (activeCampaignIdString !== undefined && current !== activeCampaignIdString);
      return shouldReplace ? preferredCampaignId : current;
    });

    if (urlCampaignId !== preferredCampaignId) {
      const params = new URLSearchParams(searchParamsString);
      params.set('campanhaId', preferredCampaignId);
      setSearchParams(params, { replace: true });
    }
  }, [
    campaignsLoading,
    scheduleableCampaigns,
    activeCampaign,
    activeCampaignIdString,
    selectedCampaignIdNumber,
    urlCampaignId,
    searchParamsString,
    setSearchParams,
  ]);

  const hasCampaigns = scheduleableCampaigns.length > 0;
  const selectedCampaign =
    selectedCampaignIdNumber !== undefined
      ? campaigns.find((c) => Number(c.id) === selectedCampaignIdNumber)
      : undefined;
  const selectedCampaignStatus = selectedCampaign
    ? getCampaignStatus(selectedCampaign.data_inicio, selectedCampaign.data_fim)
    : undefined;
  const canRunRaffle =
    Boolean(selectedCampaign) &&
    selectedCampaignStatus !== 'Encerrada' &&
    selectedCampaign?.ativo !== false;

  // Query para buscar próximo sorteio
  const { data: nextSorteioData } = useGraphQLQuery<{
    sorteios: {
      id: string;
      data_sorteio: string;
      campanha_id: number | null;
      campanha: { id: string; Nome: string } | null;
    }[];
  }>(['next-sorteio'], GET_NEXT_SORTEIO);
  const nextSorteio = nextSorteioData?.sorteios[0];

  // Query para buscar cupons da campanha selecionada
  const {
    data: clientesCampanhaData,
    isLoading: participantesLoading,
  } = useGraphQLQuery<{ clientes: ClienteWithCupons[] }>(
    ['campanha-participantes'],
    GET_CLIENTES_WITH_ACTIVE_CUPONS_BY_CAMPANHA
  );

  // Query para buscar ganhadores salvos (da tabela sorteios)
  const { data: ganhadoresData, isLoading: ganhadoresLoading, refetch: refetchGanhadores } = useGraphQLQuery<{
    sorteios: Array<{
      id: string;
      numero_sorteado: string;
      data_sorteio: string;
      ganhador_id: string;
      campanha_id: number;
      cliente: {
        id: string;
        nome: string;
        cpf: string;
        whatsapp: string;
        padaria: {
          id: string;
          nome: string;
        };
      };
      campanha: {
        id: string;
        Nome: string;
      } | null;
    }>
  }>(
    ['ganhadores-salvos'],
    GET_GANHADORES_COM_DADOS_COMPLETOS
  );

  // Mutation para remover cupons do cliente do sorteio
  const { mutate: removerCuponsCliente } = useGraphQLMutation(MARCAR_CUPOM_SORTEADO, {
    invalidateQueries: [['all-cupons-global-sorteio']],
  });

  // Query para buscar padarias
  const { data: padariasData } = useGraphQLQuery<{ padarias: { id: string; nome: string }[] }>(
    ['padarias-sorteio'],
    GET_PADARIAS
  );

  const campaignCoupons = useMemo<CupomSorteio[]>(() => {
    const clientes = clientesCampanhaData?.clientes ?? [];

    return clientes.flatMap((cliente) =>
      (cliente.cupons || []).map((cupom) => ({
        id: cupom.id,
        numero_sorte: cupom.numero_sorte,
        valor_compra: Number(cupom.valor_compra ?? 0),
        data_compra: cupom.data_compra,
        status: cupom.status,
        campanha_id: cupom.campanha_id,
        padaria_id: cupom.padaria_id ?? '',
        padaria: {
          id: cupom.padaria_id ?? '',
          nome: 'Padaria não informada'
        },
        cliente: {
          id: cliente.id,
          nome: cliente.nome ?? null,
          cpf: cliente.cpf ?? null,
          whatsapp: cliente.whatsapp ?? null,
          resposta_pergunta: cliente.resposta_pergunta ?? null,
          padaria: cliente.padaria
            ? { id: cliente.padaria.id, nome: cliente.padaria.nome }
            : null,
        },
      }))
    );
  }, [clientesCampanhaData?.clientes]);

  // Debug logs
  console.log('🔍 Cupons carregados:', campaignCoupons);
  console.log('🔍 Loading state:', participantesLoading);

  // Converter cupons para formato de participantes
  const participants = (campaignCoupons || [])
    .filter(cupom => 
      cupom && 
      cupom.cliente && 
      cupom.padaria &&
      cupom.cliente.nome && 
      cupom.cliente.cpf &&
      cupom.numero_sorte
    ) // Filtrar cupons com dados completos
    .map(cupom => ({
      name: cupom.cliente.nome || 'Nome não informado',
      cpf: `***${(cupom.cliente.cpf || '').slice(-3)}`,
      bakery: cupom.padaria.nome || 'Padaria não informada', // ✅ Usar padaria do cupom
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
      setEditingSorteioId(null);
      setSelectedScheduleCampaignId(selectedCampaignId ?? undefined);
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
      setSelectedScheduleCampaignId(selectedCampaignId ?? undefined);
    },
    onError: () => {
      toast.error('Erro ao atualizar sorteio');
    }
  });

  // Mutation para salvar ganhador (cupom específico + dados completos)
  const { mutate: salvarGanhador, isPending: isMarcandoSorteado } = useGraphQLMutation(SALVAR_GANHADOR, {
    invalidateQueries: [['campanha-participantes'], ['ganhadores-salvos']],
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
    invalidateQueries: [['campanha-participantes'], ['ganhadores-salvos']],
    onSuccess: () => {
      toast.success('Cliente reativado! Voltou para os sorteios.');
      // Força atualização da lista de ganhadores
      refetchGanhadores();
    },
    onError: () => {
      toast.error('Erro ao reativar cupom');
    }
  });

  const {
    mutateAsync: createCampanhaSorteio,
    isPending: isCreatingCampaign,
  } = useGraphQLMutation(CREATE_CAMPANHA, {
    invalidateQueries: [['campanhas']],
    onSuccess: () => {
      toast.success('Campanha criada com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao criar campanha', { description: error.message });
    }
  });

  const {
    mutateAsync: deactivateCampaigns,
    isPending: isDeactivatingCampaign,
  } = useGraphQLMutation(DEACTIVATE_CAMPANHAS, {
    invalidateQueries: [['campanhas']],
    onSuccess: () => {
      toast.success('Campanha anterior desativada.');
    },
    onError: (error) => {
      toast.error('Não foi possível desativar a campanha anterior', { description: error.message });
    }
  });

  const isMutating = isScheduling || isUpdating;

  const handleCampaignDialogSubmit = async (values: CampaignFormValues) => {
    const result = await createCampanhaSorteio({
      obj: {
        Nome: values.Nome,
        data_inicio: values.data_inicio,
        data_fim: values.data_fim,
        ativo: true,
      }
    });

    const newId = (result as { insert_campanha_one?: { id: number | string } } | undefined)?.insert_campanha_one?.id;
    if (newId !== undefined && newId !== null) {
      const newIdString = String(newId);
      setSelectedCampaignId(newIdString);
      setSelectedScheduleCampaignId(newIdString);
      const params = new URLSearchParams(searchParamsString);
      params.set('campanhaId', newIdString);
      setSearchParams(params, { replace: true });
    }
  };

  const handleSchedule = () => {
    if (!selectedDate || !selectedTime) return;
    if (!selectedScheduleCampaignId) {
      toast.error('Selecione uma campanha para o sorteio.');
      return;
    }
    const [hours, minutes] = selectedTime.split(':').map(Number);
    const date = new Date(selectedDate);
    date.setHours(hours);
    date.setMinutes(minutes);

    if (selectedScheduleCampaignIdNumber === undefined) {
      toast.error('Campanha inválida para o sorteio.');
      return;
    }

    if (editingSorteioId) {
      updateSorteio({ id: editingSorteioId, data: date.toISOString(), campanhaId: selectedScheduleCampaignIdNumber });
    } else {
      scheduleSorteio({ id: crypto.randomUUID(), data: date.toISOString(), campanhaId: selectedScheduleCampaignIdNumber });
    }
  };

  const handleEdit = () => {
    if (!nextSorteio) return;
    const date = new Date(nextSorteio.data_sorteio);
    setSelectedDate(date);
    setSelectedTime(format(date, 'HH:mm'));
    setEditingSorteioId(nextSorteio.id);
    setSelectedScheduleCampaignId(
      nextSorteio.campanha_id ? String(nextSorteio.campanha_id) : selectedCampaignId ?? undefined
    );
    setShowScheduleModal(true);
  };

  const handleCampaignSelectChange = (campaignId: string) => {
    setSelectedCampaignId(campaignId);
    setSelectedScheduleCampaignId((current) => current ?? campaignId);
    const params = new URLSearchParams(searchParamsString);
    params.set('campanhaId', campaignId);
    setSearchParams(params, { replace: true });
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
    if (!canRunRaffle) {
      toast.error('Selecione uma campanha ativa para iniciar o sorteio');
      return;
    }
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
        
        // Encontrar o número sorteado com a seguinte lógica:
        // 1. Número exato
        // 2. Número mais próximo ACIMA
        // 3. Número mais próximo ABAIXO (se não houver acima)
        const numeroAlvo = parseInt(numeroDigitado);
        let winnerParticipant: Participant | undefined;
        
        // 1. Tentar encontrar número exato
        winnerParticipant = participants.find(p => parseInt(p.numero_sorte) === numeroAlvo);
        
        // 2. Se não encontrar exato, buscar o mais próximo ACIMA
        if (!winnerParticipant && participants.length > 0) {
          // Buscar números maiores que o alvo
          const numerosAcima = participants
            .filter(p => parseInt(p.numero_sorte) > numeroAlvo)
            .sort((a, b) => parseInt(a.numero_sorte) - parseInt(b.numero_sorte));
          
          if (numerosAcima.length > 0) {
            // Pegar o menor número acima
            winnerParticipant = numerosAcima[0];
            toast.info(`Número exato não encontrado. Selecionado o mais próximo acima: ${winnerParticipant.numero_sorte}`);
          } else {
            // 3. Se não houver números acima, buscar o mais próximo ABAIXO
            const numerosAbaixo = participants
              .filter(p => parseInt(p.numero_sorte) < numeroAlvo)
              .sort((a, b) => parseInt(b.numero_sorte) - parseInt(a.numero_sorte));
            
            if (numerosAbaixo.length > 0) {
              // Pegar o maior número abaixo
              winnerParticipant = numerosAbaixo[0];
              toast.info(`Nenhum número acima encontrado. Selecionado o mais próximo abaixo: ${winnerParticipant.numero_sorte}`);
            }
          }
        }
        
        if (!winnerParticipant) {
          toast.error('Nenhum participante encontrado');
          setIsAnimating(false);
          return;
        }
        
        // Encontrar o cupom original para salvar o ID
        const cupomOriginal = campaignCoupons.find((cupom) => {
          const participanteCpfSuffix = winnerParticipant!.cpf.replace('***', '');
          const normalizedCpf = cupom.cliente?.cpf ?? '';

          return (
            cupom.numero_sorte === winnerParticipant!.numero_sorte &&
            (normalizedCpf.endsWith(participanteCpfSuffix) ||
              (cupom.cliente?.nome || 'Nome não informado') === winnerParticipant!.name)
          );
        });
        
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
    
    // Validar se há campanha selecionada
    if (selectedCampaignIdNumber === undefined) {
      toast.error("Erro: Nenhuma campanha selecionada");
      return;
    }

    console.log('🔍 Salvando ganhador:', {
      cupomId: cupomSorteadoId,
      numeroSorteado: numeroDigitado,
      winner,
      campanhaId: selectedCampaignIdNumber
    });
    
    // Encontrar o cupom específico que ganhou
    const cupomGanhador = campaignCoupons.find(cupom => cupom.id === cupomSorteadoId);
    if (!cupomGanhador || !cupomGanhador.cliente?.id) {
      toast.error("Erro: Cupom ou cliente não encontrado");
      return;
    }
    
    console.log('🔍 Dados do cupom ganhador:', {
      cupom_id: cupomSorteadoId,
      cliente_id: cupomGanhador.cliente.id,
      numero_sorteado: cupomGanhador.numero_sorte,  // Usa numero_sorte do cupom vencedor
      numero_digitado: numeroDigitado,
      campanha_id: selectedCampaignIdNumber
    });
    
    // Salvar o ganhador na tabela sorteios (usa numero_sorte como numero_sorteado)
    salvarGanhador({
      numero_sorteado: cupomGanhador.numero_sorte,  // Salva o numero_sorte do cupom vencedor
      data_sorteio: new Date().toISOString(),
      ganhador_id: cupomGanhador.cliente.id,
      cliente_id: cupomGanhador.cliente.id,
      campanha_id: selectedCampaignIdNumber
    });
    
    // Remover todos os cupons do cliente dos próximos sorteios
    removerCuponsCliente({
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
    if (showLiveRaffle) {
      resetRaffle();
    } else {
      setShowRaffleModal(true);
      resetRaffle();
    }
  };

  const reativarCupomGanhador = (clienteId: string) => {
    reativarCupom({ cliente_id: clienteId });
  };

  const cancelRaffle = () => {
    setShowRaffleModal(false);
    resetRaffle();
  };

  const showWinnerInfo = (winner: Participant) => {
    setSelectedWinner(winner);
    setShowWinnerDetails(true);
  };

  return (
      <div className="space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-primary">Sorteios Digitais</h1>
            <p className="text-sm md:text-base text-muted-foreground">
              Gerencie e execute sorteios da campanha • {participants.length} participantes cadastrados
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 flex-wrap">
            <Button
              variant="outline"
              className="gap-2 w-full sm:w-auto"
              onClick={() => setCampaignDialogOpen(true)}
            >
              <PlusCircle className="w-4 h-4" />
              Criar campanha
            </Button>
            <Button
              onClick={() => {
                setEditingSorteioId(null);
                setSelectedDate(undefined);
                setSelectedTime('');
                setSelectedScheduleCampaignId(selectedCampaignId ?? scheduleableCampaigns[0]?.id ?? undefined);
                setShowScheduleModal(true);
              }}
              className="bg-primary text-primary-foreground hover:bg-primary/90 w-full sm:w-auto"
              disabled={!hasCampaigns || campaignsLoading}
            >
              <CalendarIcon className="w-4 h-4 mr-2" />
              Agendar novo sorteio
            </Button>
            <Button
              onClick={() => {
                if (!canRunRaffle) {
                  toast.error('Selecione uma campanha ativa para iniciar o sorteio');
                  return;
                }
                if (participants.length === 0) {
                  toast.error('Não há participantes para o sorteio');
                  return;
                }
                setShowLiveRaffle(true);
                setTimeout(() => enterFullscreen(), 100);
              }}
              disabled={!canRunRaffle || campaignsLoading}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white w-full sm:w-auto"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Sorteio Ao Vivo
            </Button>
            <Button
              onClick={() => setShowRaffleModal(true)}
              disabled={!canRunRaffle || campaignsLoading}
              className="bg-green-600 hover:bg-green-700 text-white w-full sm:w-auto"
            >
              <Trophy className="w-4 h-4 mr-2" />
              Iniciar Sorteio
            </Button>
          </div>
        </div>

        {!campaignsLoading && !hasCampaigns && (
          <Alert className="border-amber-200 bg-amber-50 text-amber-900">
            <AlertTitle>Atenção</AlertTitle>
            <AlertDescription>Para agendar um sorteio, crie ou selecione uma campanha.</AlertDescription>
          </Alert>
        )}

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
                  <div className="space-y-1">
                    <p className="text-2xl font-bold text-primary">{format(new Date(nextSorteio.data_sorteio), 'dd/MM/yyyy')}</p>
                    <p className="text-sm text-muted-foreground">{format(new Date(nextSorteio.data_sorteio), 'HH:mm')}h</p>
                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                      <Badge variant="outline" className="border-primary/30 text-primary">
                        Campanha
                      </Badge>
                      {nextSorteio.campanha?.Nome || 'Campanha não vinculada'}
                    </p>
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
          <CardContent className="space-y-6">
            <div className="space-y-2 max-w-sm">
              <Label className="text-sm font-medium text-muted-foreground">
                Campanha
              </Label>
              <CampaignSelect
                campaigns={scheduleableCampaigns}
                value={selectedCampaignId}
                onChange={handleCampaignSelectChange}
                placeholder={campaignsLoading ? 'Carregando campanhas...' : 'Selecione uma campanha'}
                disabled={!hasCampaigns || campaignsLoading}
                ariaLabel="Selecionar campanha do sorteio"
              />
              {!hasCampaigns && !campaignsLoading && (
                <p className="text-xs text-muted-foreground">
                  Nenhuma campanha ativa ou encerrada disponível no momento.
                </p>
              )}
            </div>

            {selectedCampaign && (
              <Badge variant="outline" className="border-primary/20 bg-primary/5 text-primary">
                {selectedCampaign.Nome} • {selectedCampaignStatus}
              </Badge>
            )}

            {selectedCampaignStatus === 'Encerrada' && (
              <Alert className="border-amber-200 bg-amber-50 text-amber-900">
                <AlertTitle>Campanha encerrada</AlertTitle>
                <AlertDescription>
                  Novos cupons não podem ser emitidos, mas o sorteio pode acontecer normalmente.
                </AlertDescription>
              </Alert>
            )}

            {participantesLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : participants.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-3">
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary">{participants.length}</div>
                  <div className="text-sm text-muted-foreground">Total de Cupons Participantes</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-secondary">
                    {participants.filter(p => p.answer === "Na Padaria").length}
                  </div>
                  <div className="text-sm text-muted-foreground">Resposta: Na Padaria</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-accent">
                    {participants.filter(p => p.answer === "Outro lugar").length}
                  </div>
                  <div className="text-sm text-muted-foreground">Resposta: Outro lugar</div>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Nenhum cupom encontrado para a campanha selecionada.
              </p>
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
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center mb-4">
              <Input 
                placeholder="Buscar por ganhador..." 
                className="w-full sm:max-w-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <Select value={selectedPadaria} onValueChange={setSelectedPadaria}>
                <SelectTrigger className="w-full sm:w-[200px]">
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
              <div className="overflow-x-auto">
                <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>CPF</TableHead>
                    <TableHead>WhatsApp</TableHead>
                    <TableHead>Nº da Sorte</TableHead>
                    <TableHead>Data do Sorteio</TableHead>
                    <TableHead>Campanha</TableHead>
                    <TableHead>Padaria</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(ganhadoresData?.sorteios || [])
                    .filter(sorteio => {
                      // Filtrar apenas sorteios com cliente válido
                      if (!sorteio?.cliente || !sorteio.cliente.nome) {
                        return false;
                      }
                      
                      const matchesSearch = !searchTerm || 
                        sorteio.cliente.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        (sorteio.cliente.cpf && sorteio.cliente.cpf.includes(searchTerm)) ||
                        (sorteio.cliente.whatsapp && sorteio.cliente.whatsapp.includes(searchTerm));
                      
                      const matchesPadaria = selectedPadaria === "all" || 
                        sorteio.cliente?.padaria?.id === selectedPadaria;
                      
                      return matchesSearch && matchesPadaria;
                    })
                    .map((sorteio) => (
                      <TableRow key={sorteio.id}>
                        <TableCell className="font-medium">{sorteio.cliente?.nome || 'N/A'}</TableCell>
                        <TableCell>{sorteio.cliente?.cpf || 'N/A'}</TableCell>
                        <TableCell>{sorteio.cliente?.whatsapp || 'N/A'}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-primary border-primary font-mono">
                            {sorteio.numero_sorteado || 'N/A'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {sorteio.data_sorteio ? 
                            format(new Date(sorteio.data_sorteio), 'dd/MM/yyyy HH:mm') : 
                            'N/A'
                          }
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-primary border-primary/30">
                            {sorteio.campanha?.Nome || 'N/A'}
                          </Badge>
                        </TableCell>
                        <TableCell>{sorteio.cliente?.padaria?.nome || 'N/A'}</TableCell>
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
              </div>
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
              setSelectedScheduleCampaignId(selectedCampaignId ?? undefined);
            }
          }}
        >
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>{editingSorteioId ? 'Editar Sorteio' : 'Agendar Sorteio'}</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col gap-4 py-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-muted-foreground">Campanha</Label>
                <CampaignSelect
                  campaigns={scheduleableCampaigns}
                  value={selectedScheduleCampaignId}
                  onChange={setSelectedScheduleCampaignId}
                  placeholder={hasCampaigns ? 'Selecione uma campanha' : 'Nenhuma campanha disponível'}
                  disabled={!hasCampaigns}
                  ariaLabel="Selecionar campanha para agendamento"
                />
              </div>
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

        <CampaignFormDialog
          open={campaignDialogOpen}
          onOpenChange={(open) => setCampaignDialogOpen(open)}
          onSubmit={handleCampaignDialogSubmit}
          existingCampaigns={campaigns}
          initialData={null}
          isSubmitting={isCreatingCampaign || isDeactivatingCampaign}
          onResolveConflicts={async ({ conflicts }) => {
            const activeCampaignIds = conflicts.overlaps
              .filter((campaign) => campaign.ativo)
              .map((campaign) => campaign.id);

            if (activeCampaignIds.length === 0) {
              return true;
            }

            await deactivateCampaigns({ ids: activeCampaignIds });
            return true;
          }}
        />

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
                              winner.answer === "Na Padaria" 
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

        {/* Live Raffle Fullscreen Modal */}
        {showLiveRaffle && (
          <div className="fixed inset-0 z-[100] bg-gradient-to-br from-purple-900 via-pink-900 to-blue-900 animate-gradient-shift overflow-auto">
            {/* Animated Background */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              {/* Floating particles */}
              {Array.from({ length: 30 }).map((_, i) => (
                <div
                  key={`particle-${i}`}
                  className="absolute w-2 h-2 bg-white/30 rounded-full animate-float"
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                    animationDelay: `${Math.random() * 5}s`,
                    animationDuration: `${3 + Math.random() * 4}s`,
                  }}
                />
              ))}
              
              {/* Animated gradient orbs */}
              <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/30 rounded-full blur-3xl animate-pulse" />
              <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-pink-500/30 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
              <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
            </div>

            {/* Content */}
            <div className="relative z-10 min-h-screen flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between p-8 sticky top-0 bg-gradient-to-b from-black/20 to-transparent backdrop-blur-sm z-20">
                <div className="flex items-center gap-4">
                  <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                  <span className="text-white/90 text-lg font-semibold uppercase tracking-wider">
                    Sorteio Ao Vivo
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    exitFullscreen();
                    setShowLiveRaffle(false);
                    resetRaffle();
                  }}
                  className="text-white hover:bg-white/20 rounded-full"
                >
                  <X className="w-6 h-6" />
                </Button>
              </div>

              {/* Main Content */}
              <div className="flex-1 flex flex-col items-center justify-center px-8 py-12">
                {/* Logo/Title */}
                <div className="mb-12 text-center">
                  <h1 className="text-7xl font-black text-white mb-4 drop-shadow-2xl animate-fade-in">
                    SINDPAN
                  </h1>
                  <p className="text-2xl text-white/80 font-light tracking-widest uppercase">
                    Sorteio Digital
                  </p>
                </div>

                {/* Input para número (antes do sorteio) */}
                {!isAnimating && !showResult && countdown === 0 && (
                  <div className="mb-12 w-full max-w-2xl animate-fade-in">
                    <label className="block text-white text-xl font-semibold text-center mb-6">
                      Digite o número do sorteio
                    </label>
                    <Input 
                      type="number"
                      placeholder="00000"
                      value={numeroDigitado}
                      onChange={(e) => setNumeroDigitado(e.target.value)}
                      className="text-center text-6xl font-mono h-24 bg-white/10 border-white/30 text-white placeholder:text-white/40 backdrop-blur-lg"
                      maxLength={5}
                    />
                    <p className="text-white/70 text-center mt-4 text-lg">
                      O sistema buscará o número exato ou o mais próximo
                    </p>
                  </div>
                )}

                {/* Countdown */}
                {countdown > 0 && (
                  <div className="mb-12 animate-bounce-in">
                    <div className="text-[20rem] font-black text-white drop-shadow-2xl animate-pulse leading-none">
                      {countdown}
                    </div>
                  </div>
                )}

                {/* Number Display */}
                {(isAnimating || showResult) && (
                  <div className="mb-12 animate-scale-in">
                    {/* Number Container */}
                    <div className={`relative ${isAnimating ? 'animate-shake' : ''}`}>
                      {/* Glow effect */}
                      <div className="absolute inset-0 bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 blur-3xl opacity-50 animate-pulse" />
                      
                      {/* Number Box */}
                      <div className={`relative bg-white/10 backdrop-blur-xl rounded-3xl border-4 p-12 transition-all duration-500 ${
                        isAnimating 
                          ? 'border-white/50 shadow-2xl' 
                          : 'border-yellow-400 shadow-[0_0_100px_rgba(250,204,21,0.8)]'
                      }`}>
                        <div className={`text-[12rem] font-black font-mono text-white leading-none tracking-wider ${
                          !isAnimating && 'animate-bounce'
                        }`}>
                          {currentNumber}
                        </div>
                      </div>
                    </div>

                    {/* Winner Card */}
                    {showResult && winner && (
                      <div className="mt-12 animate-slide-up">
                        <Card className="bg-gradient-to-br from-yellow-400 to-orange-500 border-4 border-white/50 shadow-2xl max-w-2xl">
                          <CardHeader className="text-center pb-4">
                            <div className="flex items-center justify-center gap-3 mb-2">
                              <Trophy className="w-12 h-12 text-white drop-shadow-lg" />
                              <CardTitle className="text-5xl font-black text-white drop-shadow-lg">
                                GANHADOR!
                              </CardTitle>
                              <Trophy className="w-12 h-12 text-white drop-shadow-lg" />
                            </div>
                          </CardHeader>
                          <CardContent className="text-center space-y-4 px-12 pb-8">
                            <div className="bg-white/20 backdrop-blur-lg rounded-2xl p-6">
                              <p className="text-4xl font-bold text-white mb-2">{winner.name}</p>
                              <p className="text-2xl text-white/90 font-mono">CPF: {winner.cpf}</p>
                            </div>
                            <div className="bg-white/20 backdrop-blur-lg rounded-2xl p-4">
                              <p className="text-2xl font-semibold text-white">{winner.bakery}</p>
                            </div>
                            {winner.answer && (
                              <div className="flex justify-center">
                                <Badge 
                                  className={`text-xl px-6 py-2 ${
                                    winner.answer === "Na Padaria" 
                                      ? "bg-green-600 text-white" 
                                      : "bg-blue-600 text-white"
                                  }`}
                                >
                                  {winner.answer}
                                </Badge>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      </div>
                    )}
                  </div>
                )}

                {/* Confetti Effect */}
                {showConfetti && (
                  <div className="fixed inset-0 pointer-events-none overflow-hidden z-50">
                    {Array.from({ length: 100 }).map((_, i) => (
                      <div
                        key={`confetti-${i}`}
                        className="absolute animate-confetti"
                        style={{
                          left: `${Math.random() * 100}%`,
                          top: `-10%`,
                          animationDelay: `${Math.random() * 2}s`,
                          animationDuration: `${2 + Math.random() * 2}s`,
                        }}
                      >
                        <div
                          className={`w-3 h-3 ${
                            i % 5 === 0 ? 'bg-yellow-400' :
                            i % 5 === 1 ? 'bg-pink-400' :
                            i % 5 === 2 ? 'bg-purple-400' :
                            i % 5 === 3 ? 'bg-blue-400' :
                            'bg-green-400'
                          } rotate-45`}
                        />
                      </div>
                    ))}
                  </div>
                )}

                {/* Action Buttons */}
                {!isAnimating && !showResult && countdown === 0 && (
                  <Button 
                    onClick={startRaffle}
                    size="lg"
                    className="text-3xl px-16 py-10 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-2xl rounded-2xl animate-pulse-slow"
                  >
                    <Trophy className="w-10 h-10 mr-4" />
                    INICIAR SORTEIO
                  </Button>
                )}

                {showResult && (
                  <div className="flex gap-6 mt-8 animate-fade-in">
                    <Button 
                      onClick={saveResult} 
                      size="lg"
                      className="text-2xl px-12 py-8 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-2xl rounded-2xl"
                      disabled={isMarcandoSorteado}
                    >
                      <Save className="w-8 h-8 mr-3" />
                      {isMarcandoSorteado ? "SALVANDO..." : "SALVAR RESULTADO"}
                    </Button>
                    <Button 
                      onClick={continuarSorteio}
                      size="lg"
                      className="text-2xl px-12 py-8 bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white shadow-2xl rounded-2xl"
                    >
                      <Trophy className="w-8 h-8 mr-3" />
                      CONTINUAR
                    </Button>
                    <Button 
                      onClick={resetRaffle}
                      size="lg"
                      variant="outline"
                      className="text-2xl px-12 py-8 bg-white/10 backdrop-blur-lg text-white border-white/30 hover:bg-white/20 shadow-2xl rounded-2xl"
                    >
                      <RotateCcw className="w-8 h-8 mr-3" />
                      REFAZER
                    </Button>
                  </div>
                )}
              </div>

              {/* Footer Info */}
              <div className="p-8 text-center">
                <p className="text-white/60 text-lg">
                  {participants.length} participantes • Sorteio válido e auditado
                </p>
              </div>
            </div>

            {/* Custom CSS for animations */}
            <style>{`
              @keyframes gradient-shift {
                0%, 100% { background-position: 0% 50%; }
                50% { background-position: 100% 50%; }
              }
              @keyframes float {
                0%, 100% { transform: translateY(0) translateX(0); opacity: 0.3; }
                50% { transform: translateY(-100px) translateX(50px); opacity: 0.8; }
              }
              @keyframes confetti {
                0% { transform: translateY(0) rotate(0deg); opacity: 1; }
                100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
              }
              @keyframes fade-in {
                from { opacity: 0; transform: translateY(20px); }
                to { opacity: 1; transform: translateY(0); }
              }
              @keyframes scale-in {
                from { opacity: 0; transform: scale(0.8); }
                to { opacity: 1; transform: scale(1); }
              }
              @keyframes slide-up {
                from { opacity: 0; transform: translateY(50px); }
                to { opacity: 1; transform: translateY(0); }
              }
              @keyframes bounce-in {
                0% { opacity: 0; transform: scale(0.3); }
                50% { transform: scale(1.1); }
                100% { opacity: 1; transform: scale(1); }
              }
              @keyframes shake {
                0%, 100% { transform: translateX(0); }
                10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
                20%, 40%, 60%, 80% { transform: translateX(5px); }
              }
              @keyframes pulse-slow {
                0%, 100% { transform: scale(1); opacity: 1; }
                50% { transform: scale(1.05); opacity: 0.9; }
              }
              .animate-gradient-shift {
                background-size: 400% 400%;
                animation: gradient-shift 15s ease infinite;
              }
              .animate-float {
                animation: float linear infinite;
              }
              .animate-confetti {
                animation: confetti linear forwards;
              }
              .animate-fade-in {
                animation: fade-in 0.8s ease-out forwards;
              }
              .animate-scale-in {
                animation: scale-in 0.8s ease-out forwards;
              }
              .animate-slide-up {
                animation: slide-up 0.8s ease-out forwards;
              }
              .animate-bounce-in {
                animation: bounce-in 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55) forwards;
              }
              .animate-shake {
                animation: shake 0.2s ease-in-out infinite;
              }
              .animate-pulse-slow {
                animation: pulse-slow 2s ease-in-out infinite;
              }
            `}</style>
          </div>
        )}
      </div>
  );
}