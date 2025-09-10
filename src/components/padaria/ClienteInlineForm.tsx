import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { UserPlus, Search, User, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useGraphQLQuery, useGraphQLMutation } from "@/hooks/useGraphQL";
import { useAuth } from "@/contexts/AuthContext";
import { GET_CLIENTE_BY_CPF_OR_WHATSAPP, CREATE_CLIENTE } from "@/graphql/queries";

interface Cliente {
  id?: number;
  cpf: string;
  nome: string;
  whatsapp?: string;
  saldoAcumulado?: number;
  padaria_id?: string;
  padaria?: {
    id: string;
    nome: string;
  };
}

interface ClienteInlineFormProps {
  onClienteEncontrado?: (cliente: Cliente) => void;
  onClienteCriado?: (cliente: Cliente) => void;
  searchTerm?: string;
}

export function ClienteInlineForm({ onClienteEncontrado, onClienteCriado, searchTerm = "" }: ClienteInlineFormProps) {
  const [searchValue, setSearchValue] = useState(searchTerm);
  const [clienteEncontrado, setClienteEncontrado] = useState<Cliente | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    cpf: "",
    nome: "",
    whatsapp: ""
  });
  
  const { toast } = useToast();
  const { user } = useAuth();

  // Detectar se o valor de busca é CPF ou WhatsApp
  const isSearchValueCPF = (value: string) => {
    const digits = value.replace(/\D/g, "");
    return digits.length === 11;
  };

  const isSearchValueWhatsApp = (value: string) => {
    const digits = value.replace(/\D/g, "");
    return digits.length >= 10 && digits.length <= 13;
  };

  // Query para buscar cliente por CPF ou WhatsApp
  const searchVariables = searchValue ? {
    cpf: isSearchValueCPF(searchValue) ? searchValue.replace(/\D/g, "") : null,
    whatsapp: isSearchValueWhatsApp(searchValue) ? searchValue : null
  } : {};

  const { data: clienteData, isLoading: isSearching, refetch: refetchCliente } = useGraphQLQuery(
    ['search-cliente', searchValue],
    GET_CLIENTE_BY_CPF_OR_WHATSAPP,
    searchVariables,
    { 
      enabled: !!searchValue && (isSearchValueCPF(searchValue) || isSearchValueWhatsApp(searchValue))
    }
  );

  // Effect para processar os resultados da busca
  useEffect(() => {
    if (clienteData) {
      const clientes = (clienteData as any)?.clientes || [];
      if (clientes.length > 0) {
        const cliente = clientes[0];
        setClienteEncontrado(cliente);
        setShowCreateForm(false);
        onClienteEncontrado?.(cliente);
      } else {
        setClienteEncontrado(null);
        setShowCreateForm(true);
        // Pre-preencher o formulário com o valor pesquisado
        if (isSearchValueCPF(searchValue)) {
          setFormData(prev => ({ ...prev, cpf: formatCPF(searchValue) }));
        } else if (isSearchValueWhatsApp(searchValue)) {
          setFormData(prev => ({ ...prev, whatsapp: formatWhatsApp(searchValue) }));
        }
      }
    }
  }, [clienteData, searchValue, onClienteEncontrado]);

  // Mutation para criar novo cliente
  const createClienteMutation = useGraphQLMutation(CREATE_CLIENTE, {
    onSuccess: (data: any) => {
      const novoCliente = data?.insert_clientes_one;
      if (novoCliente) {
        toast({
          title: "Cliente criado",
          description: "Cliente cadastrado com sucesso!"
        });
        
        setClienteEncontrado(novoCliente);
        setShowCreateForm(false);
        setFormData({ cpf: "", nome: "", whatsapp: "" });
        onClienteCriado?.(novoCliente);
      }
    },
    onError: (error: any) => {
      let errorMessage = "Erro ao cadastrar cliente";
      if (error.message?.includes("unique constraint")) {
        errorMessage = "Este CPF já está cadastrado";
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive"
      });
    },
    invalidateQueries: [
      ['clientes-by-padaria', user?.padarias_id],
      ['all-clientes-cupons'],
      ['search-cliente', searchValue]
    ]
  });

  const formatCPF = (value: string) => {
    const digits = value.replace(/\D/g, "");
    return digits
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})/, "$1-$2");
  };

  const formatWhatsApp = (value: string) => {
    const digits = value.replace(/\D/g, "");
    let formatted = "(+55) ";
    
    if (digits.length >= 2) {
      formatted += `(${digits.slice(0, 2)}) `;
    }
    
    if (digits.length >= 7) {
      const localNumber = digits.slice(2);
      if (localNumber.length === 9) {
        formatted += `${localNumber.slice(0, 5)}-${localNumber.slice(5)}`;
      } else if (localNumber.length === 8) {
        formatted += `${localNumber.slice(0, 4)}-${localNumber.slice(4)}`;
      } else {
        formatted += localNumber;
      }
    } else if (digits.length > 2) {
      formatted += digits.slice(2);
    }
    
    return formatted;
  };

  const validateCPF = (cpf: string) => {
    const digits = cpf.replace(/\D/g, "");
    return digits.length === 11;
  };

  const validateWhatsApp = (whatsapp: string) => {
    const digits = whatsapp.replace(/\D/g, "");
    return digits.length >= 10 && digits.length <= 13;
  };

  const handleInputChange = (field: string, value: string) => {
    let formattedValue = value;
    
    if (field === "cpf") {
      formattedValue = formatCPF(value);
    } else if (field === "whatsapp") {
      formattedValue = formatWhatsApp(value);
    }
    
    setFormData(prev => ({
      ...prev,
      [field]: formattedValue
    }));
  };

  // Pre-fill form if search term looks like CPF or WhatsApp
  useState(() => {
    if (searchTerm) {
      const digits = searchTerm.replace(/\D/g, "");
      if (digits.length === 11) {
        // Looks like CPF
        setFormData(prev => ({ ...prev, cpf: formatCPF(searchTerm) }));
      } else if (digits.length >= 10) {
        // Looks like WhatsApp
        setFormData(prev => ({ ...prev, whatsapp: formatWhatsApp(searchTerm) }));
      }
    }
  });

  const handleSearch = () => {
    if (!searchValue.trim()) {
      toast({
        title: "Erro",
        description: "Digite um CPF ou WhatsApp para pesquisar",
        variant: "destructive"
      });
      return;
    }

    if (!isSearchValueCPF(searchValue) && !isSearchValueWhatsApp(searchValue)) {
      toast({
        title: "Erro",
        description: "Digite um CPF válido (11 dígitos) ou WhatsApp válido",
        variant: "destructive"
      });
      return;
    }

    refetchCliente();
  };

  const handleCreateCliente = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.cpf || !formData.nome || !formData.whatsapp) {
      toast({
        title: "Erro",
        description: "Todos os campos são obrigatórios",
        variant: "destructive"
      });
      return;
    }

    if (!validateCPF(formData.cpf)) {
      toast({
        title: "Erro",
        description: "CPF inválido",
        variant: "destructive"
      });
      return;
    }

    if (!validateWhatsApp(formData.whatsapp)) {
      toast({
        title: "Erro",
        description: "WhatsApp inválido",
        variant: "destructive"
      });
      return;
    }

    if (!user?.padarias_id) {
      toast({
        title: "Erro",
        description: "Erro ao identificar a padaria. Faça login novamente.",
        variant: "destructive"
      });
      return;
    }

    // Criar cliente usando a mutation
    createClienteMutation.mutate({
      cliente: {
        nome: formData.nome.trim(),
        cpf: formData.cpf.replace(/\D/g, ""),
        whatsapp: formData.whatsapp.trim(),
        padaria_id: user.padarias_id
      }
    });
  };

  return (
    <div className="space-y-4">
      {/* Campo de Busca */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Search className="w-4 h-4" />
            Buscar Cliente
          </CardTitle>
          <CardDescription>
            Digite o CPF ou WhatsApp para buscar um cliente existente
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              placeholder="Digite CPF ou WhatsApp..."
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
            <Button 
              onClick={handleSearch} 
              disabled={isSearching || !searchValue.trim()}
            >
              {isSearching ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Search className="w-4 h-4" />
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Cliente Encontrado */}
      {clienteEncontrado && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base text-green-700">
              <User className="w-4 h-4" />
              Cliente Encontrado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p><strong>Nome:</strong> {clienteEncontrado.nome}</p>
              <p><strong>CPF:</strong> {formatCPF(clienteEncontrado.cpf)}</p>
              {clienteEncontrado.whatsapp && (
                <p><strong>WhatsApp:</strong> {clienteEncontrado.whatsapp}</p>
              )}
              {clienteEncontrado.padaria && (
                <p><strong>Padaria:</strong> {clienteEncontrado.padaria.nome}</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Formulário de Criação de Cliente */}
      {showCreateForm && (
        <Card className="border-dashed border-orange-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <UserPlus className="w-4 h-4" />
              Cliente não encontrado - Criar novo
            </CardTitle>
            <CardDescription>
              Preencha os dados para criar um novo cliente
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateCliente} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="inline-cpf">CPF *</Label>
                  <Input
                    id="inline-cpf"
                    placeholder="000.000.000-00"
                    value={formData.cpf}
                    onChange={(e) => handleInputChange("cpf", e.target.value)}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="inline-nome">Nome Completo *</Label>
                  <Input
                    id="inline-nome"
                    placeholder="Nome completo"
                    value={formData.nome}
                    onChange={(e) => handleInputChange("nome", e.target.value)}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="inline-whatsapp">WhatsApp *</Label>
                  <Input
                    id="inline-whatsapp"
                    placeholder="(+55) (00) 00000-0000"
                    value={formData.whatsapp}
                    onChange={(e) => handleInputChange("whatsapp", e.target.value)}
                    required
                  />
                </div>
              </div>
              
              <Button 
                type="submit" 
                disabled={createClienteMutation.isPending} 
                className="w-full"
              >
                {createClienteMutation.isPending ? "Criando..." : "Criar Cliente"}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}