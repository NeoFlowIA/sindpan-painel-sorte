import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Loader2 } from "lucide-react";
import { NovoClienteModal } from "./NovoClienteModal";
// import { useClientesByBakeryName } from "@/hooks/useClientes"; // Removido temporariamente para debug
import { useAuth } from "@/contexts/AuthContext";
import { maskCPF, formatPhone } from "@/utils/formatters";
import { useGraphQLQuery } from "@/hooks/useGraphQL";
import { GET_CLIENTES, GET_ALL_CLIENTES_WITH_CUPONS } from "@/graphql/queries";

export function ClientesTable() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  const { user } = useAuth();

  // Buscar clientes da padaria do usuário usando padarias_id direto
  const padariasId = user?.padarias_id;
  
  // Query para clientes específicos da padaria (se tiver padarias_id)
  const { data: clientesData, isLoading: clientesLoading, error: clientesError } = useGraphQLQuery(
    ['clientes-by-padaria', padariasId],
    GET_CLIENTES,
    {
      padaria_id: padariasId,
      limit: 100,
      offset: 0
    },
    { enabled: !!padariasId }
  );

  // Query para todos os clientes (fallback se não tiver padarias_id)
  const { data: allClientesData, isLoading: allClientesLoading, error: allClientesError } = useGraphQLQuery(
    ['all-clientes-cupons'], 
    GET_ALL_CLIENTES_WITH_CUPONS,
    undefined,
    { enabled: !padariasId }
  );

  const isLoading = padariasId ? clientesLoading : allClientesLoading;
  const error = padariasId ? clientesError : allClientesError;

  // Usar todos os clientes ou filtrar por padaria se necessário
  type Cliente = {
    padaria: any;
    cupons: any;
    id: string;
    nome: string;
    cpf: string;
    whatsapp?: string;
    serie?: any;
    // adicione outros campos conforme necessário
  };

  // Usar clientes específicos da padaria ou todos os clientes
  const clientesFiltered: Cliente[] = padariasId 
    ? (Array.isArray((clientesData as any)?.clientes) ? (clientesData as any).clientes : [])
    : (Array.isArray((allClientesData as any)?.clientes) ? (allClientesData as any).clientes : []);

  // Debug logs
  console.log('🔍 ClientesTable Debug (Usando padarias_id direto):', {
    bakeryName: user?.bakery_name,
    userPadariasId: user?.padarias_id,
    padariasId,
    clientesFilteredCount: clientesFiltered.length,
    isLoading,
    error,
    clientesFiltered,
    clientesData,
    allClientesData,
    usingSpecificPadaria: !!padariasId
  });

  // Filtrar clientes baseado no termo de busca
  const filteredClientes = useMemo(() => {
    if (!searchTerm) return clientesFiltered;
    
    const searchLower = searchTerm.toLowerCase();
    return clientesFiltered.filter(cliente => 
      cliente.cpf.includes(searchTerm) || 
      (cliente.whatsapp && cliente.whatsapp.includes(searchTerm)) ||
      cliente.nome.toLowerCase().includes(searchLower)
    );
  }, [clientesFiltered, searchTerm]);

  const totalPages = Math.ceil(filteredClientes.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentClientes = filteredClientes.slice(startIndex, startIndex + itemsPerPage);

  const handleClienteAdded = (_novoCliente?: { id: string }) => {
    setIsModalOpen(false);
    // A invalidação da query será feita automaticamente pela mutation no NovoClienteModal
  };

  // Loading state
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-foreground">Clientes Cadastrados</CardTitle>
              <CardDescription>Gerencie os clientes da sua padaria</CardDescription>
            </div>
            <Button disabled className="w-full sm:w-auto">
              <Plus className="w-4 h-4 mr-2" />
              Novo Cliente
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin mr-2" />
            <span>Carregando clientes...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (error) {
    return (
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-foreground">Clientes Cadastrados</CardTitle>
              <CardDescription>Gerencie os clientes da sua padaria</CardDescription>
            </div>
            <Button onClick={() => setIsModalOpen(true)} className="w-full sm:w-auto">
              <Plus className="w-4 h-4 mr-2" />
              Novo Cliente
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-destructive mb-2">Erro ao carregar clientes</p>
            <p className="text-muted-foreground text-sm">
              Verifique sua conexão e tente novamente
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-foreground">Clientes Cadastrados</CardTitle>
            <CardDescription>
              Gerencie os clientes da sua padaria ({filteredClientes.length} total)
            </CardDescription>
          </div>
          <Button onClick={() => setIsModalOpen(true)} className="w-full sm:w-auto">
            <Plus className="w-4 h-4 mr-2" />
            Novo Cliente
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Search */}
        <div className="flex items-center gap-2 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por CPF, WhatsApp ou nome..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          {currentClientes.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                {searchTerm ? 'Nenhum cliente encontrado com esse termo de busca.' : 'Nenhum cliente cadastrado ainda.'}
              </p>
              {!searchTerm && (
                <p className="text-sm text-muted-foreground mt-2">
                  Clique em "Novo Cliente" para começar.
                </p>
              )}
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                <th className="text-left p-3 font-medium text-muted-foreground">Nome</th>
                <th className="text-left p-3 font-medium text-muted-foreground">CPF</th>
                <th className="text-left p-3 font-medium text-muted-foreground">Padaria</th>
                <th className="text-left p-3 font-medium text-muted-foreground">WhatsApp</th>
                <th className="text-center p-3 font-medium text-muted-foreground">Cupons</th>
                </tr>
              </thead>
              <tbody>
                {currentClientes.map((cliente) => (
                  <tr key={cliente.id} className="border-b border-border/50 hover:bg-muted/50 transition-colors duration-200">
                    <td className="p-3 font-mono text-sm">{maskCPF(cliente.cpf)}</td>
                    <td className="p-3 font-medium">{cliente.nome}</td>
                    <td className="p-3 text-muted-foreground">{cliente.padaria?.nome || '-'}</td>
                    <td className="p-3 text-muted-foreground">{cliente.whatsapp ? formatPhone(cliente.whatsapp) : '-'}</td>
                    <td className="p-3 text-center">
                      <span className="bg-primary/10 text-primary px-2 py-1 rounded-full text-sm font-medium">
                        {cliente.cupons?.length || 0}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
              Mostrando {startIndex + 1} a {Math.min(startIndex + itemsPerPage, filteredClientes.length)} de {filteredClientes.length} clientes
            </p>
            <div className="flex flex-col gap-2 sm:flex-row sm:gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(currentPage - 1)}
              >
                Anterior
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(currentPage + 1)}
              >
                Próximo
              </Button>
            </div>
          </div>
        )}
      </CardContent>

      <NovoClienteModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        onClienteAdded={handleClienteAdded}
      />
    </Card>
  );
}