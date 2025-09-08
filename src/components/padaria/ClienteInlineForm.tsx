import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { UserPlus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useGraphQLMutation } from "@/hooks/useGraphQL";
import { CREATE_CLIENTE } from "@/graphql/queries";

export interface Cliente {
  id: string;
  cpf: string;
  nome: string;
  whatsapp: string;
  saldoAcumulado: number;
}

interface ClienteInlineFormProps {
  onClienteCriado: (cliente: Cliente) => void;
  searchTerm: string;
}

export function ClienteInlineForm({ onClienteCriado, searchTerm }: ClienteInlineFormProps) {
  const [formData, setFormData] = useState({
    cpf: "",
    nome: "",
    whatsapp: ""
  });
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const padariaId = user?.id;

  interface CreateClienteResponse {
    insert_clientes_one: {
      id: string;
      nome: string;
      cpf: string;
      whatsapp: string;
    };
  }

  const { mutateAsync: createCliente } = useGraphQLMutation<
    CreateClienteResponse,
    { cliente: Record<string, unknown> }
  >(CREATE_CLIENTE);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.cpf || !formData.nome || !formData.whatsapp) {
      toast({
        title: "Erro",
        description: "Todos os campos são obrigatórios",
        variant: "destructive",
      });
      return;
    }

    if (!validateCPF(formData.cpf)) {
      toast({
        title: "Erro",
        description: "CPF inválido",
        variant: "destructive",
      });
      return;
    }

    if (!validateWhatsApp(formData.whatsapp)) {
      toast({
        title: "Erro",
        description: "WhatsApp inválido",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const result = await createCliente({
        cliente: {
          cpf: formData.cpf.replace(/\D/g, ""),
          nome: formData.nome,
          whatsapp: formData.whatsapp.replace(/\D/g, ""),
          padaria_id: padariaId,
        },
      });

      const novoCliente: Cliente = {
        id: result.insert_clientes_one.id,
        cpf: formData.cpf,
        nome: formData.nome,
        whatsapp: formData.whatsapp,
        saldoAcumulado: 0,
      };

      toast({
        title: "Cliente criado",
        description: "Cliente cadastrado e vinculado à padaria",
      });

      onClienteCriado(novoCliente);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao criar cliente",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="border-dashed">
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
        <form onSubmit={handleSubmit} className="space-y-4">
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
          
          <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading ? "Criando..." : "Criar Cliente"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}