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
    
    (clientesData?.clientes || []).forEach((cliente: any) => {
      try {
        if (!cliente) return;
        
        // 1. Verificar se o cliente tem resposta "Na padaria"
        const respostaValida = cliente.resposta_pergunta === "Na padaria";
        if (!respostaValida) return;
        
        // 2. Agrupar cupons por padaria
        const cuponsAtivos = (cliente.cupons || []).filter((cupom: any) => 
          cupom && cupom.valor_compra !== "0" && cupom.status === "ativo"
        );
        
        if (cuponsAtivos.length === 0) return;
        
        // Debug: verificar se cupons têm padaria_id
        console.log('🔍 Cliente:', cliente.nome, 'Cupons ativos:', cuponsAtivos.map((c: any) => ({ 
          id: c.id, 
          padaria_id: c.padaria_id,
          numero_sorte: c.numero_sorte 
        })));
        
        // Agrupar cupons por padaria_id
        const cuponsPorPadaria = new Map<string, any[]>();
        cuponsAtivos.forEach((cupom: any) => {
          const padariaId = cupom.padaria_id || cliente.padaria_id || 'sem_padaria';
          if (!cuponsPorPadaria.has(padariaId)) {
            cuponsPorPadaria.set(padariaId, []);
          }
          cuponsPorPadaria.get(padariaId)!.push(cupom);
        });
        
        console.log('🔍 Cliente:', cliente.nome, 'Padarias encontradas:', Array.from(cuponsPorPadaria.keys()));
        
        // Criar uma entrada para cada padaria
        cuponsPorPadaria.forEach((cupons, padariaId) => {
          // Buscar nome da padaria
          const padaria = (padariasData?.padarias || []).find((p: any) => p.id === padariaId);
          
          resultado.push({
            ...cliente,
            padariaVinculada: padaria?.nome || cliente.padaria?.nome || 'N/A',
            padariaVinculadaId: padariaId,
            cuponsNestaPadaria: cupons,
            totalCuponsNestaPadaria: cupons.length,
            ultimaSubmissaoNestaPadaria: cupons.length > 0 
              ? new Date(cupons.sort((a, b) => new Date(b.data_compra).getTime() - new Date(a.data_compra).getTime())[0].data_compra).toLocaleDateString('pt-BR')
              : 'N/A'
          });
        });
      } catch (error) {
        console.error('Erro ao processar cliente:', error, cliente);
      }
    });
    
    console.log('🔍 Total de linhas geradas:', resultado.length);
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
      console.error('Erro ao filtrar participante:', error, participante);
      return false;
    }
  });

  const totalClientes = participantesFiltrados.length;
  const totalPages = Math.ceil(totalClientes / itemsPerPage);
  
  // Paginar resultados filtrados
  const clientes = participantesFiltrados.slice(
    currentPage * itemsPerPage, 
    (currentPage + 1) * itemsPerPage
  );

  // Calcular métricas no frontend
  const totalParticipantes = metricsData?.clientes_aggregate?.aggregate?.count || 0;
  const totalCupons = metricsData?.cupons_aggregate?.aggregate?.count || 0;
  
  // Calcular cupons de hoje
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const cuponsHoje = (metricsData?.cupons || []).filter((cupom: any) => {
    const dataCupom = new Date(cupom.data_compra);
    return dataCupom >= hoje;
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

  // Função para abrir detalhes do cliente
  const verDetalhes = (cliente: any) => {
    setSelectedCliente(cliente);
    setEditedCliente({ ...cliente });
    setShowDetailsModal(true);
  };

  // Função para salvar alterações
  const salvarAlteracoes = () => {
    if (!editedCliente) return;

    updateCliente({
      id: editedCliente.id,
      changes: {
        nome: editedCliente.nome,
        cpf: editedCliente.cpf,
        whatsapp: editedCliente.whatsapp
      }
    });
  };

  // Função para confirmar exclusão
  const confirmarExclusao = () => {
    if (!selectedCliente) return;
    deleteCliente({ id: selectedCliente.id });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-primary">Participantes</h1>
          <p className="text-muted-foreground">
            Gerencie todos os participantes da campanha • Última atualização: {lastUpdate.toLocaleTimeString()}
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={() => setShowNovoClienteModal(true)}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Criar Cliente
          </Button>
          <Button 
            onClick={() => setShowCupomModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Receipt className="w-4 h-4 mr-2" />
            Criar Cupom
          </Button>
          <Button 
            onClick={refreshData} 
            disabled={isLoading}
            variant="outline"
            className="transition-all duration-200 hover:scale-105 hover:shadow-sm"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
          <Button variant="outline" onClick={exportarCSV}>
            <Download className="w-4 h-4 mr-2" />
            Exportar lista (.CSV)
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Participantes</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {metricsLoading ? "..." : totalParticipantes.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {cuponsHoje > 0 ? `+${cuponsHoje} cupons hoje` : "Dados atualizados"}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cupons Validados</CardTitle>
            <Badge className="bg-secondary text-secondary-foreground">Total</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-secondary">
              {metricsLoading ? "..." : totalCupons.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {cuponsHoje > 0 ? `+${cuponsHoje} hoje` : "Todos os cupons"}
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
            <p className="text-xs text-muted-foreground">cupons por pessoa</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-4 items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Buscar por nome, CPF, WhatsApp ou padaria..." 
            className="pl-10"
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
          />
        </div>
        
        {/* Filtro de Padarias com Busca */}
        <div className="flex flex-col gap-2 w-[300px]">
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
          <CardTitle>Lista de Participantes</CardTitle>
          <p className="text-sm text-muted-foreground">
            {totalClientes} participantes encontrados
          </p>
        </CardHeader>
        <CardContent>
          {clientesLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome Completo</TableHead>
                    <TableHead>CPF</TableHead>
                    <TableHead>WhatsApp</TableHead>
                    <TableHead>Padaria Vinculada</TableHead>
                    <TableHead>Cupons Enviados</TableHead>
                    <TableHead>Última Submissão</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clientes.map((participante: any) => (
                    <TableRow key={`${participante.id}-${participante.padariaVinculadaId}`}>
                      <TableCell className="font-medium">{participante.nome}</TableCell>
                      <TableCell>{maskCPF(participante.cpf)}</TableCell>
                      <TableCell>{formatPhone(participante.whatsapp)}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="border-blue-200 text-blue-700">
                          {participante.padariaVinculada}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-secondary border-secondary">
                          {participante.totalCuponsNestaPadaria}
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
        onClienteAdded={() => {
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
                    <Label>Padaria</Label>
                    <Input
                      value={selectedCliente.padaria?.nome || 'N/A'}
                      disabled
                      className="bg-muted"
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Lista de Cupons */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Cupons do Cliente ({selectedCliente.cupons?.length || 0})</h3>
                {selectedCliente.cupons && selectedCliente.cupons.length > 0 ? (
                  <div className="max-h-[200px] overflow-y-auto border rounded-lg">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Nº da Sorte</TableHead>
                          <TableHead>Valor</TableHead>
                          <TableHead>Data</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedCliente.cupons.map((cupom: any) => (
                          <TableRow key={cupom.id}>
                            <TableCell className="font-mono">{cupom.numero_sorte}</TableCell>
                            <TableCell>R$ {cupom.valor_compra}</TableCell>
                            <TableCell>
                              {cupom.data_compra ? format(new Date(cupom.data_compra), 'dd/MM/yyyy HH:mm') : 'N/A'}
                            </TableCell>
                            <TableCell>
                              <Badge variant={cupom.valor_compra === "0" ? "outline" : "default"}>
                                {cupom.valor_compra === "0" ? "Inativo" : "Ativo"}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Nenhum cupom cadastrado
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
                      Isso também excluirá todos os {selectedCliente.cupons?.length || 0} cupons associados. Esta ação não pode ser desfeita.
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