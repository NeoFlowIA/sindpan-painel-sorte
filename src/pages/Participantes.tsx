import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Users, Download, Search, RefreshCw, UserPlus, Receipt } from "lucide-react";
import { useGraphQLQuery } from "@/hooks/useGraphQL";
import { GET_ALL_CLIENTES_ADMIN_SIMPLE, GET_PADARIAS, GET_ADMIN_DASHBOARD_METRICS } from "@/graphql/queries";
import { formatPhone, maskCPF } from "@/utils/formatters";
import { AdminNovoClienteModal } from "@/components/admin/AdminNovoClienteModal";
import { AdminCupomModal } from "@/components/admin/AdminCupomModal";

export default function Participantes() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPadaria, setSelectedPadaria] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [showNovoClienteModal, setShowNovoClienteModal] = useState(false);
  const [showCupomModal, setShowCupomModal] = useState(false);

  const itemsPerPage = 10;

  // Buscar dados dos clientes
  const { data: clientesData, isLoading: clientesLoading, refetch: refetchClientes } = useGraphQLQuery(
    ['clientes-admin'],
    GET_ALL_CLIENTES_ADMIN_SIMPLE
  );

  // Buscar lista de padarias para o filtro
  const { data: padariasData, isLoading: padariasLoading } = useGraphQLQuery(
    ['padarias-list'],
    GET_PADARIAS
  );

  // Buscar métricas do dashboard
  const { data: metricsData, isLoading: metricsLoading, refetch: refetchMetrics } = useGraphQLQuery(
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

  // Filtrar clientes no frontend
  const clientesFiltrados = (clientesData?.clientes || []).filter((cliente: any) => {
    const matchesSearch = !searchTerm || 
      cliente.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cliente.cpf.includes(searchTerm) ||
      cliente.whatsapp.includes(searchTerm) ||
      cliente.padaria?.nome.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesPadaria = selectedPadaria === "all" || cliente.padaria_id === selectedPadaria;
    
    return matchesSearch && matchesPadaria;
  });

  const totalClientes = clientesFiltrados.length;
  const totalPages = Math.ceil(totalClientes / itemsPerPage);
  
  // Paginar resultados filtrados
  const clientes = clientesFiltrados.slice(
    currentPage * itemsPerPage, 
    (currentPage + 1) * itemsPerPage
  );

  // Calcular métricas no frontend
  const totalParticipantes = metricsData?.clientes_aggregate?.aggregate?.count || 0;
  const totalCupons = metricsData?.cupons?.length || 0;
  
  // Calcular cupons de hoje
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const cuponsHoje = metricsData?.cupons?.filter((cupom: any) => {
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
          <Button variant="outline">
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
        <Select value={selectedPadaria} onValueChange={handlePadariaFilter}>
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
                  {clientes.map((cliente: any) => (
                    <TableRow key={cliente.id}>
                      <TableCell className="font-medium">{cliente.nome}</TableCell>
                      <TableCell>{maskCPF(cliente.cpf)}</TableCell>
                      <TableCell>{formatPhone(cliente.whatsapp)}</TableCell>
                      <TableCell>{cliente.padaria?.nome || "N/A"}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-secondary border-secondary">
                          {cliente.cupons?.length || 0}
                        </Badge>
                      </TableCell>
                      <TableCell>{getUltimaSubmissao(cliente.cupons)}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm">
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
        }}
      />
    </div>
  );
}