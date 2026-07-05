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
import { GET_NEXT_SORTEIO, SCHEDULE_SORTEIO, UPDATE_SORTEIO, GET_CLIENTES_WITH_ACTIVE_CUPONS_BY_CAMPANHA, GET_GANHADORES_COM_DADOS_COMPLETOS, SALVAR_GANHADOR, MARCAR_CUPOM_SORTEADO, MARCAR_CUPOM_ESPECIFICO_SORTEADO, REATIVAR_CUPOM, REATIVAR_CUPOM_ESPECIFICO, REATIVAR_TODOS_CUPONS_CLIENTE, REATIVAR_TODOS_CUPONS_SORTEADOS, GET_PADARIAS, LIST_CAMPANHAS, CREATE_CAMPANHA, DEACTIVATE_CAMPANHAS } from "@/graphql/queries";
import { toast } from "sonner";
import { format } from "date-fns";
import { Trophy, Calendar as CalendarIcon, X, Save, RotateCcw, Sparkles, Clock, Pencil, PlusCircle } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useState, useEffect, useMemo } from "react";
import { CampaignSelect } from "@/components/CampaignSelect";
import { CampaignFormDialog, type CampaignFormValues } from "@/components/CampaignFormDialog";
import { getCampaignStatus } from "@/components/CampaignStatusBadge";

// Interface para cupom do sorteio (API)
interface CupomSorteio {
  id: string;
  numero_sorte: string;
  serie: number;
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
    serie: number;
    valor_compra: string | number | null;
    data_compra: string;
    status: string;
    campanha_id: number;
    padaria_id?: string | null;
  }>;
}

// Interface para a UI (Participante)
interface Participant {
  name: string;
  cpf: string;
  bakery: string;
  answer: string | null;
  numero_sorte: string;
  serie: number;
  valor_compra: number;
  data_compra: string;
}


interface FixedLiveWinner extends Participant {
  displayNumber: string;
  prizeLabel: string;
  group: 'Ganhador' | 'Reserva';
}

const FIXED_LIVE_RAFFLE_WINNERS: FixedLiveWinner[] = [
  { name: 'Alex Henrique Fontenele Da Rocha', displayNumber: '4/64244', numero_sorte: '64244', serie: 4, bakery: 'Donata Parquelandia', prizeLabel: '1º Ganhador', group: 'Ganhador', cpf: '', answer: null, valor_compra: 0, data_compra: '' },
  { name: 'Izabel Cristina Torres Pinheiro', displayNumber: '4/64264', numero_sorte: '64264', serie: 4, bakery: 'Doce Trigo', prizeLabel: '2º Ganhador', group: 'Ganhador', cpf: '', answer: null, valor_compra: 0, data_compra: '' },
  { name: 'Marcos Valério Araújo Vieira', displayNumber: '4/64278', numero_sorte: '64278', serie: 4, bakery: 'Padaria Portugália', prizeLabel: '3º Ganhador', group: 'Ganhador', cpf: '', answer: null, valor_compra: 0, data_compra: '' },
  { name: 'Nathalia dos Anjos Meireles', displayNumber: '4/64286', numero_sorte: '64286', serie: 4, bakery: 'Padaria Costa Mendes Aldeota', prizeLabel: '4º Ganhador', group: 'Ganhador', cpf: '', answer: null, valor_compra: 0, data_compra: '' },
  { name: 'Nailson Fernandes da Cunha', displayNumber: '4/64347', numero_sorte: '64347', serie: 4, bakery: 'Padaria MM', prizeLabel: '5º Ganhador', group: 'Ganhador', cpf: '', answer: null, valor_compra: 0, data_compra: '' },
  { name: 'João Davi Marinho da Silva', displayNumber: '4/64359', numero_sorte: '64359', serie: 4, bakery: 'Padaria MM', prizeLabel: '1º Reserva', group: 'Reserva', cpf: '', answer: null, valor_compra: 0, data_compra: '' },
  { name: 'IVONE ROSANA FEDEL', displayNumber: '4/64418', numero_sorte: '64418', serie: 4, bakery: 'Padaria Portugália', prizeLabel: '2º Reserva', group: 'Reserva', cpf: '', answer: null, valor_compra: 0, data_compra: '' },
  { name: 'Andréa Flávia Barbosa Silva', displayNumber: '4/64476', numero_sorte: '64476', serie: 4, bakery: 'MONTMARTTRE', prizeLabel: '3º Reserva', group: 'Reserva', cpf: '', answer: null, valor_compra: 0, data_compra: '' },
  { name: 'Sonia Maria Alves Sobreira', displayNumber: '4/64528', numero_sorte: '64528', serie: 4, bakery: 'Empório Mais Paes', prizeLabel: '4º Reserva', group: 'Reserva', cpf: '', answer: null, valor_compra: 0, data_compra: '' },
  { name: 'Francisco José Antonio Ribeiro Neto', displayNumber: '4/64562', numero_sorte: '64562', serie: 4, bakery: 'Empório Mais Paes', prizeLabel: '5º Reserva', group: 'Reserva', cpf: '', answer: null, valor_compra: 0, data_compra: '' },
];

const getFixedWinnerMeta = (participant: Participant | null) => {
  if (!participant) return undefined;
  return FIXED_LIVE_RAFFLE_WINNERS.find(
    (fixedWinner) => fixedWinner.name === participant.name && fixedWinner.numero_sorte === participant.numero_sorte
  );
};

// --- INÍCIO DA LÓGICA DE SORTEIO PURA (REGRAS DE NEGÓCIO) ---

/**
 * Interface de Cupom normalizada para a lógica de negócio.
 */
interface Cupom {
  id: string;
  numero: number;
  serie: number; // 1-10 (10 é a série 0 da loteria)
  clienteId: string;
  status: 'ativo' | 'usado_sorteio';
}

/**
 * Interface do Resultado do sorteio.
 */
interface ResultadoSorteio {
  cupomId: string;
  numero: number;
  serie: number;
  clienteId: string;
}

const SERIES_VALIDAS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

/**
 * Converte a série da loteria (0-9) para a série do banco (1-10).
 */
const converterSerieLoteriaParaBanco = (serieLoteria: number): number => {
  return serieLoteria === 0 ? 10 : serieLoteria;
};

/**
 * Formata um cupom para a estrutura de resultado.
 */
const formatarResultado = (cupom: Cupom): ResultadoSorteio => ({
  cupomId: cupom.id,
  numero: cupom.numero,
  serie: cupom.serie,
  clienteId: cupom.clienteId,
});

/**
 * Encontra o primeiro ganhador (Prêmio 1) seguindo as regras de aproximação.
 */
function buscarPrimeiroGanhador(
  numeroInicial: number,
  serieInicialBanco: number,
  cuponsElegiveis: Cupom[],
  serieUnica: boolean,
): Cupom | null {
  
  // 1. Buscar número exato na série inicial
  const ganhador = cuponsElegiveis.find(
    (c) => c.serie === serieInicialBanco && c.numero === numeroInicial,
  );
  if (ganhador) return ganhador;

  // 2. Buscar número mais próximo na série inicial
  const cuponsNaSerie = cuponsElegiveis
    .filter((c) => c.serie === serieInicialBanco)
    .sort((a, b) => {
      const diffA = Math.abs(a.numero - numeroInicial);
      const diffB = Math.abs(b.numero - numeroInicial);
      // Critério de desempate: menor número
      if (diffA === diffB) return a.numero - b.numero;
      return diffA - diffB;
    });

  if (cuponsNaSerie.length > 0) {
    return cuponsNaSerie[0];
  }
  
  // 3. Buscar número exato nas próximas séries (se !serieUnica)
  if (!serieUnica) {
    const indiceInicial = SERIES_VALIDAS.indexOf(serieInicialBanco);
    for (let i = 1; i < SERIES_VALIDAS.length; i++) {
      const proximaSerie = SERIES_VALIDAS[(indiceInicial + i) % SERIES_VALIDAS.length];
      const cupomNaProximaSerie = cuponsElegiveis.find(
        (c) => c.serie === proximaSerie && c.numero === numeroInicial,
      );
      if (cupomNaProximaSerie) {
        return cupomNaProximaSerie;
      }
    }
  }

  // 4. Buscar número mais próximo global (independente de série)
  const cuponsGlobais = [...cuponsElegiveis].sort((a, b) => {
    const diffA = Math.abs(a.numero - numeroInicial);
    const diffB = Math.abs(b.numero - numeroInicial);
    if (diffA === diffB) return a.numero - b.numero;
    return diffA - diffB;
  });
  
  return cuponsGlobais[0] || null;
}

/**
 * Encontra os ganhadores automáticos (Prêmios 2-5).
 */
function buscarProximoGanhador(
  numeroBase: number,
  serieBase: number,
  cuponsElegiveis: Cupom[],
  serieUnica: boolean,
): Cupom | null {
  
  // 1. Próximo número mais alto na MESMA série
  const cuponsMaioresNaSerie = cuponsElegiveis
    .filter((c) => c.serie === serieBase && c.numero > numeroBase)
    .sort((a, b) => a.numero - b.numero);

  if (cuponsMaioresNaSerie.length > 0) {
    return cuponsMaioresNaSerie[0];
  }

  // 2. Próximo (qualquer) na PRÓXIMA série (circular, se !serieUnica)
  if (!serieUnica) {
    const indiceAtual = SERIES_VALIDAS.indexOf(serieBase);
    for (let j = 1; j < SERIES_VALIDAS.length; j++) {
      const proximaSerie = SERIES_VALIDAS[(indiceAtual + j) % SERIES_VALIDAS.length];
      const cuponsNaProximaSerie = cuponsElegiveis
        .filter((c) => c.serie === proximaSerie)
        .sort((a, b) => a.numero - b.numero); // Pega o menor número da próxima série

      if (cuponsNaProximaSerie.length > 0) {
        return cuponsNaProximaSerie[0];
      }
    }
  }
  
  // 3. Próximo número mais alto GLOBAL (independente da série)
  const cuponsMaioresGlobais = cuponsElegiveis
    .filter((c) => c.numero > numeroBase)
    .sort((a, b) => a.numero - b.numero);

  if (cuponsMaioresGlobais.length > 0) {
    return cuponsMaioresGlobais[0];
  }

  // 4. Fallback: Se não houver nenhum número MAIOR, 
  // pega o menor número disponível global para garantir o prêmio.
  if (cuponsElegiveis.length > 0) {
    return [...cuponsElegiveis].sort((a, b) => a.numero - b.numero)[0];
  }

  return null;
}

/**
 * Executa o sorteio completo e retorna os 5 ganhadores.
 * @param numeroInicial Número (00000-99999) digitado.
 * @param serieInicialLoteria Série da loteria (0-9) digitada.
 * @param cupons Lista de TODOS os cupons da campanha.
 * @param serieUnica Flag para restringir busca à série inicial.
 * @returns Lista de até 5 resultados do sorteio.
 */
export function executarSorteio(
  numeroInicial: number,
  serieInicialLoteria: number,
  cupons: Cupom[],
  serieUnica: boolean = false
): ResultadoSorteio[] {
  
  const resultados: ResultadoSorteio[] = [];
  const clientesGanhadores = new Set<string>();

  // Helper interno para verificar elegibilidade
  const isCupomElegivel = (cupom: Cupom): boolean => {
    // A restrição crucial: status 'ativo' E clienteId não pode estar no Set
    return cupom.status === 'ativo' && !clientesGanhadores.has(cupom.clienteId);
  };

  const serieInicialBanco = converterSerieLoteriaParaBanco(serieInicialLoteria);
  
  // --- Prêmio 1 ---
  let cuponsElegiveis = cupons.filter(isCupomElegivel);
  if (cuponsElegiveis.length === 0) {
    return []; // Sorteio impossível, nenhum cupom elegível
  }

  const primeiroGanhador = buscarPrimeiroGanhador(
    numeroInicial,
    serieInicialBanco,
    cuponsElegiveis,
    serieUnica
  );

  if (!primeiroGanhador) {
    return []; // Sorteio impossível, regra 1 falhou em encontrar qualquer cupom
  }

  // Adiciona Ganhador 1
  resultados.push(formatarResultado(primeiroGanhador));
  clientesGanhadores.add(primeiroGanhador.clienteId); // Regra de restrição

  let numeroBase = primeiroGanhador.numero;
  let serieBase = primeiroGanhador.serie;

  // --- Prêmios 2 ao 5 ---
  for (let i = 1; i < 5; i++) {
    // A lista de elegíveis DEVE ser recalculada a cada iteração
    cuponsElegiveis = cupons.filter(isCupomElegivel);
    if (cuponsElegiveis.length === 0) {
      break; // Não há mais cupons elegíveis no banco
    }

    const proximoGanhador = buscarProximoGanhador(
      numeroBase,
      serieBase,
      cuponsElegiveis,
      serieUnica
    );
    
    if (proximoGanhador) {
      resultados.push(formatarResultado(proximoGanhador));
      clientesGanhadores.add(proximoGanhador.clienteId); // Regra de restrição
      
      // Atualiza a base para a próxima busca
      numeroBase = proximoGanhador.numero;
      serieBase = proximoGanhador.serie;
    } else {
      break; // Não foram encontrados mais ganhadores
    }
  }

  return resultados;
}

// --- FIM DA LÓGICA DE SORTEIO PURA ---


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
  const [serieDigitada, setSerieDigitada] = useState<string>("");
  
  // Debounced values para melhor performance
  const [numeroDebounced, setNumeroDebounced] = useState<string>("");
  const [serieDebounced, setSerieDebounced] = useState<string>("");
  const [showLiveRaffle, setShowLiveRaffle] = useState(false);
  const [fixedLiveRaffleMode, setFixedLiveRaffleMode] = useState(false);
  const [campaignDialogOpen, setCampaignDialogOpen] = useState(false);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | undefined>(urlCampaignId);
  const [selectedScheduleCampaignId, setSelectedScheduleCampaignId] = useState<string | undefined>(urlCampaignId);
  
  // Estados para controle do sorteio automático
  const [sorteioAutomatico, setSorteioAutomatico] = useState(false);
  const [numeroAtual, setNumeroAtual] = useState<string>("");
  const [serieAtual, setSerieAtual] = useState<string>("");
  const [ganhadoresSorteio, setGanhadoresSorteio] = useState<Participant[]>([]); // Mantém os *revelados*
  const [sorteioUnicaSerie, setSorteioUnicaSerie] = useState(true);

  // === NOVO ESTADO ===
  // Armazena a lista pura dos 5 ganhadores calculados no início.
  const [resultadosCalculados, setResultadosCalculados] = useState<ResultadoSorteio[]>([]);

  // Debouncing para inputs
  useEffect(() => {
    const timer = setTimeout(() => {
      setNumeroDebounced(numeroDigitado);
    }, 300);
    return () => clearTimeout(timer);
  }, [numeroDigitado]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSerieDebounced(serieDigitada);
    }, 300);
    return () => clearTimeout(timer);
  }, [serieDigitada]);

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

  // Query para buscar TODOS os cupons ativos (sem filtro de campanha)
  // Sempre busca todos os cupons ativos, independente de campanha selecionada
  const {
    data: clientesCampanhaData,
    isLoading: participantesLoading,
    refetch: refetchClientesCampanha,
  } = useGraphQLQuery<{ clientes: ClienteWithCupons[] }>(
    ['all-active-cupons'], // Chave estática para buscar todos
    GET_CLIENTES_WITH_ACTIVE_CUPONS_BY_CAMPANHA,
    undefined, // Sem variáveis - busca todos os cupons ativos
    {
      enabled: true, // Sempre habilitado - busca todos os cupons ativos independente de campanha
    }
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
        cupons: Array<{
          id: string;
          status: string;
        }>;
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
        serie: cupom.serie,
        valor_compra: Number(cupom.valor_compra ?? 0),
        data_compra: cupom.data_compra,
        status: cupom.status,
        campanha_id: cupom.campanha_id,
     
        padaria_id: cupom.padaria_id ?? '',
        padaria: cliente.padaria
          ? { id: cliente.padaria.id, nome: cliente.padaria.nome }
          : { id: cupom.padaria_id ?? '', nome: 'Padaria não informada' },
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

  // === NOVO useMemo ===
  /**
   * Converte os cupons da API (CupomSorteio) para a interface pura (Cupom)
   * que a função `executarSorteio` espera.
   */
  const cuponsParaSorteio = useMemo((): Cupom[] => {
    return campaignCoupons.map(cupomApi => ({
      id: cupomApi.id,
      // Converte a string 'numero_sorte' para 'numero' number
      numero: parseInt(cupomApi.numero_sorte),
      serie: cupomApi.serie, // API já fornece 1-10
      // Pega o ID do cliente, não o nome
      clienteId: cupomApi.cliente.id,
      // Normaliza o status
      status: cupomApi.status === 'ativo' ? 'ativo' : 'usado_sorteio'
    }));
  }, [campaignCoupons]);


  // useEffect para refazer a query após cada sorteio
  useEffect(() => {
    if (ganhadoresSorteio.length > 0) {
      console.log(`🔄 Refazendo query após sorteio ${ganhadoresSorteio.length}`);
      refetchClientesCampanha();
    }
  }, [ganhadoresSorteio.length, refetchClientesCampanha]);

  // Debug logs
  console.log('🔍 Cupons carregados:', campaignCoupons);
  console.log('🔍 Loading state:', participantesLoading);

  // === useMemo: Filtrar apenas ganhadores que têm cupom com status 'usado_sorteio' ===
  const ganhadoresSalvosFiltrados = useMemo(() => {
    if (!ganhadoresData?.sorteios) {
      return [];
    }

    // Filtra apenas ganhadores que têm pelo menos um cupom com status 'usado_sorteio'
    const filtrados = ganhadoresData.sorteios.filter(sorteio => {
      // Verifica se o cliente tem algum cupom com status 'usado_sorteio'
      const temCupomUsado = sorteio.cliente?.cupons && sorteio.cliente.cupons.length > 0;
      return temCupomUsado;
    });
    
    // Remove duplicatas: mantém apenas o primeiro sorteio de cada cliente
    const seen = new Set<string>();
    const unicos = filtrados.filter(sorteio => {
      const clienteId = sorteio.cliente?.id;
      if (!clienteId || seen.has(clienteId)) {
        return false;
      }
      seen.add(clienteId);
      return true;
    });
    
    console.log('🔍 Total de ganhadores:', ganhadoresData.sorteios.length);
    console.log('🔍 Ganhadores com cupom usado_sorteio:', filtrados.length);
    console.log('🔍 Ganhadores únicos (sem duplicatas):', unicos.length);
    
    return unicos;
  }, [ganhadoresData?.sorteios]);

  // Converter cupons para formato de participantes (para UI)
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
      serie: cupom.serie || 1,
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
  // Mutation para marcar cupom específico como usado no sorteio
  const { mutate: marcarCupomSorteado } = useGraphQLMutation(MARCAR_CUPOM_ESPECIFICO_SORTEADO, {
    invalidateQueries: [['campanha-participantes']],
    onSuccess: () => {
      console.log('✅ Cupom marcado como usado no sorteio');
    },
    onError: (error) => {
      console.error('❌ Erro ao marcar cupom como usado:', error);
    }
  });
  // Mutation para reativar cupom específico
  const { mutate: reativarCupomEspecifico } = useGraphQLMutation(REATIVAR_CUPOM_ESPECIFICO, {
    invalidateQueries: [['campanha-participantes']],
    onSuccess: () => {
      toast.success('Cupom reativado com sucesso!');
    },
    onError: (error) => {
      console.error('Erro ao reativar cupom:', error);
      toast.error('Erro ao reativar cupom');
    }
  });
  // Mutation para reativar todos os cupons de um cliente
  const { mutate: reativarTodosCuponsCliente } = useGraphQLMutation(REATIVAR_TODOS_CUPONS_CLIENTE, {
    invalidateQueries: [['campanha-participantes'], ['ganhadores-salvos']],
    onSuccess: async () => {
      toast.success('Todos os cupons do cliente foram reativados!');
      // Aguarda um pouco para garantir que a mutation foi processada
      await new Promise(resolve => setTimeout(resolve, 300));
      // Refetch para atualizar as listas
      await refetchClientesCampanha();
      await refetchGanhadores();
    },
    onError: (error) => {
      console.error('Erro ao reativar cupons do cliente:', error);
      toast.error('Erro ao reativar cupons do cliente');
    }
  });
  // Mutation para reativar todos os cupons sorteados
  const { mutate: reativarTodosCuponsSorteados } = useGraphQLMutation(REATIVAR_TODOS_CUPONS_SORTEADOS, {
    invalidateQueries: [['campanha-participantes'], ['ganhadores-salvos']],
    onSuccess: async () => {
      toast.success('Todos os cupons sorteados foram reativados!');
      // Aguarda um pouco para garantir que a mutation foi processada
      await new Promise(resolve => setTimeout(resolve, 300));
      // Refetch para atualizar as listas
      await refetchClientesCampanha();
      await refetchGanhadores();
    },
    onError: (error) => {
      console.error('Erro ao reativar todos os cupons:', error);
      toast.error('Erro ao reativar todos os cupons');
    }
  });
  // Mutation para reativar cupom
  const { mutate: reativarCupom, isPending: isReativando } = useGraphQLMutation(REATIVAR_CUPOM, {
    invalidateQueries: [['campanha-participantes'], ['ganhadores-salvos']],
    onSuccess: async () => {
      toast.success('Cliente reativado! Voltou para os sorteios.');
      // Aguarda um pouco para garantir que a mutation foi processada
      await new Promise(resolve => setTimeout(resolve, 300));
      // Refetch para atualizar as listas
      await refetchClientesCampanha();
      await refetchGanhadores();
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
      selectedCampaignId ?? undefined
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
  
  // Helper mantido apenas para a UI (exibir série 0)
  const converterSerieBancoParaLoteria = (serieBanco: number): number => {
    return serieBanco === 10 ? 0 : serieBanco;
  };

  // Memoizar números de sorte para melhor performance
  const numerosSorteMemo = useMemo(() => {
    if (fixedLiveRaffleMode) {
      return FIXED_LIVE_RAFFLE_WINNERS.map((fixedWinner) => fixedWinner.displayNumber);
    }
    return participants.map(p => p.numero_sorte);
  }, [fixedLiveRaffleMode, participants]);

  const generateRandomNumber = () => {
    // Usar números de sorte reais dos cupons (memoizados)
    if (numerosSorteMemo.length > 0) {
      const randomIndex = Math.floor(Math.random() * numerosSorteMemo.length);
      return numerosSorteMemo[randomIndex];
    }
    return Math.floor(Math.random() * 100000).toString().padStart(5, '0');
  };

  /**
   * === REFEITO: startRaffle ===
   * Valida os inputs, executa a lógica pura UMA VEZ e inicia a animação.
   */
  const startRaffle = () => {
    console.log('🔍 Debug startRaffle:', {
      selectedCampaignId,
      selectedCampaignIdNumber,
      participantsLength: participants.length,
      campaignCouponsLength: campaignCoupons.length,
      cuponsParaSorteioLength: cuponsParaSorteio.length,
      participantesLoading,
      clientesCampanhaData: clientesCampanhaData?.clientes?.length || 0,
      cuponsAtivos: cuponsParaSorteio.filter(c => c.status === 'ativo').length
    });
    
    if (fixedLiveRaffleMode || showLiveRaffle) {
      if (!numeroDigitado || numeroDigitado.trim() === '') {
        toast.error('Digite um número para criar suspense antes da revelação');
        return;
      }

      if (!serieDigitada || serieDigitada.trim() === '') {
        toast.error('Digite a série antes da revelação');
        return;
      }

      const serieFixa = parseInt(serieDigitada);
      if (isNaN(serieFixa) || serieFixa < 0 || serieFixa > 9) {
        toast.error('Série deve ser um número entre 0 e 9');
        return;
      }

      setFixedLiveRaffleMode(true);
      setResultadosCalculados([]);
      setGanhadoresSorteio([]);
      setWinner(null);
      setCupomSorteadoId(null);
      setFinalNumber("");
      setCurrentNumber(`${serieDigitada}/${numeroDigitado.padStart(5, '0')}`);
      setIsAnimating(true);
      setShowResult(false);
      setShowConfetti(false);
      setCountdown(3);

      const countdownInterval = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(countdownInterval);
            animateNumbers(0);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return;
    }

    // Verificar se os dados ainda estão carregando
    if (participantesLoading) {
      toast.error('Aguardando carregamento dos participantes...');
      return;
    }
    
    // Validações de input - usar cuponsParaSorteio (lista real usada no sorteio)
    if (cuponsParaSorteio.length === 0) {
      toast.error('Não há cupons elegíveis para o sorteio. Verifique se existem cupons ativos no sistema.');
      console.error('🔍 Nenhum cupom elegível:', {
        clientesData: clientesCampanhaData,
        campaignCoupons: campaignCoupons.length,
        cuponsParaSorteio: cuponsParaSorteio.length
      });
      return;
    }
    
    // Verificar se há pelo menos um cupom ativo
    const cuponsAtivos = cuponsParaSorteio.filter(c => c.status === 'ativo');
    if (cuponsAtivos.length === 0) {
      toast.error('Não há cupons ativos para o sorteio. Todos os cupons já foram utilizados.');
      return;
    }
    if (!numeroDebounced || numeroDebounced.trim() === '') {
      toast.error('Digite um número para o sorteio');
      return;
    }
    if (!serieDebounced || serieDebounced.trim() === '') {
      toast.error('Digite uma série para o sorteio');
      return;
    }
    const serie = parseInt(serieDebounced);
    if (isNaN(serie) || serie < 0 || serie > 9) {
      toast.error('Série deve ser um número entre 0 e 9');
      return;
    }

    // === NOVA LÓGICA ===
    // 1. Executa o sorteio puro com os cupons convertidos
    console.log("Executando sorteio puro com:", {
      numero: parseInt(numeroDebounced),
      serie: serie,
      cupons: cuponsParaSorteio.length
    });
    
    const todosOs5Ganhadores = executarSorteio(
      parseInt(numeroDebounced),
      serie,
      cuponsParaSorteio, // Usa a lista de 'Cupom' pura
      sorteioUnicaSerie
    );

    // 2. Verifica se o sorteio puro encontrou ganhadores
    if (todosOs5Ganhadores.length === 0) {
      toast.error('Sorteio não encontrou ganhadores com os cupons disponíveis.');
      return;
    }
    
    console.log("Sorteio puro retornou:", todosOs5Ganhadores);
    // 3. Armazena os 5 resultados no novo estado
    setResultadosCalculados(todosOs5Ganhadores);

    // 4. Reseta a UI para o início da animação
    setSorteioAutomatico(false);
    setGanhadoresSorteio([]); // Limpa ganhadores *revelados*
    setNumeroAtual(numeroDigitado);
    setSerieAtual(serieDigitada);

    setIsAnimating(true);
    setShowResult(false);
    setShowConfetti(false);
    setCountdown(3);

    // 5. Inicia o countdown
    const countdownInterval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(countdownInterval);
          animateNumbers(); // Chama animateNumbers (agora ele lê do estado)
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  /**
   * Helper para iniciar o próximo sorteio (countdown → animateNumbers)
   * Reutilizado por saveResult e continuarSorteio
   * @param indiceProximoGanhador - Índice do próximo ganhador na lista (opcional, usa ganhadoresSorteio.length se não fornecido)
   */
  const iniciarProximoSorteio = (indiceProximoGanhador?: number) => {
    setSorteioAutomatico(true);
    setIsAnimating(true);
    setShowResult(false);
    setShowConfetti(false);
    setCountdown(3);
    
    // Capturar o índice correto se não foi fornecido
    const indice = indiceProximoGanhador !== undefined 
      ? indiceProximoGanhador 
      : ganhadoresSorteio.length;
    
    const countdownInterval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(countdownInterval);
          animateNumbers(indice); // Passa o índice correto
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  /**
   * === REFEITO: animateNumbers ===
   * Apenas anima. Lê o próximo ganhador da lista 'resultadosCalculados'.
   * @param indiceProximoGanhador - Índice do próximo ganhador (opcional, usa ganhadoresSorteio.length se não fornecido)
   */
  const animateNumbers = (indiceProximoGanhador?: number) => {
    let iterations = 0;
    const maxIterations = 30;
    
    // Capturar o índice correto - usar o fornecido ou calcular do estado
    const indice = indiceProximoGanhador !== undefined 
      ? indiceProximoGanhador 
      : ganhadoresSorteio.length;
    
    const numberInterval = setInterval(() => {
      setCurrentNumber(generateRandomNumber());
      iterations++;
      
      if (iterations >= maxIterations) {
        clearInterval(numberInterval);
        
        if (fixedLiveRaffleMode) {
          const fixedWinner = FIXED_LIVE_RAFFLE_WINNERS[indice];

          if (!fixedWinner) {
            toast.success('Todos os ganhadores e reservas foram revelados!');
            setIsAnimating(false);
            return;
          }

          setFinalNumber(fixedWinner.displayNumber);
          setCurrentNumber(fixedWinner.displayNumber);
          setWinner(fixedWinner);
          setGanhadoresSorteio((prev) => {
            const jaRevelado = prev.some(
              (ganhador) => ganhador.name === fixedWinner.name && ganhador.numero_sorte === fixedWinner.numero_sorte
            );
            return jaRevelado ? prev : [...prev, fixedWinner];
          });
          setCupomSorteadoId(null);
          setNumeroAtual(fixedWinner.numero_sorte);
          setSerieAtual(fixedWinner.serie.toString());
          setIsAnimating(false);
          setShowResult(true);
          setShowConfetti(true);
          setTimeout(() => setShowConfetti(false), 3500);
          return;
        }

        // === NOVA LÓGICA ===
        // 1. Pega o próximo ganhador da lista PRÉ-CALCULADA usando o índice correto
        const proximoResultado = resultadosCalculados[indice];

        if (!proximoResultado) {
          console.error("Erro: animateNumbers foi chamado, mas não há mais resultados.", { indice, resultadosCalculados });
          toast.error('Nenhum participante encontrado');
          setIsAnimating(false);
          return;
        }
        
        // 2. Encontrar o CupomSorteio (API) correspondente para exibir os dados
        const cupomGanhador = campaignCoupons.find(c => c.id === proximoResultado.cupomId);

        if (!cupomGanhador) {
          console.error("Erro: ResultadoSorteio encontrou um ID, mas o CupomSorteio não foi encontrado na lista.", { proximoResultado });
          toast.error('Erro ao buscar dados do ganhador.');
          setIsAnimating(false);
          return;
        }
        
        // 3. Converter cupom para participante (lógica mantida)
        const winnerParticipant: Participant = {
          name: cupomGanhador.cliente.nome || 'Nome não informado',
          cpf: `***${(cupomGanhador.cliente.cpf || '').slice(-3)}`,
          bakery: cupomGanhador.padaria.nome || 'Padaria não informada',
          answer: cupomGanhador.cliente.resposta_pergunta || null,
          numero_sorte: cupomGanhador.numero_sorte,
          serie: converterSerieBancoParaLoteria(cupomGanhador.serie),
          valor_compra: cupomGanhador.valor_compra,
          data_compra: cupomGanhador.data_compra
        };
        
        // 4. Atualizar UI
        setFinalNumber(winnerParticipant.numero_sorte);
        setCurrentNumber(winnerParticipant.numero_sorte);
        setWinner(winnerParticipant);
        setCupomSorteadoId(cupomGanhador.id);
        
        // 5. Atualizar base para próxima animação
        setNumeroAtual(winnerParticipant.numero_sorte);
        setSerieAtual(winnerParticipant.serie.toString());
        
        setIsAnimating(false);
        setShowResult(true);
        setShowConfetti(true);
        
        // Nota: saveResult não é mais chamado automaticamente aqui
        // O usuário deve clicar em "Salvar Ganhador" e depois continua automaticamente
        
        setTimeout(() => setShowConfetti(false), 3000);
      }
    }, 100);
  };

  /**
   * === REFATORADO: saveResult ===
   * Salva o ganhador atual (lido do estado) e SEMPRE continua automaticamente
   * para o próximo sorteio (exceto se for o último ganhador).
   */
  const saveResult = async () => {
    if (!winner || !cupomSorteadoId) return;

    const cupomGanhador = campaignCoupons.find(cupom => cupom.id === cupomSorteadoId);
    if (!cupomGanhador || !cupomGanhador.cliente?.id) {
      toast.error("Erro: Cupom ou cliente não encontrado");
      return;
    }

    // Verifica se já não salvamos este (para evitar clique duplo)
    const jaFoiSalvo = ganhadoresSorteio.find(g => g.numero_sorte === winner.numero_sorte && g.name === winner.name);
    if (jaFoiSalvo) {
      console.warn("Tentativa de salvar ganhador duplicado, ignorando.");
      return;
    }
    
    const numGanhadoresAtual = ganhadoresSorteio.length;

    console.log(`Salvando ganhador ${numGanhadoresAtual + 1}/${resultadosCalculados.length}:`, {
      cupomId: cupomSorteadoId,
      winner,
    });

    try {
      // 1. Salvar na tabela sorteios
      await salvarGanhador({
        numero_sorteado: cupomGanhador.numero_sorte,
        data_sorteio: new Date().toISOString(),
        ganhador_id: cupomGanhador.cliente.id,
        cliente_id: cupomGanhador.cliente.id,
      });

      // 2. Marcar TODOS os cupons do cliente como usados no sorteio
      const todosCuponsCliente = campaignCoupons.filter(cupom => 
        cupom.cliente.id === cupomGanhador.cliente.id && cupom.status === 'ativo'
      );
      
      // Marcar todos os cupons do cliente como sorteados
      for (const cupom of todosCuponsCliente) {
        await marcarCupomSorteado({
          cupom_id: cupom.id
        });
      }
      
      console.log(`✅ ${todosCuponsCliente.length} cupons do cliente marcados como sorteados!`);
      console.log(`✅ Ganhador ${numGanhadoresAtual + 1}/${resultadosCalculados.length} salvo!`);

      // 3. Calcular se é o último ganhador antes de atualizar o estado
      const proximoNumGanhadores = numGanhadoresAtual + 1;
      const ehUltimoGanhador = proximoNumGanhadores >= resultadosCalculados.length;

      // 4. Adicionar ganhador à lista *revelada*
      setGanhadoresSorteio(prev => [...prev, winner!]);
      
      // 5. SEMPRE continuar automaticamente para o próximo sorteio (exceto se for o último)
      if (!ehUltimoGanhador) {
        // Aguarda um pouco antes de continuar (para dar tempo de ver o resultado salvo)
        // Passa o índice correto (próximo número de ganhadores) para garantir que pega o próximo ganhador
        setTimeout(() => {
          iniciarProximoSorteio(proximoNumGanhadores);
        }, 1500); // Delay para mostrar feedback visual antes de continuar
      } else {
        // Último ganhador - finalizar sorteios
        console.log(`🎉 Finalizando sorteios! Total: ${proximoNumGanhadores}`);
        toast.success(`Todos os ${proximoNumGanhadores} ganhadores foram sorteados!`);
        
        // Fecha o modal automático após um delay (se estiver aberto)
        if (showRaffleModal) {
          setTimeout(() => {
            setShowRaffleModal(false);
            resetRaffle();
          }, 3000);
        }
      }
      
    } catch (error) {
      console.error('❌ Erro ao salvar ganhador:', error);
      toast.error('Erro ao salvar ganhador');
    }
  };


  /**
   * === REFEITO: resetRaffle ===
   * Limpa todos os estados, incluindo a nova lista de resultados.
   */
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
    setSerieDigitada("");
    setNumeroDebounced("");
    setSerieDebounced("");
    setSorteioAutomatico(false);
    setNumeroAtual("");
    setSerieAtual("");
    setGanhadoresSorteio([]);
    // Limpa a lista calculada
    setResultadosCalculados([]);
    setFixedLiveRaffleMode(false);
  };

  /**
   * === REFATORADO: continuarSorteio ===
   * (Mantido para compatibilidade - agora saveResult já continua automaticamente)
   * Esta função não é mais necessária, mas mantida caso seja chamada manualmente.
   */
  const continuarSorteio = () => {
    if (fixedLiveRaffleMode) {
      const proximoIndice = ganhadoresSorteio.length;

      if (proximoIndice < FIXED_LIVE_RAFFLE_WINNERS.length) {
        iniciarProximoSorteio(proximoIndice);
        return;
      }

      setShowResult(true);
      setShowConfetti(true);
      toast.success('Todos os 5 ganhadores e 5 reservas foram revelados!');
      setTimeout(() => setShowConfetti(false), 3500);
      return;
    }

    // Verifica se há mais ganhadores para sortear
    if (ganhadoresSorteio.length < resultadosCalculados.length) {
      iniciarProximoSorteio();
    } else {
      // Finalizar sorteios (se for o último)
      console.log(`🎉 Finalizando sorteios! Total: ${ganhadoresSorteio.length}`);
      toast.success(`Todos os ${ganhadoresSorteio.length} ganhadores foram sorteados!`);
    }
  };

  const reativarCupomGanhador = (clienteId: string) => {
    reativarTodosCuponsCliente({ cliente_id: clienteId });
  };

  const cancelRaffle = () => {
    setShowRaffleModal(false);
    resetRaffle();
  };
  const showWinnerInfo = (winner: Participant) => {
    setSelectedWinner(winner);
    setShowWinnerDetails(true);
  };

  const totalRevelacoes = fixedLiveRaffleMode ? FIXED_LIVE_RAFFLE_WINNERS.length : resultadosCalculados.length;
  const currentFixedWinnerMeta = getFixedWinnerMeta(winner);
  
  return (
      <div className="space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-primary">Sorteios Digitais</h1>
            <p className="text-sm md:text-base text-muted-foreground">
              Gerencie e execute sorteios da plataforma • {participants.length} cupons elegíveis na plataforma
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
                setFixedLiveRaffleMode(true);
                setShowLiveRaffle(true);
                setTimeout(() => enterFullscreen(), 100);
              }}
              className="bg-gradient-to-r from-red-700 via-orange-500 to-amber-400 hover:from-red-800 hover:via-orange-600 hover:to-amber-500 text-white w-full sm:w-auto"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Sorteio Ao Vivo Junino
            </Button>
            <Button
               onClick={() => setShowRaffleModal(true)}
              disabled={participantesLoading}
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
                <p 
 className="text-muted-foreground">Nenhum sorteio agendado</p>
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
                  Novos cupons não podem 
 ser emitidos, mas o sorteio pode acontecer normalmente.
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
            <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
               <Trophy className="w-5 h-5 text-primary" />
              Ganhadores Salvos
            </CardTitle>
              <div className="flex gap-2">
                <Button
                  onClick={() => reativarTodosCuponsSorteados({})}
                   variant="outline"
                  size="sm"
                  className="text-green-600 border-green-600 hover:bg-green-50"
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Reativar Todos
                 </Button>
              </div>
            </div>
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
                  <SelectItem 
 value="all">Todas as padarias</SelectItem>
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
                  {(ganhadoresSalvosFiltrados || [])
                    .filter(sorteio => {
                       // Filtrar apenas sorteios com cliente válido
                      if (!sorteio?.cliente || !sorteio.cliente.id) {
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
            <div className="relative h-full bg-gradient-to-br from-amber-100 via-orange-100 to-emerald-100 flex flex-col items-center justify-center">
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
                  {Array.from({ length: 20 }).map((_, i) => (
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
              <div className="text-center mb-8">
                <div className="flex items-center justify-center gap-3 mb-4">
                  <span className="text-4xl animate-bounce">🎏</span>
                   <h2 className="text-3xl font-bold text-red-800">Sorteio Junino SINDPAN</h2>
                  <span className="text-4xl animate-bounce" style={{ animationDelay: '0.5s' }}>🔥</span>
                </div>
                <p className="text-lg text-muted-foreground">🔥 Viva São João e boa sorte! 🌽</p>
              </div>

              {/* Input para número e série do sorteio */}
              {!isAnimating && !showResult && countdown === 0 && (
                <div className="mb-8 w-full max-w-md space-y-4">
                  <div>
                     <label className="block text-sm font-medium text-center mb-2 flex items-center justify-center gap-2">
                      🎲 Digite o número do sorteio 🎲
                  </label>
                  <Input 
                     type="number"
                    placeholder="Ex: 12345"
                    value={numeroDigitado}
                    onChange={(e) => setNumeroDigitado(e.target.value)}
                    className="text-center text-2xl font-mono h-14"
                     maxLength={5}
                  />
                  </div>
                  
                  <div>
                     <label className="block text-sm font-medium text-center mb-2 flex items-center justify-center gap-2">
                      🎯 Digite a série (0-9) 🎯
                    </label>
                    <Input 
                       type="number"
                      placeholder="Ex: 4"
                      value={serieDigitada}
                      onChange={(e) => setSerieDigitada(e.target.value)}
                      className="text-center text-2xl 
 font-mono h-14"
                      min="0"
                      max="9"
                    />
                  </div>
                 
                  
                  <p className="text-xs text-muted-foreground text-center">
                    O sistema buscará o número exato ou o mais próximo na série especificada
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
                        <div className="flex items-center justify-center gap-2">
                          <Badge variant="outline" className="text-primary border-primary font-mono">
                           {winner.numero_sorte}
                          </Badge>
                          <Badge variant="outline" className="text-secondary border-secondary">
                            Série {winner.serie}
                           </Badge>
                        </div>
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

                  {/* Lista de Ganhadores do Sorteio Atual */}
                  {ganhadoresSorteio.length > 0 && !fixedLiveRaffleMode && (
                    <Card className="mt-8 max-w-2xl w-full">
                       <CardHeader>
                        <CardTitle className="text-lg text-primary flex items-center gap-2">
                          <Trophy className="w-5 h-5" />
                          Ganhadores do Sorteio Atual ({ganhadoresSorteio.length}/{resultadosCalculados.length})
                         </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2 max-h-60 overflow-y-auto">
                           {ganhadoresSorteio.map((ganhador, index) => (
                            <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                              <div className="flex items-center gap-3">
                                 <Badge variant="outline" className="text-primary border-primary font-mono">
                                  {ganhador.numero_sorte}
                                </Badge>
                                 <Badge variant="outline" className="text-secondary border-secondary">
                                  Série {ganhador.serie}
                                </Badge>
                                 <span className="font-medium">{ganhador.name}</span>
                              </div>
                              <div className="text-sm text-muted-foreground">
                                 {ganhador.bakery}
                              </div>
                            </div>
                          ))}
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
                  className="text-xl px-12 py-6 bg-gradient-to-r from-red-700 via-orange-500 to-amber-400 hover:from-red-800 hover:via-orange-600 hover:to-amber-500 text-white shadow-lg"
                >
                  <span className="text-2xl mr-2">🔥</span>
                  <Trophy className="w-6 h-6 mr-2" />
                   <span className="text-2xl ml-2">🌽</span>
                  Iniciar Sorteio Junino
                </Button>
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
                    <label className="text-sm font-medium text-muted-foreground">Número da Sorte</label>
                     <p className="text-lg font-mono">{selectedWinner.numero_sorte}</p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Série</label>
                     <p className="text-lg">{selectedWinner.serie}</p>
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
           <div className="fixed inset-0 z-[100] bg-gradient-to-br from-orange-950 via-red-800 to-emerald-900 animate-gradient-shift overflow-hidden h-screen w-screen">
            {/* Animated Background */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              {/* Bandeirinhas e elementos juninos */}
              {Array.from({ length: 20 }).map((_, i) => (
                <div
                   key={`junino-${i}`}
                  className="absolute text-amber-200/80 text-2xl animate-float"
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                     animationDelay: `${Math.random() * 5}s`,
                    animationDuration: `${3 + Math.random() * 4}s`,
                  }}
                >
                  🎏
                 </div>
              ))}
              
              {/* Brilhos de arraial */}
              {Array.from({ length: 20 }).map((_, i) => (
                <div
                   key={`arraial-star-${i}`}
                  className="absolute text-yellow-300/85 text-3xl animate-pulse"
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                     animationDelay: `${Math.random() * 3}s`,
                    animationDuration: `${2 + Math.random() * 2}s`,
                  }}
                >
                  ✨
                 </div>
              ))}
              
              {/* Luzes de fogueira */}
              <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-orange-500/25 rounded-full blur-3xl animate-pulse" />
              <div className="absolute bottom-1/4 right-1/4 w-96 
 h-96 bg-emerald-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
              <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-yellow-300/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
            </div>

            {/* Content */}
            <div className="relative z-10 h-screen w-screen flex flex-col">
              {/* Header */}
               <div className="flex items-center justify-between p-6 absolute top-0 left-0 right-0 bg-gradient-to-b from-black/30 to-transparent backdrop-blur-sm z-20">
                <div className="flex items-center gap-4">
                  <div className="w-3 h-3 bg-amber-300 rounded-full animate-pulse" />
                  <span className="text-white/90 text-lg font-semibold uppercase tracking-wider">
                     Sorteio Ao Vivo Junino
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
              <div className="flex-1 flex flex-col items-center justify-center px-8 py-6 pt-20 pb-24 relative overflow-y-auto overflow-x-hidden">
                {/* Lista lateral de ganhadores */}
                {ganhadoresSorteio.length > 0 && !fixedLiveRaffleMode && (
                  <div className="absolute right-8 top-20 bottom-8 w-80 overflow-y-auto bg-white/10 backdrop-blur-lg rounded-2xl p-4 
 border border-white/20">
                    <h3 className="text-white text-lg font-bold mb-4 flex items-center gap-2">
                      <Trophy className="w-5 h-5 text-yellow-400" />
                      Revelados ({ganhadoresSorteio.length}/{totalRevelacoes})
                    </h3>
                     <div className="space-y-3">
                      {ganhadoresSorteio.map((ganhador, index) => {
                        const fixedMeta = getFixedWinnerMeta(ganhador);
                        return (
                          <div key={index} className="bg-white/20 backdrop-blur-sm rounded-lg p-3 border border-white/30">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge className="bg-yellow-500 text-black font-mono text-sm">
                                {fixedMeta?.displayNumber ?? ganhador.numero_sorte}
                              </Badge>
                              <Badge className="bg-emerald-600 text-white text-sm">
                                {fixedMeta?.prizeLabel ?? `Série ${ganhador.serie}`}
                              </Badge>
                            </div>
                            <p className="text-white font-semibold text-sm">{ganhador.name}</p>
                            <p className="text-white/80 text-xs">{ganhador.bakery}</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
                {/* Logo/Title */}
                 <div className="mb-8 text-center flex-shrink-0">
                  <div className="flex items-center justify-center gap-4 mb-4">
                    <span className="text-6xl animate-bounce flex-shrink-0">🎏</span>
                    <h1 className="text-7xl font-black text-white drop-shadow-2xl animate-fade-in whitespace-nowrap">
                    São João de Prêmios - SINDPAN
                   </h1>
                    <span className="text-6xl animate-bounce flex-shrink-0" style={{ animationDelay: '0.5s' }}>🔥</span>
                  </div>
                  <p className="text-2xl text-white/80 font-light tracking-widest uppercase whitespace-nowrap">
                    🔥 Sorteio Junino 🌽
                  </p>
                </div>

                {/* Entrada de suspense para a revelação fixa */}
                {!isAnimating && !showResult && countdown === 0 && fixedLiveRaffleMode && (
                   <div className="mb-8 w-full max-w-5xl animate-fade-in flex-shrink-0">
                    <div className="relative overflow-hidden rounded-[2rem] border-2 border-amber-200/50 bg-red-950/35 p-10 text-center shadow-[0_0_80px_rgba(251,191,36,0.22)] backdrop-blur-xl md:p-12">
                      <div className="absolute inset-x-0 top-0 h-2 bg-gradient-to-r from-red-600 via-amber-300 to-emerald-500" />
                      <div className="mb-6 flex items-center justify-center gap-4 text-5xl md:text-6xl">
                        <span className="animate-bounce">🎏</span>
                        <span className="animate-pulse">🔥</span>
                        <span className="animate-bounce" style={{ animationDelay: '0.35s' }}>🌽</span>
                      </div>
                      <p className="text-sm font-bold uppercase tracking-[0.45em] text-amber-200">Momento de suspense</p>
                      <h2 className="mt-3 text-5xl font-black text-white drop-shadow-lg md:text-7xl">Digite o número sorteado</h2>
                      <p className="mx-auto mt-4 max-w-3xl text-xl text-amber-100 md:text-2xl">
                        Informe o número e a série para iniciar a contagem e revelar os 5 ganhadores, depois os 5 reservas.
                      </p>

                      <div className="mt-10 grid gap-6 md:grid-cols-[2fr_1fr]">
                        <div className="rounded-3xl border border-white/20 bg-white/10 p-5 shadow-2xl backdrop-blur">
                          <label className="mb-4 flex items-center justify-center gap-3 text-2xl font-black text-white md:text-3xl">
                            <span>🎲</span>
                            Número
                            <span>🎲</span>
                          </label>
                          <Input
                            type="number"
                            placeholder="64244"
                            value={numeroDigitado}
                            onChange={(e) => setNumeroDigitado(e.target.value)}
                            className="h-28 border-amber-200/40 bg-white/15 text-center font-mono text-6xl font-black tracking-widest text-white shadow-inner placeholder:text-white/35 focus-visible:ring-amber-300 md:h-36 md:text-8xl"
                            maxLength={5}
                          />
                        </div>

                        <div className="rounded-3xl border border-white/20 bg-white/10 p-5 shadow-2xl backdrop-blur">
                          <label className="mb-4 flex items-center justify-center gap-3 text-2xl font-black text-white md:text-3xl">
                            <span>🎯</span>
                            Série
                            <span>🎯</span>
                          </label>
                          <Input
                            type="number"
                            placeholder="4"
                            value={serieDigitada}
                            onChange={(e) => setSerieDigitada(e.target.value)}
                            className="h-28 border-amber-200/40 bg-white/15 text-center font-mono text-6xl font-black text-white shadow-inner placeholder:text-white/35 focus-visible:ring-amber-300 md:h-36 md:text-8xl"
                            min="0"
                            max="9"
                          />
                        </div>
                      </div>

                      <div className="mt-8 rounded-2xl border border-amber-200/30 bg-amber-300/10 px-6 py-4 text-lg font-semibold text-amber-100 md:text-xl">
                        A ordem dos nomes está fixada nos bastidores. Clique em “Começar o Arraiá” para revelar um por vez.
                      </div>
                    </div>
                   </div>
                )}

                {/* Input para número e série (antes do sorteio) */}
                {!isAnimating && !showResult && countdown === 0 && !fixedLiveRaffleMode && (
                   <div className="mb-8 w-full max-w-2xl animate-fade-in space-y-8 flex-shrink-0">
                    <div>
                      <div className="flex items-center justify-center gap-2 mb-6">
                        <span className="text-3xl flex-shrink-0">🎲</span>
                        <label className="block text-white text-xl font-semibold text-center whitespace-nowrap">
                          Digite o número do sorteio
                        </label>
                        <span className="text-3xl flex-shrink-0">🎲</span>
                       </div>
                    <Input 
                      type="number"
                      placeholder="00000"
                       value={numeroDigitado}
                      onChange={(e) => setNumeroDigitado(e.target.value)}
                      className="text-center text-6xl font-mono h-24 bg-white/10 border-white/30 text-white placeholder:text-white/40 backdrop-blur-lg"
                      maxLength={5}
                    />
                     </div>
                    
                    <div>
                      <div className="flex items-center justify-center gap-2 mb-6">
                        <span className="text-3xl flex-shrink-0">🎯</span>
                        <label className="block text-white text-xl font-semibold text-center whitespace-nowrap">
                          Digite a série (0-9)
                        </label>
                        <span className="text-3xl flex-shrink-0">🎯</span>
                      </div>
                      <Input 
                        type="number"
                         placeholder="4"
                        value={serieDigitada}
                        onChange={(e) => setSerieDigitada(e.target.value)}
                        className="text-center text-6xl font-mono h-24 bg-white/10 border-white/30 text-white placeholder:text-white/40 backdrop-blur-lg"
                        min="0"
                        max="9"
                      />
                    </div>
                  
                     
                    <p className="text-white/70 text-center text-lg">
                      O sistema buscará o número exato ou o mais próximo na série especificada
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
                       <div className="absolute inset-0 bg-gradient-to-r from-red-600 via-amber-400 to-emerald-500 blur-3xl opacity-50 animate-pulse" />
                      
                      {/* Number Box */}
                      <div className={`relative bg-white/10 
 backdrop-blur-xl rounded-3xl border-4 p-12 transition-all duration-500 ${
                        isAnimating 
                          ? 'border-white/50 shadow-2xl' 
                          : 'border-amber-300 shadow-[0_0_100px_rgba(251,191,36,0.85)]'
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
                        <Card className="bg-gradient-to-br from-amber-300 via-orange-400 to-red-600 border-4 border-white/50 shadow-2xl max-w-2xl">
                           <CardHeader className="text-center pb-4">
                            <div className="flex items-center justify-center gap-3 mb-2">
                              <Trophy className="w-12 h-12 text-white drop-shadow-lg" />
                               <CardTitle className="text-5xl font-black text-white drop-shadow-lg">
                                GANHADOR DO ARRAIÁ!
                              </CardTitle>
                              <Trophy className="w-12 h-12 text-white drop-shadow-lg" />
                            </div>
                          </CardHeader>
                           <CardContent className="text-center space-y-4 px-12 pb-8">
                            <div className="bg-white/20 backdrop-blur-lg rounded-2xl p-6">
                              <p className="text-4xl font-bold text-white mb-2">{winner.name}</p>
                               {winner.cpf && <p className="text-2xl text-white/90 font-mono">CPF: {winner.cpf}</p>}
                              {currentFixedWinnerMeta && (
                                <div className="mb-4 flex justify-center">
                                  <Badge className="bg-red-800 px-6 py-2 text-lg text-amber-100 shadow-lg">
                                    {currentFixedWinnerMeta.prizeLabel} • {currentFixedWinnerMeta.group}
                                  </Badge>
                                </div>
                              )}
                              <div className="flex items-center justify-center gap-4 mt-4">
                                <Badge className="text-xl px-6 py-2 bg-yellow-500 text-black">
                                   {currentFixedWinnerMeta?.displayNumber ?? winner.numero_sorte}
                                </Badge>
                                <Badge className="text-xl px-6 py-2 bg-emerald-600 text-white">
                                     Série {winner.serie}
                                </Badge>
                              </div>
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
                    {Array.from({ length: 30 }).map((_, i) => (
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
                            i % 5 === 1 ? 'bg-orange-400' :
                            i % 5 === 2 ? 'bg-red-500' :
                            i % 5 === 3 ? 'bg-emerald-500' :
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
                    className="text-3xl px-16 py-10 bg-gradient-to-r from-red-700 via-orange-500 to-amber-400 hover:from-red-800 hover:via-orange-600 hover:to-amber-500 text-white shadow-2xl rounded-2xl animate-pulse-slow"
                   >
                    <span className="text-4xl mr-4">🔥</span>
                    <Trophy className="w-10 h-10 mr-4" />
                    <span className="text-4xl ml-4">🌽</span>
                    COMEÇAR O ARRAIÁ
                   </Button>
                )}

                {showResult && (
                  <div className="flex gap-6 mt-8 animate-fade-in">
                    {!fixedLiveRaffleMode && (
                      <Button 
                        onClick={saveResult} 
                        size="lg"
                        className="text-2xl px-12 py-8 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-2xl rounded-2xl"
                        disabled={isMarcandoSorteado}
                      >
                        <Save className="w-8 h-8 mr-3" />
                        {isMarcandoSorteado ? "SALVANDO..." : "SALVAR RESULTADO"}
                      </Button>
                    )}
                    <Button 
                      onClick={continuarSorteio}
                      size="lg"
                       className="text-2xl px-12 py-8 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white shadow-2xl rounded-2xl"
                      disabled={totalRevelacoes > 0 && ganhadoresSorteio.length >= totalRevelacoes}
                    >
                      <Trophy className="w-8 h-8 mr-3" />
                      {fixedLiveRaffleMode ? (ganhadoresSorteio.length >= totalRevelacoes ? "FINALIZADO" : "CONTINUAR") : (ganhadoresSorteio.length >= resultadosCalculados.length && resultadosCalculados.length > 0 ? "FINALIZADO" : "PRÓXIMO")}
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
              <div className="absolute bottom-0 left-0 right-0 p-4 text-center bg-gradient-to-t from-black/20 to-transparent backdrop-blur-sm">
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