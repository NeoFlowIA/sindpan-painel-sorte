import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useGraphQLQuery } from "@/hooks/useGraphQL";
import { useAuth } from "@/contexts/AuthContext";
import { CREATE_CLIENTE, CREATE_CLIENTE_SIMPLE, CREATE_CLIENTE_TEST, GET_NEXT_CLIENTE_ID, GET_PADARIA_BY_NAME, GET_ALL_PADARIAS_SIMPLE } from "@/graphql/queries";
import { graphqlClient } from "@/lib/graphql-client";

interface NovoClienteModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onClienteAdded: () => void;
  padariaCnpj?: string;
}

export function NovoClienteModal({ open, onOpenChange, onClienteAdded }: NovoClienteModalProps) {
  const [formData, setFormData] = useState({
    cpf: "",
    nome: "",
    whatsapp: "",
    resposta_pergunta: ""
  });
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  // Usar padarias_id diretamente (sem relacionamento)
  const padariasId = user?.padarias_id;

  // Buscar todas as padarias para fallback (só se não tiver padarias vinculada)
  const { data: allPadariasData } = useGraphQLQuery(
    ['all-padarias'],
    GET_ALL_PADARIAS_SIMPLE,
    undefined,
    { enabled: !padariasId }
  );

  const allPadarias = (allPadariasData as any)?.padarias || [];
  const fallbackPadaria = !padariasId && allPadarias.length > 0 ? allPadarias[0] : null;
  
  const padariaIdToUse = padariasId || fallbackPadaria?.id;

  // Debug logs para entender a estrutura
  console.log('🔍 NovoClienteModal Debug (Usando padarias_id direto):', {
    userBakeryName: user?.bakery_name,
    userPadariasId: user?.padarias_id,
    padariasId,
    padariaIdToUse,
    allPadarias: allPadarias.slice(0, 3),
    hasDirectLink: !!padariasId,
    usingFallback: !padariasId && !!fallbackPadaria
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

  const formatWhatsApp = (value: string) => {
    // Retornar exatamente o que o usuário digitou, sem modificações
    return value;
  };

  const validateCPF = (cpf: string) => {
    const digits = cpf.replace(/\D/g, "");
    return digits.length === 11;
  };

  const validateWhatsApp = (whatsapp: string) => {
    // Validação simples: apenas verificar se não está vazio
    return whatsapp.trim().length > 0;
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

    if (!padariaIdToUse) {
      toast({
        title: "Erro",
        description: "Não foi possível encontrar uma padaria para vincular o cliente. Verifique se existe uma padaria cadastrada no sistema.",
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

    setIsLoading(true);
    
    try {
      // Remover formatação apenas do CPF - WhatsApp manter como digitado
      const cpfLimpo = formData.cpf.replace(/\D/g, "");
      const whatsappValue = formData.whatsapp.trim(); // Manter exatamente como digitado

      const clienteData = {
        cpf: cpfLimpo,
        nome: formData.nome.trim(),
        padaria_id: String(padariaIdToUse), // Garantir que seja string UUID
        // Campos opcionais só se tiverem valor
        ...(whatsappValue && { whatsapp: whatsappValue }),
        ...(formData.resposta_pergunta && { resposta_pergunta: formData.resposta_pergunta })
      };

      console.log('🔍 Criando cliente - Dados completos:', {
        clienteData,
        padariaIdToUse,
        cpfLimpo,
        whatsappValue,
        formData
      });

      // Criar cliente SEM definir ID - deixar o Hasura gerar automaticamente
      console.log('🔍 Criando cliente sem ID (auto-incremento)...');
      
      const result = await graphqlClient.mutate(CREATE_CLIENTE, {
        cliente: {
          // NÃO incluir campo id - será gerado automaticamente
          nome: formData.nome.trim(),
          cpf: cpfLimpo,
          padaria_id: String(padariaIdToUse),
          // Campos opcionais
          ...(whatsappValue && { whatsapp: whatsappValue }),
          ...(formData.resposta_pergunta && { resposta_pergunta: formData.resposta_pergunta })
        }
      });

      console.log('🔍 Cliente criado - Resultado final:', result);
      
      toast({
        title: "Sucesso",
        description: "Cliente cadastrado com sucesso!"
      });
      
      setFormData({ cpf: "", nome: "", whatsapp: "", resposta_pergunta: "" });
      onClienteAdded();
    } catch (error: any) {
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
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({ cpf: "", nome: "", whatsapp: "", resposta_pergunta: "" });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Novo Cliente</DialogTitle>
          <DialogDescription>
            Cadastre um novo cliente para sua padaria
            {padariasId && (
              <span className="block mt-2 text-sm font-medium text-green-600">
                ✅ Usuário vinculado à padaria: {user?.bakery_name}
                <br />
                <small>Padaria ID: {padariasId}</small>
              </span>
            )}
            {!padariasId && fallbackPadaria && (
              <span className="block mt-2 text-sm text-amber-600">
                ⚠️ Usuário não vinculado. Usando: {fallbackPadaria.nome}
                <br />
                <small>Configure o campo padarias_id para este usuário</small>
              </span>
            )}
            {!padariaIdToUse && (
              <span className="block mt-2 text-sm text-red-600">
                ❌ Nenhuma padaria disponível no sistema
              </span>
            )}
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
              placeholder="Digite o WhatsApp"
              value={formData.whatsapp}
              onChange={(e) => handleInputChange("whatsapp", e.target.value)}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck="false"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="resposta_pergunta">Resposta da Pergunta</Label>
            <Input
              id="resposta_pergunta"
              placeholder="Resposta opcional"
              value={formData.resposta_pergunta}
              onChange={(e) => handleInputChange("resposta_pergunta", e.target.value)}
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