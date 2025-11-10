import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Users, Download, Search, RefreshCw, UserPlus, Receipt } from "lucide-react";
import { useGraphQLQuery } from "@/hooks/useGraphQL";
import { GET_ALL_CLIENTES_ADMIN_SIMPLE, GET_PADARIAS, GET_ADMIN_DASHBOARD_METRICS } from "@/graphql/queries";
import { formatPhone, maskCPF } from "@/utils/formatters";
import { AdminNovoClienteModal } from "@/components/admin/AdminNovoClienteModal";
import { AdminCupomModal } from "@/components/admin/AdminCupomModal";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Trash2, Save, X } from "lucide-react";
import { useGraphQLMutation } from "@/hooks/useGraphQL";
import { UPDATE_CLIENTE, DELETE_CLIENTE } from "@/graphql/queries";
import { toast } from "sonner";
import { format } from "date-fns";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function Participantes() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPadaria, setSelectedPadaria] = useState<string>("all");
  const [padariaSearchTerm, setPadariaSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [showNovoClienteModal, setShowNovoClienteModal] = useState(false);
  const [showCupomModal, setShowCupomModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedCliente, setSelectedCliente] = useState<any>(null);
  const [editedCliente, setEditedCliente] = useState<any>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isEditingPadaria, setIsEditingPadaria] = useState(false);

  const itemsPerPage = 10;

  // Mutation para atualizar cliente
  const { mutate: updateCliente, isPending: isUpdating } = useGraphQLMutation(UPDATE_CLIENTE, {
    invalidateQueries: [['clientes-admin']],
    onSuccess: () => {
      toast.success('Cliente atualizado com sucesso!');
      setShowDetailsModal(false);
      refetchClientes();
    },
    onError: () => {
      toast.error('Erro ao atualizar cliente');
    }
  });

  // Mutation para deletar cliente
  const { mutate: deleteCliente, isPending: isDeleting } = useGraphQLMutation(DELETE_CLIENTE, {
    invalidateQueries: [['clientes-admin'], ['admin-metrics']],
    onSuccess: () => {
      toast.success('Cliente excluído com sucesso!');
      setShowDetailsModal(false);
      setShowDeleteConfirm(false);
      refetchClientes();
      refetchMetrics();
    },
    onError: () => {
      toast.error('Erro ao excluir cliente');
    }
  });

  // Buscar dados dos clientes
  const { data: clientesData, isLoading: clientesLoading, refetch: refetchClientes } = useGraphQLQuery<{
    clientes: any[]
  }>(
    ['clientes-admin'],
    GET_ALL_CLIENTES_ADMIN_SIMPLE
  );

  // Buscar lista de padarias para o filtro
  const { data: padariasData, isLoading: padariasLoading } = useGraphQLQuery<{
    padarias: any[]
  }>(
    ['padarias-list'],
    GET_PADARIAS
  );

  // Buscar métricas do dashboard
  const { data: metricsData, isLoading: metricsLoading, refetch: refetchMetrics } = useGraphQLQuery<{
    clientes_aggregate: { aggregate: { count: number } };
    cupons_aggregate: { aggregate: { count: number } };
    cupons: any[];
  }>(
    ['admin-metrics'],
    GET_ADMIN_DASHBOARD_METRICS
  );

  // Debug temporário
  console.log('🔍 Debug Participantes:', {
    clientesLoading,
    clientesData: (clientesData as any)?.clientes?.length || 0,
    padariasLoading,
    padariasData: (padariasData as any)?.padarias?.length || 0,
    metricsLoading,
    metricsData: metricsData ? 'loaded' : 'not loaded',
    firstCliente: (clientesData as any)?.clientes?.[0]
  });


  const refreshData = async () => {
    setIsLoading(true);
    try {
      await Promise.all([
        refetchClientes(),
        refetchMetrics()
      ]);
      setLastUpdate(new Date());
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(0);
  };

  const handlePadariaFilter = (value: string) => {
    setSelectedPadaria(value);
    setCurrentPage(0);
  };

  // Filtrar padarias pela busca
  const padariasFiltradas = useMemo(() => {
    const padarias = padariasData?.padarias || [];
    if (!padariaSearchTerm) return padarias;
    
    return padarias.filter((padaria: any) => 
      padaria.nome?.toLowerCase().includes(padariaSearchTerm.toLowerCase())
    );
  }, [padariasData, padariaSearchTerm]);

  // Expandir clientes por padaria - cada cliente+padaria vira uma linha
  const clientesPorPadaria = useMemo(() => {
    const resultado: any[] = [];
    
    
    ((clientesData as any)?.clientes || []).forEach((cliente: any) => {
      try {
        if (!cliente) return;
        
        // 1. Verificar se o cliente tem cupons ativos (mais flexível)
        const temCuponsAtivos = (cliente.cupons || []).some((cupom: any) => 
          cupom && cupom.status === "ativo"
        );
        
        
        // Se não tem cupons ativos, pular
        if (!temCuponsAtivos) return;
        
        // 2. Agrupar cupons por padaria
        const todosCupons = cliente.cupons || [];
        const cuponsAtivos = todosCupons.filter((cupom: any) => 
          cupom && cupom.status === "ativo"
        );
        
        if (cuponsAtivos.length === 0) return;
        
        // Agrupar cupons por padaria_id
        const cuponsPorPadaria = new Map<string, any[]>();
        cuponsAtivos.forEach((cupom: any) => {
          const padariaId = cupom.padaria_id || cliente.padaria_id || 'sem_padaria';
          if (!cuponsPorPadaria.has(padariaId)) {
            cuponsPorPadaria.set(padariaId, []);
          }
          cuponsPorPadaria.get(padariaId)!.push(cupom);
        });
        
        // Criar uma entrada para cada padaria (MESMO CLIENTE PODE APARECER MÚLTIPLAS VEZES)
        cuponsPorPadaria.forEach((cupons, padariaId) => {
          // Buscar nome da padaria
          const padaria = ((padariasData as any)?.padarias || []).find((p: any) => p.id === padariaId);
          
          resultado.push({
            ...cliente,
            padariaVinculada: padaria?.nome || cliente.padaria?.nome || 'N/A',
            padariaVinculadaId: padariaId,
            cuponsNestaPadaria: cupons,
            totalCuponsNestaPadaria: cupons.length,
            ultimaSubmissaoNestaPadaria: cupons.length > 0 
              ? new Date(cupons.sort((a, b) => new Date(b.data_compra).getTime() - new Date(a.data_compra).getTime())[0].data_compra).toLocaleDateString('pt-BR')
              : 'N/A',
            // Chave única para cada combinação cliente+padaria
            uniqueKey: `${cliente.id}-${padariaId}`
          });
        });
        } catch (error) {
        // Erro silencioso - cliente será ignorado
      }
    });
    
    console.log('🔍 Resultado final:', {
      totalLinhas: resultado.length,
      primeirasLinhas: resultado.slice(0, 3).map(r => ({
        nome: r.nome,
        padaria: r.padariaVinculada,
        cupons: r.totalCuponsNestaPadaria,
        uniqueKey: r.uniqueKey
      }))
    });
    
    return resultado;
  }, [clientesData, padariasData]);

  // Filtrar participantes expandidos
  const participantesFiltrados = clientesPorPadaria.filter((participante: any) => {
    try {
      const matchesSearch = !searchTerm || 
        (participante.nome && participante.nome.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (participante.cpf && participante.cpf.includes(searchTerm)) ||
        (participante.whatsapp && participante.whatsapp.includes(searchTerm)) ||
        (participante.padariaVinculada && participante.padariaVinculada.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesPadaria = selectedPadaria === "all" || participante.padariaVinculadaId === selectedPadaria;
      
      return matchesSearch && matchesPadaria;
      } catch (error) {
        return false;
      }
  });

  // Fallback: se não há participantes processados, mostrar clientes simples
  const clientesFallback = useMemo(() => {
    if (participantesFiltrados.length > 0) return [];
    
    return (clientesData?.clientes || []).map((cliente: any) => {
      const cuponsAtivos = (cliente.cupons || []).filter((cupom: any) => 
        cupom && cupom.status === "ativo"
      );
      
      return {
        ...cliente,
        padariaVinculada: cliente.padaria?.nome || 'N/A',
        padariaVinculadaId: cliente.padaria_id || 'sem_padaria',
        cuponsNestaPadaria: cuponsAtivos,
        totalCuponsNestaPadaria: cuponsAtivos.length,
        ultimaSubmissaoNestaPadaria: cuponsAtivos.length > 0 
          ? new Date(cuponsAtivos.sort((a: any, b: any) => new Date(b.data_compra).getTime() - new Date(a.data_compra).getTime())[0].data_compra).toLocaleDateString('pt-BR')
          : 'N/A',
        // Chave única para cada combinação cliente+padaria
        uniqueKey: `${cliente.id}-${cliente.padaria_id || 'sem_padaria'}`
      };
    });
  }, [clientesData, participantesFiltrados.length]);

  console.log('🔍 Fallback check:', {
    participantesFiltrados: participantesFiltrados.length,
    clientesFallback: clientesFallback.length
  });

  // Usar fallback se não há participantes processados
  const clientesParaExibir = participantesFiltrados.length > 0 ? participantesFiltrados : clientesFallback;
  
  const totalClientes = clientesParaExibir.length;
  const totalPages = Math.ceil(totalClientes / itemsPerPage);
  
  // Paginar resultados filtrados
  const clientes = clientesParaExibir.slice(
    currentPage * itemsPerPage, 
    (currentPage + 1) * itemsPerPage
  );

  // Calcular métricas no frontend - APENAS CUPONS ATIVOS
  const totalParticipantes = participantesFiltrados.length; // Apenas participantes com cupons ativos
  const totalCupons = (metricsData?.cupons || []).filter((cupom: any) => 
    cupom.status === "ativo" 
  ).length || 0;
  
  // Calcular cupons de hoje - APENAS CUPONS ATIVOS
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const cuponsHoje = (metricsData?.cupons || []).filter((cupom: any) => {
    const dataCupom = new Date(cupom.data_compra);
    return dataCupom >= hoje && cupom.status === "ativo" && cupom.valor_compra !== "0";
  }).length || 0;
  
  const mediaCupons = totalParticipantes > 0 ? (totalCupons / totalParticipantes).toFixed(1) : "0.0";

  // Função para obter última submissão de cupom
  const getUltimaSubmissao = (cupons: any[]) => {
    if (!cupons || cupons.length === 0) return "N/A";
    const ultimoCupom = cupons.sort((a, b) => new Date(b.data_compra).getTime() - new Date(a.data_compra).getTime())[0];
    return new Date(ultimoCupom.data_compra).toLocaleDateString('pt-BR');
  };

  // Função para exportar CSV
  const exportarCSV = () => {
    const headers = [
      "Nome",
      "CPF",
      "WhatsApp",
      "Padaria Vinculada",
      "Total de Cupons (nesta padaria)",
      "Última Submissão (nesta padaria)"
    ];

    const rows = participantesFiltrados.map((participante: any) => [
      `"${participante.nome}"`,
      participante.cpf,
      participante.whatsapp,
      `"${participante.padariaVinculada}"`,
      participante.totalCuponsNestaPadaria,
      participante.ultimaSubmissaoNestaPadaria
    ].join(","));

    const csvContent = [headers.join(","), ...rows].join("\n");
    const BOM = "\uFEFF";
    const blob = new Blob([BOM + csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `participantes_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Função para calcular a padaria com mais cupons
  const calcularPadariaComMaisCupons = (cliente: any) => {
    if (!cliente.cupons || cliente.cupons.length === 0) return null;
    
    const cuponsAtivos = cliente.cupons.filter((cupom: any) => cupom.status === "ativo");
    if (cuponsAtivos.length === 0) return null;
    
    // Agrupar cupons por padaria
    const cuponsPorPadaria = new Map<string, number>();
    cuponsAtivos.forEach((cupom: any) => {
      const padariaId = cupom.padaria_id || cliente.padaria_id;
      if (padariaId) {
        cuponsPorPadaria.set(padariaId, (cuponsPorPadaria.get(padariaId) || 0) + 1);
      }
    });
    
    // Encontrar a padaria com mais cupons
    let padariaComMaisCupons = null;
    let maxCupons = 0;
    
    cuponsPorPadaria.forEach((quantidade, padariaId) => {
      if (quantidade > maxCupons) {
        maxCupons = quantidade;
        padariaComMaisCupons = padariaId;
      }
    });
    
    return padariaComMaisCupons;
  };

  // Função para abrir detalhes do cliente
  const verDetalhes = (cliente: any) => {
    setSelectedCliente(cliente);
    
    // Fazer vinculação automática baseada nos cupons
    const padariaComMaisCupons = calcularPadariaComMaisCupons(cliente);
    const clienteComPadariaAtualizada = {
      ...cliente,
      padaria_id: padariaComMaisCupons || cliente.padaria_id
    };
    
    setEditedCliente(clienteComPadariaAtualizada);
    setIsEditingPadaria(false);
    setShowDetailsModal(true);
    
    // Mostrar feedback se a vinculação foi alterada
    if (padariaComMaisCupons && padariaComMaisCupons !== cliente.padaria_id) {
      const padaria = padariasData?.padarias?.find((p: any) => p.id === padariaComMaisCupons);
      toast.success(`Padaria automaticamente vinculada: ${padaria?.nome || 'N/A'}`);
    }
  };

  // Função para salvar alterações
  const salvarAlteracoes = () => {
    if (!editedCliente) return;

    updateCliente({
      id: editedCliente.id,
      changes: {
        nome: editedCliente.nome,
        cpf: editedCliente.cpf,
        whatsapp: editedCliente.whatsapp,
        padaria_id: editedCliente.padaria_id
      }
    });
  };

  // Função para vincular automaticamente à padaria com mais cupons
  const vincularPadariaAutomatica = () => {
    if (!editedCliente) return;
    
    const padariaComMaisCupons = calcularPadariaComMaisCupons(editedCliente);
    if (padariaComMaisCupons) {
      setEditedCliente({ ...editedCliente, padaria_id: padariaComMaisCupons });
      toast.success('Padaria vinculada automaticamente baseada nos cupons!');
    } else {
      toast.error('Não foi possível determinar a padaria com mais cupons');
    }
  };

  // Função para confirmar exclusão
  const confirmarExclusao = () => {
    if (!selectedCliente) return;
    deleteCliente({ id: selectedCliente.id });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-primary">
            {participantesFiltrados.length > 0 ? "Participantes por Padaria" : "Todos os Clientes"}
          </h1>
          <p className="text-sm md:text-base text-muted-foreground">
            {participantesFiltrados.length > 0 
              ? "Visualize participantes agrupados por padaria (mesmo cliente pode aparecer múltiplas vezes)" 
              : "Visualize todos os clientes cadastrados (alguns podem não ter cupons ativos)"
            } • Última atualização: {lastUpdate.toLocaleTimeString()}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 flex-wrap">
          <Button 
            onClick={() => setShowNovoClienteModal(true)}
            className="bg-green-600 hover:bg-green-700 text-white w-full sm:w-auto"
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Criar Cliente
          </Button>
          <Button 
            onClick={() => setShowCupomModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white w-full sm:w-auto"
          >
            <Receipt className="w-4 h-4 mr-2" />
            Criar Cupom
          </Button>
          <Button 
            onClick={refreshData} 
            disabled={isLoading}
            variant="outline"
            className="transition-all duration-200 hover:scale-105 hover:shadow-sm w-full sm:w-auto"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
          <Button variant="outline" onClick={exportarCSV} className="w-full sm:w-auto">
            <Download className="w-4 h-4 mr-2" />
            Exportar lista (.CSV)
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Participantes Ativos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {metricsLoading ? "..." : totalParticipantes.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {cuponsHoje > 0 ? `+${cuponsHoje} cupons ativos hoje` : "Com cupons ativos"}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cupons Ativos</CardTitle>
            <Badge className="bg-secondary text-secondary-foreground">Validados</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-secondary">
              {metricsLoading ? "..." : totalCupons.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {cuponsHoje > 0 ? `+${cuponsHoje} hoje` : "Status: ativo"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Média por Participante</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-accent">
              {metricsLoading ? "..." : mediaCupons}
            </div>
            <p className="text-xs text-muted-foreground">cupons ativos por pessoa</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
        <div className="relative flex-1 w-full lg:max-w-sm">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Buscar por nome, CPF, WhatsApp ou padaria..." 
            className="pl-10"
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
          />
        </div>
        
        {/* Filtro de Padarias com Busca */}
        <div className="flex flex-col gap-2 w-full lg:w-[300px]">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Buscar padaria..." 
              className="pl-10"
              value={padariaSearchTerm}
              onChange={(e) => setPadariaSearchTerm(e.target.value)}
            />
          </div>
          <Select value={selectedPadaria} onValueChange={handlePadariaFilter}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Filtrar por padaria" />
            </SelectTrigger>
            <SelectContent className="max-h-[300px]">
              <SelectItem value="all">Todas as padarias</SelectItem>
              {padariasFiltradas.map((padaria: any) => (
                <SelectItem key={padaria.id} value={padaria.id}>
                  {padaria.nome}
                </SelectItem>
              ))}
              {padariasFiltradas.length === 0 && padariaSearchTerm && (
                <div className="py-6 text-center text-sm text-muted-foreground">
                  Nenhuma padaria encontrada
                </div>
              )}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Participants Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            {participantesFiltrados.length > 0 ? "Lista de Participantes por Padaria" : "Lista de Todos os Clientes"}
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            {participantesFiltrados.length > 0 
              ? `${totalClientes} entradas encontradas (agrupadas por padaria)`
              : `${totalClientes} clientes encontrados (mostrando todos, incluindo sem cupons ativos)`
            }
          </p>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {clientesLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <p className="ml-2">Carregando participantes...</p>
            </div>
          ) : clientes.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <p className="text-muted-foreground">Nenhum participante encontrado</p>
            </div>
          ) : (
            <>
              <div className="min-w-[800px]">
                <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome Completo</TableHead>
                    <TableHead>CPF</TableHead>
                    <TableHead>WhatsApp</TableHead>
                    <TableHead>Padaria Vinculada</TableHead>
                    <TableHead>Cupons Ativos (nesta padaria)</TableHead>
                    <TableHead>Última Submissão (nesta padaria)</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clientes.map((participante: any) => (
                    <TableRow key={participante.uniqueKey}>
                      <TableCell className="font-medium">{participante.nome}</TableCell>
                      <TableCell>{maskCPF(participante.cpf)}</TableCell>
                      <TableCell>{formatPhone(participante.whatsapp)}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="border-blue-200 text-blue-700">
                          {participante.padariaVinculada}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant="outline" 
                          className={participante.totalCuponsNestaPadaria > 0 
                            ? "text-secondary border-secondary" 
                            : "text-muted-foreground border-muted-foreground"
                          }
                        >
                          {participante.totalCuponsNestaPadaria}
                          {participante.totalCuponsNestaPadaria === 0 && " (sem cupons ativos)"}
                        </Badge>
                      </TableCell>
                      <TableCell>{participante.ultimaSubmissaoNestaPadaria}</TableCell>
                      <TableCell>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => verDetalhes(participante)}
                        >
                          Ver detalhes
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-muted-foreground">
                    Página {currentPage + 1} de {totalPages}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                      disabled={currentPage === 0}
                    >
                      Anterior
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))}
                      disabled={currentPage >= totalPages - 1}
                    >
                      Próxima
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Modals */}
      <AdminNovoClienteModal
        open={showNovoClienteModal}
        onOpenChange={setShowNovoClienteModal}
        onClienteAdded={(_novoCliente) => {
          refetchClientes();
          refetchMetrics();
          setLastUpdate(new Date());
        }}
      />

      <AdminCupomModal
        open={showCupomModal}
        onOpenChange={setShowCupomModal}
        onCupomCadastrado={() => {
          refetchClientes();
          refetchMetrics();
          setLastUpdate(new Date());
          setShowCupomModal(false);
        }}
      />

      {/* Modal de Detalhes do Cliente */}
      <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl flex items-center gap-2">
              <Users className="w-6 h-6 text-primary" />
              Detalhes do Participante
            </DialogTitle>
            <DialogDescription>
              Visualize e edite as informações do cliente
            </DialogDescription>
          </DialogHeader>

          {selectedCliente && editedCliente && (
            <div className="space-y-6 py-4">
              {/* Informações Básicas */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Informações Básicas</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="nome">Nome Completo</Label>
                    <Input
                      id="nome"
                      value={editedCliente.nome || ''}
                      onChange={(e) => setEditedCliente({ ...editedCliente, nome: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cpf">CPF</Label>
                    <Input
                      id="cpf"
                      value={editedCliente.cpf || ''}
                      onChange={(e) => setEditedCliente({ ...editedCliente, cpf: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="whatsapp">WhatsApp</Label>
                    <Input
                      id="whatsapp"
                      value={editedCliente.whatsapp || ''}
                      onChange={(e) => setEditedCliente({ ...editedCliente, whatsapp: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Label>Padaria</Label>
                      {(() => {
                        const padariaComMaisCupons = calcularPadariaComMaisCupons(selectedCliente);
                        const foiAlterada = padariaComMaisCupons && padariaComMaisCupons !== selectedCliente.padaria_id;
                        return foiAlterada && (
                          <Badge variant="secondary" className="text-xs">
                            Auto-vinculada
                          </Badge>
                        );
                      })()}
                    </div>
                    {isEditingPadaria ? (
                      <div className="space-y-2">
                        <Select
                          value={editedCliente.padaria_id || ''}
                          onValueChange={(value) => setEditedCliente({ ...editedCliente, padaria_id: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione uma padaria" />
                          </SelectTrigger>
                          <SelectContent className="max-h-[200px]">
                            {padariasData?.padarias?.map((padaria: any) => (
                              <SelectItem key={padaria.id} value={padaria.id}>
                                {padaria.nome}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={vincularPadariaAutomatica}
                            className="text-xs"
                          >
                            Auto-vincular por cupons
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setIsEditingPadaria(false)}
                          >
                            Cancelar
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Input
                          value={(() => {
                            const padaria = padariasData?.padarias?.find((p: any) => p.id === editedCliente.padaria_id);
                            return padaria?.nome || 'N/A';
                          })()}
                          disabled
                          className="bg-muted"
                        />
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setIsEditingPadaria(true)}
                        >
                          Editar
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <Separator />

              {/* Informação sobre Vinculação Automática */}
              {(() => {
                const padariaComMaisCupons = calcularPadariaComMaisCupons(selectedCliente);
                const foiAlterada = padariaComMaisCupons && padariaComMaisCupons !== selectedCliente.padaria_id;
                
                if (foiAlterada) {
                  const padaria = padariasData?.padarias?.find((p: any) => p.id === padariaComMaisCupons);
                  return (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <h4 className="font-medium text-blue-900">Vinculação Automática Aplicada</h4>
                      </div>
                      <p className="text-sm text-blue-700">
                        A padaria foi automaticamente vinculada para <strong>{padaria?.nome || 'N/A'}</strong> baseada na análise dos cupons ativos. 
                        Você pode alterar manualmente se necessário.
                      </p>
                    </div>
                  );
                }
                return null;
              })()}

              <Separator />

              {/* Análise de Cupons por Padaria */}
              {editedCliente.cupons && editedCliente.cupons.filter((c: any) => c.status === "ativo").length > 0 && (
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">Análise de Cupons por Padaria</h3>
                  <div className="bg-muted/50 p-4 rounded-lg">
                    <p className="text-sm text-muted-foreground mb-3">
                      Distribuição de cupons ativos por padaria:
                    </p>
                    <div className="space-y-2">
                      {(() => {
                        const cuponsAtivos = editedCliente.cupons.filter((c: any) => c.status === "ativo");
                        const cuponsPorPadaria = new Map<string, { count: number; nome: string }>();
                        
                        cuponsAtivos.forEach((cupom: any) => {
                          const padariaId = cupom.padaria_id || editedCliente.padaria_id;
                          if (padariaId) {
                            const padaria = padariasData?.padarias?.find((p: any) => p.id === padariaId);
                            const nome = padaria?.nome || 'Padaria não encontrada';
                            
                            if (!cuponsPorPadaria.has(padariaId)) {
                              cuponsPorPadaria.set(padariaId, { count: 0, nome });
                            }
                            cuponsPorPadaria.get(padariaId)!.count++;
                          }
                        });
                        
                        return Array.from(cuponsPorPadaria.entries())
                          .sort((a, b) => b[1].count - a[1].count)
                          .map(([padariaId, data]) => {
                            const padariaComMaisCupons = calcularPadariaComMaisCupons(selectedCliente);
                            const foiAlterada = padariaComMaisCupons && padariaComMaisCupons !== selectedCliente.padaria_id;
                            const isAutoVinculada = foiAlterada && padariaId === padariaComMaisCupons;
                            
                            return (
                              <div key={padariaId} className={`flex justify-between items-center p-2 rounded ${
                                isAutoVinculada ? 'bg-blue-50 border border-blue-200' : 'bg-background'
                              }`}>
                                <div className="flex items-center gap-2">
                                  <span className="text-sm">{data.nome}</span>
                                  {isAutoVinculada && (
                                    <Badge variant="secondary" className="text-xs">
                                      Auto-vinculada
                                    </Badge>
                                  )}
                                </div>
                                <Badge variant={padariaId === editedCliente.padaria_id ? "default" : "outline"}>
                                  {data.count} cupons
                                  {padariaId === editedCliente.padaria_id && " (atual)"}
                                </Badge>
                              </div>
                            );
                          });
                      })()}
                    </div>
                  </div>
                </div>
              )}

              <Separator />

              {/* Lista de Cupons */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Cupons Ativos do Cliente ({selectedCliente.cupons?.filter((c: any) => c.status === "ativo").length || 0})</h3>
                {selectedCliente.cupons && selectedCliente.cupons.filter((c: any) => c.status === "ativo").length > 0 ? (
                  <div className="max-h-[200px] overflow-y-auto border rounded-lg">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Nº da Sorte</TableHead>
                          <TableHead>Nº da Série</TableHead>
                          <TableHead>Valor</TableHead>
                          <TableHead>Data</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedCliente.cupons
                          .filter((cupom: any) => cupom.status === "ativo")
                          .map((cupom: any) => (
                          <TableRow key={cupom.id}>
                            <TableCell className="font-mono">{cupom.numero_sorte}</TableCell>
                            <TableCell className="font-mono">{cupom.serie || 'N/A'}</TableCell>
                            <TableCell>R$ {Number((cupom.valor_compra)/100).toFixed(2).replace('.', ',')}</TableCell>
                            <TableCell>
                              {cupom.data_compra ? format(new Date(cupom.data_compra), 'dd/MM/yyyy HH:mm') : 'N/A'}
                            </TableCell>
                            <TableCell>
                              <Badge variant="default" className="bg-green-100 text-green-800">
                              {cupom.status.toUpperCase() === "ATIVO" ? "Ativo" : "Inativo"}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Nenhum cupom ativo cadastrado
                  </p>
                )}
              </div>

              <Separator />

              {/* Zona de Perigo */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg text-destructive">Zona de Perigo</h3>
                {!showDeleteConfirm ? (
                  <Button
                    variant="destructive"
                    onClick={() => setShowDeleteConfirm(true)}
                    className="w-full"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Excluir Cliente
                  </Button>
                ) : (
                  <div className="border border-destructive rounded-lg p-4 space-y-3">
                    <p className="text-sm font-semibold text-destructive">
                      ⚠️ Tem certeza que deseja excluir este cliente?
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Isso também excluirá todos os {selectedCliente.cupons?.filter((c: any) => c.status === "ativo").length || 0} cupons ativos associados. Esta ação não pode ser desfeita.
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="destructive"
                        onClick={confirmarExclusao}
                        disabled={isDeleting}
                        className="flex-1"
                      >
                        {isDeleting ? "Excluindo..." : "Sim, excluir permanentemente"}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setShowDeleteConfirm(false)}
                        className="flex-1"
                      >
                        Cancelar
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowDetailsModal(false);
                setShowDeleteConfirm(false);
                setIsEditingPadaria(false);
              }}
            >
              <X className="w-4 h-4 mr-2" />
              Fechar
            </Button>
            <Button
              onClick={salvarAlteracoes}
              disabled={isUpdating}
              className="bg-primary"
            >
              <Save className="w-4 h-4 mr-2" />
              {isUpdating ? "Salvando..." : "Salvar Alterações"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}