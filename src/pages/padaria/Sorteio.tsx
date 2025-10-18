import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import {
  CupomParaSorteio,
  Sorteio,
  useCuponsParaSorteio,
  useHistoricoSorteios,
  useParticipantesSorteio,
  useSalvarSorteioPadaria,
} from "@/hooks/useCupons";
import { formatCPF, formatPhone, maskCPF } from "@/utils/formatters";
import {
  Gift,
  History,
  RotateCcw,
  Shuffle,
  Trophy,
  Users,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { RaffleFullscreenStage, type RaffleWinner } from "@/components/sorteio/RaffleFullscreenStage";
import { SortearButton } from "@/components/sorteio/SortearButton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const COLUMN_STAGGER = 140;

export function PadariaSorteio() {
  const [activeTab, setActiveTab] = useState("sorteio");
  const [cuponsSorteados, setCuponsSorteados] = useState<Set<string>>(new Set());
  const [ultimoGanhador, setUltimoGanhador] = useState<CupomParaSorteio | null>(null);
  const [isSorteando, setIsSorteando] = useState(false);
  const [usuariosGanhadores, setUsuariosGanhadores] = useState<Set<string>>(new Set());
  const [sorteioSelecionado, setSorteioSelecionado] = useState<Sorteio | null>(null);
  const [detalhesAberto, setDetalhesAberto] = useState(false);

  const [stageOpen, setStageOpen] = useState(false);
  const [stageEstado, setStageEstado] = useState<"idle" | "spinning" | "revealing" | "done">("idle");
  const [stageWinner, setStageWinner] = useState<RaffleWinner | undefined>();
  const revealTimeoutRef = useRef<number>();

  const { user } = useAuth();
  const { toast } = useToast();

  const padariaId = user?.padarias_id ?? undefined;

  const {
    data: cuponsData,
    isLoading: cuponsLoading,
    refetch: refetchCupons,
  } = useCuponsParaSorteio(padariaId);
  const { data: participantesData, isLoading: participantesLoading } = useParticipantesSorteio();
  const {
    data: historicoData,
    isLoading: historicoLoading,
    error: historicoError,
  } = useHistoricoSorteios(padariaId);
  const { mutateAsync: salvarSorteioPadaria } = useSalvarSorteioPadaria(padariaId);

  useEffect(() => {
    if (!historicoData?.sorteios?.length) {
      return;
    }

    setCuponsSorteados((prev) => {
      const atualizados = new Set(prev);
      historicoData.sorteios.forEach((sorteio) => {
        if (sorteio?.numero_sorteado) {
          atualizados.add(sorteio.numero_sorteado);
        }
      });
      return atualizados;
    });

    setUsuariosGanhadores((prev) => {
      const atualizados = new Set(prev);
      historicoData.sorteios.forEach((sorteio) => {
        if (sorteio?.ganhador_id) {
          atualizados.add(sorteio.ganhador_id);
        }
      });
      return atualizados;
    });
  }, [historicoData?.sorteios]);

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
  const historicoSorteios = historicoData?.sorteios ?? [];

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
      if (!padariaId) {
        throw new Error("Padaria não encontrada para registrar o sorteio.");
      }

      const dataSorteio = new Date().toISOString();

      const resultado = await salvarSorteioPadaria({
        numero_sorteado: cupomSorteado.numero_sorte,
        ganhador_id: cupomSorteado.cliente.id,
        data_sorteio: dataSorteio,
        padaria_id: padariaId,
      });

      const clienteDoSorteio = resultado?.insert_sorteios_one?.cliente ?? cupomSorteado.cliente;

      setCuponsSorteados((prev) => new Set([...prev, cupomSorteado.numero_sorte]));
      setUsuariosGanhadores((prev) => {
        const atualizados = new Set(prev);
        atualizados.add(cupomSorteado.cliente_id);
        atualizados.add(clienteDoSorteio.id);
        return atualizados;
      });
      setUltimoGanhador({
        ...cupomSorteado,
        cliente: clienteDoSorteio,
      });

      setStageWinner({
        numero: String(cupomSorteado.numero_sorte).padStart(5, "0"),
        nome: clienteDoSorteio.nome,
        telefone: clienteDoSorteio.whatsapp ? formatPhone(clienteDoSorteio.whatsapp) : "",
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
          description: `${clienteDoSorteio.nome} foi sorteado com o cupom ${cupomSorteado.numero_sorte}`,
        });
      }, COLUMN_STAGGER * 4 + 900);
    } catch (error) {
      console.error("Erro ao realizar sorteio:", error);
      toast({
        title: "Erro",
        description:
          error instanceof Error && error.message
            ? error.message
            : "Erro ao realizar o sorteio. Tente novamente.",
        variant: "destructive",
      });
      setStageOpen(false);
      setStageEstado("idle");
    } finally {
      setIsSorteando(false);
    }
  }, [cuponsDisponiveis, padariaId, salvarSorteioPadaria, toast]);

  const iniciarNovoSorteio = useCallback(() => {
    setCuponsSorteados(new Set());
    setUsuariosGanhadores(new Set());
    setUltimoGanhador(null);
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
      novos.delete(ultimoGanhador.cliente.id);
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
          <Gift className="h-8 w-8 text-primary" />
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

          <Card className="border-secondary/40 bg-secondary/10 shadow-sm backdrop-blur dark:bg-secondary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-foreground">
                <Shuffle className="h-5 w-5" />
                Controles do sorteio
              </CardTitle>
              <CardDescription>Mantenha a ordem das rodadas e gerencie reinícios</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 md:flex-row">
              <Button
                onClick={continuarSorteio}
                disabled={!ultimoGanhador}
                className="flex-1 bg-primary text-primary-foreground shadow-sm transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                <RotateCcw className="mr-2 h-4 w-4" />
                Continuar sorteio
              </Button>
              <Button
                onClick={iniciarNovoSorteio}
                variant="outline"
                className="flex-1 border-primary text-primary transition hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
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
              {historicoLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary" />
                </div>
              ) : historicoError ? (
                <div className="py-8 text-center text-destructive">
                  Não foi possível carregar o histórico de sorteios.
                </div>
              ) : historicoSorteios.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">Nenhum sorteio registrado ainda</div>
              ) : (
                <div className="space-y-3">
                  {historicoSorteios.map((sorteio) => {
                    const cliente = sorteio.cliente;
                    const dataSorteio = sorteio.data_sorteio
                      ? new Date(sorteio.data_sorteio).toLocaleString("pt-BR")
                      : "Data não disponível";

                    return (
                      <div key={sorteio.id} className="flex items-center justify-between rounded-lg border p-3">
                        <div className="flex items-center gap-3">
                          <div>
                            <div className="font-medium">{cliente?.nome || "Cliente não encontrado"}</div>
                            <div className="text-sm text-muted-foreground">
                              {cliente?.whatsapp ? `${formatPhone(cliente.whatsapp)} • ` : ""}
                              Cupom: {sorteio.numero_sorteado || "N/A"}
                            </div>
                            {cliente?.cpf && (
                              <div className="text-sm text-muted-foreground">CPF: {maskCPF(cliente.cpf)}</div>
                            )}
                            <div className="text-xs text-muted-foreground">
                              {dataSorteio} • ID: {sorteio.id?.slice(0, 4) || "--"}
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2 sm:flex-row sm:items-center">
                          <Badge variant="outline">Ganhador</Badge>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSorteioSelecionado(sorteio);
                              setDetalhesAberto(true);
                            }}
                          >
                            Ver detalhes
                          </Button>
                        </div>
                      </div>
                    );
                  })}
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

      <Dialog
        open={detalhesAberto}
        onOpenChange={(open) => {
          setDetalhesAberto(open);
          if (!open) {
            setSorteioSelecionado(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Detalhes do ganhador</DialogTitle>
            <DialogDescription>Informações completas do sorteio selecionado.</DialogDescription>
          </DialogHeader>
          {sorteioSelecionado ? (
            <div className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">Nome</p>
                <p className="text-base font-medium">{sorteioSelecionado.cliente?.nome ?? "Cliente não encontrado"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">CPF</p>
                <p className="text-base font-medium">
                  {sorteioSelecionado.cliente?.cpf
                    ? formatCPF(sorteioSelecionado.cliente.cpf)
                    : "CPF não informado"}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">WhatsApp</p>
                <p className="text-base font-medium">
                  {sorteioSelecionado.cliente?.whatsapp
                    ? formatPhone(sorteioSelecionado.cliente.whatsapp)
                    : "WhatsApp não informado"}
                </p>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                <div>
                  <p className="text-sm text-muted-foreground">Número do cupom</p>
                  <p className="text-base font-medium">{sorteioSelecionado.numero_sorteado}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Data do sorteio</p>
                  <p className="text-base font-medium">
                    {sorteioSelecionado.data_sorteio
                      ? new Date(sorteioSelecionado.data_sorteio).toLocaleString("pt-BR")
                      : "Data não disponível"}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Nenhum sorteio selecionado.</p>
          )}
        </DialogContent>
      </Dialog>
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
    <Card className={accent ? "border-accent/40 bg-accent/10" : ""}>
      <CardContent className="flex items-start gap-4 p-6">
        <div className={cn("rounded-2xl bg-primary/10 p-3 text-primary", accent && "shadow-[var(--shadow-number)]")}> 
          <Icon className="h-6 w-6" aria-hidden="true" />
        </div>
        <div className="space-y-1 text-left">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-3xl font-semibold text-foreground">{value}</p>
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
    <div className="flex flex-col justify-between gap-4 rounded-3xl border border-secondary/40 bg-secondary/10 p-6 shadow-sm md:flex-row md:items-center dark:bg-secondary/20">
      <div className="space-y-1 text-left">
        <div className="flex items-center gap-2 text-primary">
          <span aria-hidden="true">🎉</span>
          <span className="text-sm font-semibold uppercase tracking-[0.35em]">Último ganhador</span>
        </div>
        <p className="text-xl font-semibold text-foreground">{ganhador.cliente.nome}</p>
        <p className="text-sm text-muted-foreground">{formatPhone(ganhador.cliente.whatsapp)} • Cupom {ganhador.numero_sorte}</p>
      </div>
      <Button
        variant="link"
        className="text-primary hover:text-primary/80"
        onClick={onVerHistorico}
      >
        Ver histórico
      </Button>
    </div>
  );
}
