import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useGraphQLQuery, useGraphQLMutation } from "@/hooks/useGraphQL";
import { CREATE_CLIENTE, GET_PADARIAS } from "@/graphql/queries";
import { validateWhatsAppFormat, normalizeWhatsApp, formatWhatsApp } from "@/utils/formatters";

interface AdminNovoClienteModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onClienteAdded: () => void;
  initialSearchTerm?: string;
}

export function AdminNovoClienteModal({ open, onOpenChange, onClienteAdded, initialSearchTerm }: AdminNovoClienteModalProps) {
  const [formData, setFormData] = useState({
    cpf: "",
    nome: "",
    whatsapp: "",
    resposta_pergunta: "",
    padaria_id: ""
  });
  
  const { toast } = useToast();

  // Buscar lista de padarias
  const { data: padariasData, isLoading: padariasLoading } = useGraphQLQuery(
    ['padarias-list'],
    GET_PADARIAS
  );

  // Tipar corretamente padariasData para evitar o erro de 'unknown'
  type PadariasData = { padarias: any[] };
  const padarias = ((padariasData as any) as PadariasData | undefined)?.padarias || [];

  console.log('🔍 Padarias carregadas:', ((padariasData as any) as PadariasData | undefined)?.padarias);
  console.log('🔍 Dados completos:', padariasData);
  console.log('🔍 Array padarias:', padarias);
  console.log('🔍 Loading state:', padariasLoading);

  // Mutation para criar cliente
  const createClienteMutation = useGraphQLMutation(CREATE_CLIENTE, {
    onSuccess: (data) => {
      console.log('🔍 Cliente criado - Resultado final:', data);
      
      toast({
        title: "Sucesso",
        description: "Cliente cadastrado com sucesso!"
      });
      
      setFormData({ cpf: "", nome: "", whatsapp: "", resposta_pergunta: "", padaria_id: "" });
      onClienteAdded();
    },
    onError: (error: any) => {
      console.error('🔍 Erro ao criar cliente:', error);
      
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
      ['clientes-admin'],
      ['admin-metrics']
    ]
  });

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

  // Preencher campos quando o modal abrir com initialSearchTerm
  useEffect(() => {
    if (open && initialSearchTerm) {
      // Verificar se é CPF (apenas números, 11 dígitos) ou WhatsApp
      const digitsOnly = initialSearchTerm.replace(/\D/g, "");
      
      if (digitsOnly.length === 11) {
        // Provavelmente é CPF - formatar usando a função local
        const formattedCPF = formatCPF(initialSearchTerm);
        setFormData(prev => ({
          ...prev,
          cpf: formattedCPF
        }));
      } else {
        // Provavelmente é WhatsApp
        setFormData(prev => ({
          ...prev,
          whatsapp: initialSearchTerm
        }));
      }
    } else if (!open) {
      // Limpar formulário quando fechar o modal
      setFormData({
        cpf: "",
        nome: "",
        whatsapp: "",
        resposta_pergunta: "",
        padaria_id: ""
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initialSearchTerm]);

  const formatWhatsApp = (value: string) => {
    // Retornar exatamente o que o usuário digitou, sem modificações
    return value;
  };

  const validateCPF = (cpf: string) => {
    const digits = cpf.replace(/\D/g, "");
    return digits.length === 11;
  };

  const validateWhatsApp = (whatsapp: string) => {
    return validateWhatsAppFormat(whatsapp);
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

  const handleSelectChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('🔍 Dados do formulário no submit:', formData);
    
    if (!formData.cpf || !formData.nome || !formData.whatsapp || !formData.padaria_id) {
      console.log('🔍 Campos faltando:', {
        cpf: !formData.cpf,
        nome: !formData.nome,
        whatsapp: !formData.whatsapp,
        padaria_id: !formData.padaria_id
      });
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

    // Validação adicional dos dados
    if (!formData.cpf.replace(/\D/g, "") || !formData.nome.trim() || !formData.whatsapp.trim()) {
      toast({
        title: "Erro",
        description: "Dados inválidos. Verifique se todos os campos estão preenchidos corretamente.",
        variant: "destructive"
      });
      return;
    }

    // Remover formatação apenas do CPF - WhatsApp manter como digitado
    const cpfLimpo = formData.cpf.replace(/\D/g, "");
    const whatsappValue = normalizeWhatsApp(formData.whatsapp); // Normalizar para formato da API

    console.log('🔍 Criando cliente - Dados completos:', {
      padariaId: formData.padaria_id,
      cpfLimpo,
      whatsappValue,
      formData
    });

    // Usar a mutation para criar o cliente
    createClienteMutation.mutate({
      cliente: {
        nome: formData.nome.trim(),
        cpf: cpfLimpo,
        padaria_id: formData.padaria_id,
        // Campos opcionais
        ...(whatsappValue && { whatsapp: whatsappValue }),
        ...(formData.resposta_pergunta && { resposta_pergunta: formData.resposta_pergunta })
      }
    });
  };

  const handleCancel = () => {
    setFormData({ cpf: "", nome: "", whatsapp: "", resposta_pergunta: "", padaria_id: "" });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Novo Cliente</DialogTitle>
          <DialogDescription>
            Cadastre um novo cliente e vincule a uma padaria
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
              type="tel"
              placeholder="Ex: (85) 98888-9999 ou 5585988889999"
              value={formData.whatsapp}
              onChange={(e) => handleInputChange("whatsapp", e.target.value)}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck="false"
              required
            />
            <p className="text-xs text-muted-foreground">
              Formato aceito: 5585988889999 (13 dígitos) ou 85988889999 (11 dígitos)
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="padaria">Padaria *</Label>
            <Select 
              value={formData.padaria_id} 
              onValueChange={(value) => {
                console.log('🔍 Padaria selecionada:', value);
                console.log('🔍 FormData antes:', formData);
                setFormData(prev => {
                  const newData = { ...prev, padaria_id: value };
                  console.log('🔍 FormData depois:', newData);
                  return newData;
                });
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma padaria" />
              </SelectTrigger>
              <SelectContent>
                {padariasLoading ? (
                  <SelectItem value="loading" disabled>Carregando padarias...</SelectItem>
                ) : padarias.length === 0 ? (
                  <SelectItem value="no-padarias" disabled>Nenhuma padaria encontrada</SelectItem>
                ) : (
                  padarias.map((padaria: any) => {
                    return (
                      <SelectItem key={padaria.id} value={String(padaria.id)}>
                        {padaria.nome}
                      </SelectItem>
                    );
                  })
                )}
              </SelectContent>
            </Select>
            <div className="text-xs text-gray-500">
              Debug: formData.padaria_id = "{formData.padaria_id}"
            </div>
            {formData.padaria_id && (
              <p className="text-sm text-green-600">
                ✅ Padaria selecionada: {padarias.find((p: any) => p.id === formData.padaria_id)?.nome}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="resposta_pergunta">Resposta da Pergunta</Label>
            <Select 
              value={formData.resposta_pergunta} 
              onValueChange={(value) => handleSelectChange("resposta_pergunta", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma opção" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Na Padaria">Na Padaria</SelectItem>
                <SelectItem value="Em outra lugar">Em outra lugar</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleCancel}>
              Cancelar
            </Button>
            <Button type="submit" disabled={createClienteMutation.isPending}>
              {createClienteMutation.isPending ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
