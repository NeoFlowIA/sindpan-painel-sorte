import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { addCliente } from "@/utils/clientesStorage";

interface NovoClienteModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onClienteAdded: () => void;
}

export function NovoClienteModal({ open, onOpenChange, onClienteAdded }: NovoClienteModalProps) {
  const [formData, setFormData] = useState({
    cpf: "",
    nome: "",
    whatsapp: ""
  });
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const formatCPF = (value: string) => {
    // Remove non-digits
    const digits = value.replace(/\D/g, "");
    
    // Apply mask: 999.999.999-99
    if (digits.length <= 11) {
      return digits
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d{1,2})/, "$1-$2");
    }
    return value;
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
      addCliente({
        cpf: formData.cpf,
        nome: formData.nome,
        whatsapp: formData.whatsapp,
      });
      toast({
        title: "Sucesso",
        description: "Cliente cadastrado com sucesso",
      });
      setFormData({ cpf: "", nome: "", whatsapp: "" });
      onClienteAdded();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao cadastrar cliente",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({ cpf: "", nome: "", whatsapp: "" });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Novo Cliente</DialogTitle>
          <DialogDescription>
            Cadastre um novo cliente para sua padaria
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="cpf">CPF *</Label>
            <Input
              id="cpf"
              placeholder="000.000.000-00"
              value={formData.cpf}
              onChange={(e) => handleInputChange("cpf", e.target.value)}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="nome">Nome Completo *</Label>
            <Input
              id="nome"
              placeholder="Digite o nome completo"
              value={formData.nome}
              onChange={(e) => handleInputChange("nome", e.target.value)}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="whatsapp">WhatsApp *</Label>
            <Input
              id="whatsapp"
              placeholder="(+55) (00) 00000-0000"
              value={formData.whatsapp}
              onChange={(e) => handleInputChange("whatsapp", e.target.value)}
              required
            />
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleCancel}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}