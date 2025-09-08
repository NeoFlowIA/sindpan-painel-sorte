import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { UserPlus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { addCliente, Cliente } from "@/utils/clientesStorage";

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

  const formatCPF = (value: string) => {
    const digits = value.replace(/\D/g, "");
    return digits
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})/, "$1-$2");
  };

  const formatWhatsApp = (value: string) => {
    let digits = value.replace(/\D/g, "");
    if (digits.startsWith("55")) {
      digits = digits.slice(2);
    }
    digits = digits.slice(0, 11);
    let formatted = "(+55) ";
    if (digits.length >= 2) {
      formatted += `(${digits.slice(0, 2)}) `;
      const local = digits.slice(2);
      if (local.length > 5) {
        formatted += `${local.slice(0, 5)}-${local.slice(5)}`;
      } else {
        formatted += local;
      }
    } else if (digits.length > 0) {
      formatted += digits;
    }
    return formatted.trim();
  };

  const validateCPF = (cpf: string) => {
    const digits = cpf.replace(/\D/g, "");
    return digits.length === 11;
  };

  const validateWhatsApp = (whatsapp: string) => {
    let digits = whatsapp.replace(/\D/g, "");
    if (digits.startsWith("55")) {
      digits = digits.slice(2);
    }
    return digits.length >= 10 && digits.length <= 11;
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
  useEffect(() => {
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
  }, [searchTerm]);

  const handleSubmit = async (e: React.FormEvent) => {
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

    setIsLoading(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      const novoCliente = addCliente({
        cpf: formData.cpf,
        nome: formData.nome,
        whatsapp: formData.whatsapp,
      });
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