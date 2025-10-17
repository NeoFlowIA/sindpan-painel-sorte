import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { CupomParaSorteio, useCuponsParaSorteio, useHistoricoSorteios, useParticipantesSorteio } from "@/hooks/useCupons";
import { formatPhone, maskCPF } from "@/utils/formatters";
import {
  Gift,
  History,
  RotateCcw,
  Shuffle,
  Trophy,
  Users,
} from "lucide-react";

import { RaffleFullscreenStage, type RaffleWinner } from "@/components/sorteio/RaffleFullscreenStage";
import { SortearButton } from "@/components/sorteio/SortearButton";

const COLUMN_STAGGER = 140;

export function PadariaSorteio() {
  const [activeTab, setActiveTab] = useState("sorteio");
  const [cuponsSorteados, setCuponsSorteados] = useState<Set<string>>(new Set());
  const [ultimoGanhador, setUltimoGanhador] = useState<CupomParaSorteio | null>(null);
  const [isSorteando, setIsSorteando] = useState(false);
  const [usuariosGanhadores, setUsuariosGanhadores] = useState<Set<number>>(new Set());
  const [historicoLocal, setHistoricoLocal] = useState<Array<{
    id: string;
    data_sorteio: string;
    numero_sorteado: string;
    ganhador_id: number;
    cliente: {
      id: number;
      nome: string;
      cpf: string;
      whatsapp: string;
    };
  }>>([]);

  const [stageOpen, setStageOpen] = useState(false);
  const [stageEstado, setStageEstado] = useState<"idle" | "spinning" | "revealing" | "done">("idle");
  const [stageWinner, setStageWinner] = useState<RaffleWinner | undefined>();
  const revealTimeoutRef = useRef<number>();

  const { user } = useAuth();
  const { toast } = useToast();

  const { data: cuponsData, isLoading: cuponsLoading, refetch: refetchCupons } = useCuponsParaSorteio(user?.padarias_id || "");
  const { data: participantesData, isLoading: participantesLoading } = useParticipantesSorteio();
  useHistoricoSorteios();

  useEffect(() => {
    if (historicoLocal.length > 0) {
      const cupons = new Set(historicoLocal.map((s) => s.numero_sorteado));
      setCuponsSorteados(cupons);
    }
  }, [historicoLocal]);

  const cuponsDisponiveis = useMemo(
    () =>
      cuponsData?.cupons?.filter(
        (cupom) => !cuponsSorteados.has(cupom.numero_sorte) && !usuariosGanhadores.has(cupom.cliente_id)
      ) || [],
    [cuponsData?.cupons, cuponsSorteados, usuariosGanhadores]
  );

  const totalCupons = cuponsData?.cupons?.length || 0;
  const cuponsDisponiveisCount = cuponsDisponiveis.length;
  const cuponsSorteadosCount = cuponsSorteados.size;

  useEffect(() => () => {
    if (revealTimeoutRef.current) {
      window.clearTimeout(revealTimeoutRef.current);
    }
  }, []);

  const realizarSorteio = useCallback(async () => {
    if (cuponsDisponiveis.length === 0) {
      toast({
        title: "Nenhum cupom disponível",
        description: "Todos os cupons já foram sorteados. Inicie um novo sorteio.",
        variant: "destructive",
      });
      return;
    }

    setStageOpen(true);
    setStageEstado("spinning");
    setStageWinner(undefined);
    setIsSorteando(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 1800));

      const cupomSorteado = cuponsDisponiveis[Math.floor(Math.random() * cuponsDisponiveis.length)];

      const novoSorteio = {
        id: `sorteio_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
        data_sorteio: new Date().toISOString(),
        numero_sorteado: cupomSorteado.numero_sorte,
        ganhador_id: cupomSorteado.cliente_id,
        cliente: cupomSorteado.cliente,
      };

      setHistoricoLocal((prev) => [novoSorteio, ...prev]);
      setCuponsSorteados((prev) => new Set([...prev, cupomSorteado.numero_sorte]));
      setUsuariosGanhadores((prev) => new Set([...prev, cupomSorteado.cliente_id]));
      setUltimoGanhador(cupomSorteado);

      setStageWinner({
        numero: String(cupomSorteado.numero_sorte).padStart(5, "0"),
        nome: cupomSorteado.cliente.nome,
        telefone: formatPhone(cupomSorteado.cliente.whatsapp),
        cupom: cupomSorteado.numero_sorte,
      });

      setStageEstado("revealing");

      if (revealTimeoutRef.current) {
        window.clearTimeout(revealTimeoutRef.current);
      }
      revealTimeoutRef.current = window.setTimeout(() => {
        setStageEstado("done");
        toast({
          title: "Sorteio realizado!",
          description: `${cupomSorteado.cliente.nome} foi sorteado com o cupom ${cupomSorteado.numero_sorte}`,
        });
      }, COLUMN_STAGGER * 4 + 900);
    } catch (error) {
      console.error("Erro ao realizar sorteio:", error);
      toast({
        title: "Erro",
        description: "Erro ao realizar o sorteio. Tente novamente.",
        variant: "destructive",
      });
      setStageOpen(false);
      setStageEstado("idle");
    } finally {
      setIsSorteando(false);
    }
  }, [cuponsDisponiveis, toast]);

  const iniciarNovoSorteio = useCallback(() => {
    setCuponsSorteados(new Set());
    setUsuariosGanhadores(new Set());
    setUltimoGanhador(null);
    setHistoricoLocal([]);
    refetchCupons();
    toast({
      title: "Novo sorteio iniciado",
      description: "Todos os cupons estão disponíveis para sorteio novamente.",
    });
  }, [refetchCupons, toast]);

  const continuarSorteio = useCallback(() => {
    if (!ultimoGanhador) return;

    setCuponsSorteados((prev) => {
      const novos = new Set(prev);
      novos.delete(ultimoGanhador.numero_sorte);
      return novos;
    });

    setUsuariosGanhadores((prev) => {
      const novos = new Set(prev);
      novos.delete(ultimoGanhador.cliente_id);
      return novos;
    });

    setUltimoGanhador(null);

    toast({
      title: "Sorteio continuado",
      description: "O último ganhador foi removido e pode ser sorteado novamente.",
    });
  }, [toast, ultimoGanhador]);

  const handleSortear = useCallback(() => {
    void realizarSorteio();
  }, [realizarSorteio]);

  const handleStageOpenChange = useCallback((open: boolean) => {
    setStageOpen(open);
    if (!open) {
      if (revealTimeoutRef.current) {
        window.clearTimeout(revealTimeoutRef.current);
      }
      setStageEstado("idle");
      setStageWinner(undefined);
    }
  }, []);

  const handleNovoSorteioNoStage = useCallback(() => {
    void realizarSorteio();
  }, [realizarSorteio]);

  const handleVoltarAoPainel = useCallback(() => {
    setStageOpen(false);
    setStageEstado("idle");
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-3xl font-bold tracking-tight">
          <Gift className="h-8 w-8 text-[#006CFF]" />
          Sistema de Sorteio
        </h1>
        <p className="text-muted-foreground">Realize sorteios entre os cupons cadastrados</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="sorteio">Sorteio</TabsTrigger>
          <TabsTrigger value="participantes">Participantes</TabsTrigger>
          <TabsTrigger value="historico">Histórico</TabsTrigger>
        </TabsList>

        <TabsContent value="sorteio" className="mt-6 space-y-6">
          <SortearButton disabled={isSorteando || cuponsDisponiveisCount === 0} onSortear={handleSortear} />

          <div className="grid gap-4 md:grid-cols-3">
            <StatsCard
              icon={Gift}
              title="Total de cupons"
              value={totalCupons}
              description="Registrados nesta campanha"
            />
            <StatsCard
              icon={Shuffle}
              title="Cupons disponíveis"
              value={cuponsDisponiveisCount}
              description="Prontos para participar"
              accent
            />
            <StatsCard
              icon={Trophy}
              title="Cupons sorteados"
              value={cuponsSorteadosCount}
              description="Já premiados"
            />
          </div>

          {ultimoGanhador && (
            <LastWinnerBanner
              ganhador={ultimoGanhador}
              onVerHistorico={() => setActiveTab("historico")}
            />
          )}

          <Card className="border-[#006CFF]/25 bg-[#006CFF]/10 shadow-sm backdrop-blur dark:bg-[#0A1F44]/70">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-[#0A1F44] dark:text-white">
                <Shuffle className="h-5 w-5" />
                Controles do sorteio
              </CardTitle>
              <CardDescription>Mantenha a ordem das rodadas e gerencie reinícios</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 md:flex-row">
              <Button
                onClick={continuarSorteio}
                disabled={!ultimoGanhador}
                variant="secondary"
                className="flex-1"
              >
                <RotateCcw className="mr-2 h-4 w-4" />
                Continuar sorteio
              </Button>
              <Button onClick={iniciarNovoSorteio} variant="outline" className="flex-1">
                <RotateCcw className="mr-2 h-4 w-4" />
                Novo sorteio
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Cupons disponíveis para sorteio</CardTitle>
              <CardDescription>{cuponsDisponiveisCount} cupons disponíveis</CardDescription>
            </CardHeader>
            <CardContent>
              {cuponsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary" />
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2 md:grid-cols-3 lg:grid-cols-4">
                  {cuponsDisponiveis.map((cupom) => (
                    <Badge key={cupom.id} variant="outline" className="justify-center text-base">
                      {cupom.numero_sorte}
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="participantes" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Participantes do sorteio
              </CardTitle>
              <CardDescription>Clientes com cupons ativos</CardDescription>
            </CardHeader>
            <CardContent>
              {participantesLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary" />
                </div>
              ) : (
                <div className="space-y-3">
                  {participantesData?.clientes
                    ?.map((participante) => {
                      const cuponsAtivos =
                        cuponsData?.cupons?.filter((cupom) => cupom.cliente_id === participante.id).length || 0;
                      const podeParticipar = !usuariosGanhadores.has(participante.id);

                      if (cuponsAtivos === 0) return null;

                      return (
                        <div
                          key={participante.id}
                          className={`flex items-center justify-between rounded-lg border p-3 ${!podeParticipar ? "bg-muted/60 opacity-60" : ""}`}
                        >
                          <div className="flex items-center gap-3">
                            <div>
                              <div className="flex items-center gap-2 font-medium">
                                {participante.nome}
                                {!podeParticipar && (
                                  <Badge variant="destructive" className="text-xs">
                                    Já ganhou
                                  </Badge>
                                )}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {formatPhone(participante.whatsapp)} • {maskCPF(participante.cpf)}
                              </div>
                            </div>
                          </div>
                          <Badge variant={podeParticipar ? "secondary" : "outline"}>{cuponsAtivos} cupons</Badge>
                        </div>
                      );
                    })
                    .filter(Boolean)}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="historico" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Histórico de sorteios
              </CardTitle>
              <CardDescription>Todos os sorteios realizados</CardDescription>
            </CardHeader>
            <CardContent>
              {historicoLocal.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">Nenhum sorteio realizado ainda</div>
              ) : (
                <div className="space-y-3">
                  {historicoLocal.map((sorteio) => (
                    <div key={sorteio.id} className="flex items-center justify-between rounded-lg border p-3">
                      <div className="flex items-center gap-3">
                        <div>
                          <div className="font-medium">{sorteio.cliente.nome}</div>
                          <div className="text-sm text-muted-foreground">
                            {formatPhone(sorteio.cliente.whatsapp)} • Cupom: {sorteio.numero_sorteado}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {new Date(sorteio.data_sorteio).toLocaleString("pt-BR")} • ID: {sorteio.id.toString().slice(0, 4)}
                          </div>
                        </div>
                      </div>
                      <Badge variant="outline">Ganhador</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <RaffleFullscreenStage
        open={stageOpen}
        onOpenChange={handleStageOpenChange}
        estado={stageEstado}
        vencedor={stageWinner}
        onNovoSorteio={handleNovoSorteioNoStage}
        onVoltar={handleVoltarAoPainel}
        canSortearNovamente={cuponsDisponiveisCount > 0}
        isProcessing={isSorteando}
      />
    </div>
  );
}

function StatsCard({
  icon: Icon,
  title,
  value,
  description,
  accent,
}: {
  icon: typeof Gift;
  title: string;
  value: number;
  description: string;
  accent?: boolean;
}) {
  return (
    <Card className={accent ? "border-[#00C2FF]/40 bg-[#006CFF]/5" : ""}>
      <CardContent className="flex items-start gap-4 p-6">
        <div className={`rounded-2xl bg-[#006CFF]/10 p-3 text-[#006CFF] ${accent ? "shadow-[0_0_25px_rgba(0,194,255,0.35)]" : ""}`}>
          <Icon className="h-6 w-6" aria-hidden="true" />
        </div>
        <div className="space-y-1 text-left">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-3xl font-semibold text-[#0A1F44] dark:text-white">{value}</p>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function LastWinnerBanner({
  ganhador,
  onVerHistorico,
}: {
  ganhador: CupomParaSorteio;
  onVerHistorico: () => void;
}) {
  return (
    <div className="flex flex-col justify-between gap-4 rounded-3xl border border-[#00C2FF]/30 bg-[#006CFF]/5 p-6 shadow-sm md:flex-row md:items-center">
      <div className="space-y-1 text-left">
        <div className="flex items-center gap-2 text-[#006CFF]">
          <span aria-hidden="true">🎉</span>
          <span className="text-sm font-semibold uppercase tracking-[0.35em]">Último ganhador</span>
        </div>
        <p className="text-xl font-semibold text-[#0A1F44] dark:text-white">{ganhador.cliente.nome}</p>
        <p className="text-sm text-muted-foreground">{formatPhone(ganhador.cliente.whatsapp)} • Cupom {ganhador.numero_sorte}</p>
      </div>
      <Button variant="link" className="text-[#006CFF]" onClick={onVerHistorico}>
        Ver histórico
      </Button>
    </div>
  );
}
