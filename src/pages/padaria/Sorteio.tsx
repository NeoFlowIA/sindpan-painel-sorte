import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { useCuponsParaSorteio, useHistoricoSorteios, useParticipantesSorteio, CupomParaSorteio, Sorteio, ParticipanteSorteio } from "@/hooks/useCupons";
import { formatPhone, maskCPF } from "@/utils/formatters";
import { useToast } from "@/hooks/use-toast";
import { 
  Gift, 
  Users, 
  History, 
  Shuffle, 
  RotateCcw,
  Trophy,
  Phone,
  User,
  Ticket
} from "lucide-react";

export function PadariaSorteio() {
  const [activeTab, setActiveTab] = useState("sorteio");
  const [cuponsSorteados, setCuponsSorteados] = useState<Set<string>>(new Set());
  const [ultimoGanhador, setUltimoGanhador] = useState<CupomParaSorteio | null>(null);
  const [isSorteando, setIsSorteando] = useState(false);
  
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Hooks para dados
  const { data: cuponsData, isLoading: cuponsLoading, refetch: refetchCupons } = useCuponsParaSorteio(user?.padarias_id || "");
  const { data: participantesData, isLoading: participantesLoading } = useParticipantesSorteio();
  
  // Estado local para histórico de sorteios (sem banco de dados)
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

  // Estado para controlar usuários que já ganharam (não podem mais participar)
  const [usuariosGanhadores, setUsuariosGanhadores] = useState<Set<number>>(new Set());

  // Carregar cupons já sorteados do histórico local
  useEffect(() => {
    if (historicoLocal.length > 0) {
      const cuponsSorteados = new Set(historicoLocal.map(s => s.numero_sorteado));
      setCuponsSorteados(cuponsSorteados);
    }
  }, [historicoLocal]);

  // Filtrar cupons disponíveis para sorteio (excluir cupons de usuários que já ganharam)
  const cuponsDisponiveis = cuponsData?.cupons?.filter(cupom => 
    !cuponsSorteados.has(cupom.numero_sorte) && 
    !usuariosGanhadores.has(cupom.cliente_id)
  ) || [];

  // Função para realizar o sorteio
  const realizarSorteio = async () => {
    if (cuponsDisponiveis.length === 0) {
      toast({
        title: "Nenhum cupom disponível",
        description: "Todos os cupons já foram sorteados. Inicie um novo sorteio.",
        variant: "destructive"
      });
      return;
    }

    setIsSorteando(true);
    
    // Simular animação de sorteio (2 segundos)
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Sortear um cupom aleatório
    const cupomSorteado = cuponsDisponiveis[Math.floor(Math.random() * cuponsDisponiveis.length)];
    
    try {
      // Salvar o sorteio no estado local (sem banco de dados)
      const novoSorteio = {
        id: `sorteio_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        data_sorteio: new Date().toISOString(),
        numero_sorteado: cupomSorteado.numero_sorte,
        ganhador_id: cupomSorteado.cliente_id,
        cliente: cupomSorteado.cliente
      };

      // Atualizar histórico local
      setHistoricoLocal(prev => [novoSorteio, ...prev]);
      
      // Atualizar estado local
      setCuponsSorteados(prev => new Set([...prev, cupomSorteado.numero_sorte]));
      setUsuariosGanhadores(prev => new Set([...prev, cupomSorteado.cliente_id]));
      setUltimoGanhador(cupomSorteado);

      toast({
        title: "Sorteio realizado!",
        description: `${cupomSorteado.cliente.nome} foi sorteado com o cupom ${cupomSorteado.numero_sorte}`,
      });

    } catch (error) {
      console.error("Erro ao realizar sorteio:", error);
      toast({
        title: "Erro",
        description: "Erro ao realizar o sorteio. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsSorteando(false);
    }
  };

  // Função para iniciar novo sorteio
  const iniciarNovoSorteio = () => {
    setCuponsSorteados(new Set());
    setUsuariosGanhadores(new Set()); // Limpar lista de usuários ganhadores
    setUltimoGanhador(null);
    setHistoricoLocal([]); // Limpar histórico local
    refetchCupons();
    
    toast({
      title: "Novo sorteio iniciado",
      description: "Todos os cupons estão disponíveis para sorteio novamente.",
    });
  };

  // Função para continuar sorteio (remover último ganhador)
  const continuarSorteio = () => {
    if (ultimoGanhador) {
      setCuponsSorteados(prev => {
        const novos = new Set(prev);
        novos.delete(ultimoGanhador.numero_sorte);
        return novos;
      });
      
      // Remover o usuário da lista de ganhadores para que ele possa participar novamente
      setUsuariosGanhadores(prev => {
        const novosUsuariosGanhadores = new Set(prev);
        novosUsuariosGanhadores.delete(ultimoGanhador.cliente_id);
        return novosUsuariosGanhadores;
      });
      
      setUltimoGanhador(null);
      
      toast({
        title: "Sorteio continuado",
        description: "O último ganhador foi removido e pode ser sorteado novamente.",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Gift className="w-8 h-8" />
          Sistema de Sorteio
        </h1>
        <p className="text-muted-foreground">
          Realize sorteios entre os cupons cadastrados
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="sorteio">Sorteio</TabsTrigger>
          <TabsTrigger value="participantes">Participantes</TabsTrigger>
          <TabsTrigger value="historico">Histórico</TabsTrigger>
        </TabsList>

        <TabsContent value="sorteio" className="space-y-6 mt-6">
          {/* Configurações do Sorteio */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Gift className="w-5 h-5" />
                Configurações do Sorteio
              </CardTitle>
              <CardDescription>
                Configure e realize sorteios entre os cupons cadastrados
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Controles do Sorteio */}
              <div className="flex gap-3">
                <Button 
                  onClick={realizarSorteio}
                  disabled={isSorteando || cuponsDisponiveis.length === 0}
                  className="flex-1"
                >
                  <Shuffle className="w-4 h-4 mr-2" />
                  {isSorteando ? "Sorteando..." : "Realizar Sorteio"}
                </Button>
                
                <Button 
                  onClick={continuarSorteio}
                  disabled={!ultimoGanhador}
                  variant="outline"
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Continuar Sorteio
                </Button>
                
                <Button 
                  onClick={iniciarNovoSorteio}
                  variant="outline"
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Novo Sorteio
                </Button>
              </div>

              {/* Estatísticas */}
              <div className="grid grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Total de Cupons</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{cuponsData?.cupons?.length || 0}</div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Cupons Disponíveis</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">{cuponsDisponiveis.length}</div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Cupons Sorteados</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-orange-600">{cuponsSorteados.size}</div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>

          {/* Último Ganhador */}
          {ultimoGanhador && (
            <Card className="border-green-200 bg-green-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-800">
                  <Trophy className="w-5 h-5" />
                  Último Ganhador
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    <span className="font-medium">{ultimoGanhador.cliente.nome}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    <span>{formatPhone(ultimoGanhador.cliente.whatsapp)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Ticket className="w-4 h-4" />
                    <span className="font-mono">Cupom: {ultimoGanhador.numero_sorte}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Lista de Cupons Disponíveis */}
          <Card>
            <CardHeader>
              <CardTitle>Cupons Disponíveis para Sorteio</CardTitle>
              <CardDescription>
                {cuponsDisponiveis.length} cupons disponíveis
              </CardDescription>
            </CardHeader>
            <CardContent>
              {cuponsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                  {cuponsDisponiveis.map((cupom) => (
                    <Badge key={cupom.id} variant="outline" className="justify-center">
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
                <Users className="w-5 h-5" />
                Participantes do Sorteio
              </CardTitle>
              <CardDescription>
                Clientes com cupons ativos
              </CardDescription>
            </CardHeader>
            <CardContent>
              {participantesLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : (
                <div className="space-y-3">
                  {participantesData?.clientes?.map((participante) => {
                    // Calcular cupons ativos do participante
                    const cuponsAtivos = cuponsData?.cupons?.filter(cupom => 
                      cupom.cliente_id === participante.id
                    ).length || 0;
                    
                    // Verificar se o participante ainda pode participar (não ganhou ainda)
                    const podeParticipar = !usuariosGanhadores.has(participante.id);
                    
                    // Só mostrar participantes com cupons ativos
                    if (cuponsAtivos === 0) return null;
                    
                    return (
                      <div key={participante.id} className={`flex items-center justify-between p-3 border rounded-lg ${!podeParticipar ? 'opacity-50 bg-muted' : ''}`}>
                        <div className="flex items-center gap-3">
                          <div>
                            <div className="font-medium flex items-center gap-2">
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
                        <Badge variant={podeParticipar ? "secondary" : "outline"}>
                          {cuponsAtivos} cupons
                        </Badge>
                      </div>
                    );
                  }).filter(Boolean)}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="historico" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="w-5 h-5" />
                Histórico de Sorteios
              </CardTitle>
              <CardDescription>
                Todos os sorteios realizados
              </CardDescription>
            </CardHeader>
            <CardContent>
              {historicoLocal.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhum sorteio realizado ainda
                </div>
              ) : (
                <div className="space-y-3">
                  {historicoLocal.map((sorteio) => (
                    <div key={sorteio.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div>
                          <div className="font-medium">{sorteio.cliente.nome}</div>
                          <div className="text-sm text-muted-foreground">
                            {formatPhone(sorteio.cliente.whatsapp)} • Cupom: {sorteio.numero_sorteado}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {new Date(sorteio.data_sorteio).toLocaleString('pt-BR')} • ID: {sorteio.id.toString().slice(0, 4)}
                          </div>
                        </div>
                      </div>
                      <Badge variant="outline">
                        Ganhador
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}