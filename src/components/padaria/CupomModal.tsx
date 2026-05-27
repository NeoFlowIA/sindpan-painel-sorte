import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Search, User, Calculator, Receipt, Store } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ClienteInlineForm } from "./ClienteInlineForm";
import { useAuth } from "@/contexts/AuthContext";
import { usePadariaTicketMedio, useClienteSaldoPorPadaria, useRegisterReceiptBasic } from "@/hooks/useCupons";
import { useAtendentes } from "@/hooks/useAtendentes";
import { useUpdateCliente } from "@/hooks/useClientes";
import { saldoUtils } from "@/hooks/useSaldosPadarias";
import { SaldosPorPadaria } from "@/components/SaldosPorPadaria";
import { useGraphQLMutation, useGraphQLQuery } from "@/hooks/useGraphQL";
import { GET_CLIENTE_BY_CPF_OR_WHATSAPP, GET_PADARIAS, GET_CAMPANHA_ATIVA, GET_PROXIMO_SORTEIO_AGENDADO, UPDATE_COMPRA_ATENDENTE } from "@/graphql/queries";
import { formatCPF, formatPhone, maskCPF } from "@/utils/formatters";
import { NovoClienteModal } from "./NovoClienteModal";

interface CupomModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCupomCadastrado: () => void;
}

interface Cliente {
  id?: string;
  cpf: string;
  nome: string;
  whatsapp?: string;
  padaria_id?: string;
  resposta_pergunta?: string;
  saldoAcumulado?: string; // Calculado dinamicamente se necessário
  cupons?: Array<{
    id: string;
    padaria_id: string;
    status: string;
  }>;
  padaria?: {
    id: string;
    nome: string;
  };
}

type ClienteQueryData = {
  clientes: Cliente[];
};

export function CupomModal({ open, onOpenChange, onCupomCadastrado }: CupomModalProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [clienteEncontrado, setClienteEncontrado] = useState<Cliente | null>(null);
  const [showClienteForm, setShowClienteForm] = useState(false);
  const [valorCompra, setValorCompra] = useState("");
  const [dataHora, setDataHora] = useState("");
  const [statusCupom, setStatusCupom] = useState<'ativo' | 'inativo'>('ativo');
  const [atendenteIdSelecionado, setAtendenteIdSelecionado] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [processingMessage, setProcessingMessage] = useState("");
  const [novoClienteModalAberto, setNovoClienteModalAberto] = useState(false);
  const [identificadorNovoCliente, setIdentificadorNovoCliente] = useState<{ cpf?: string; whatsapp?: string }>({});
  const [ultimoSaldoCentavos, setUltimoSaldoCentavos] = useState<number | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  // Reset automático do modal quando fechado
  useEffect(() => {
    if (!open) {
      // Reset todos os estados quando o modal é fechado
      setSearchTerm("");
      setClienteEncontrado(null);
      setShowClienteForm(false);
      setValorCompra("");
      setDataHora("");
      setStatusCupom('ativo');
      setAtendenteIdSelecionado("");
      setProcessingMessage("");
      setNovoClienteModalAberto(false);
      setIdentificadorNovoCliente({});
    }
  }, [open]);

  // Hooks para GraphQL
  const { data: ticketMedioData } = usePadariaTicketMedio(user?.padarias_id || "");
  const updateCompraAtendenteMutation = useGraphQLMutation<{ update_compras_by_pk: { id: string } }, { id: string; atendente_id: string; valor_centavos: number }>(UPDATE_COMPRA_ATENDENTE);

  const registerReceiptBasicMutation = useRegisterReceiptBasic();

  const { data: atendentesData } = useAtendentes(user?.padarias_id || user?.padarias?.id || "");
  
  // Query para buscar cliente por CPF ou WhatsApp (similar ao AdminCupomModal)
  const { data: clienteData, refetch: refetchCliente } = useGraphQLQuery<ClienteQueryData>(
    ['search-cliente', searchTerm],
    GET_CLIENTE_BY_CPF_OR_WHATSAPP,
    { cpf: searchTerm.replace(/\D/g, ""), whatsapp: searchTerm },
    { enabled: false } // Só executa quando chamamos refetch
  );

  // Query para buscar padarias (para alocação automática)
  const { data: padariasData } = useGraphQLQuery<{
    padarias: Array<{
      id: string;
      nome: string;
    }>;
  }>(['padarias-list'], GET_PADARIAS);

  // Query para buscar campanha ativa
  const { data: campanhaData } = useGraphQLQuery<{
    campanha: Array<{
      id: string;
      Nome: string;
      data_inicio: string;
      data_fim: string;
      ativo: boolean;
    }>;
  }>(
    ['campanha-ativa'],
    GET_CAMPANHA_ATIVA,
    { hoje: new Date().toISOString() }
  );

  // Query para buscar próximo sorteio
  const { data: sorteioData } = useGraphQLQuery<{
    sorteios: Array<{
      id: string;
      data_sorteio: string;
      campanha_id: string;
      campanha: {
        id: string;
        Nome: string;
      };
    }>;
  }>(
    ['proximo-sorteio'],
    GET_PROXIMO_SORTEIO_AGENDADO
  );
  
  // Usar saldo específico por padaria ao invés de saldo geral
  const { data: saldoDescontoData, refetch: refetchSaldoDesconto } = useClienteSaldoPorPadaria(
    clienteEncontrado?.id,
    user?.padarias_id
  );
  
  // Removido useAlocarCupons - usando lógica personalizada
  
  // Hook para atualizar cliente
  const updateClienteMutation = useUpdateCliente();
  
  const ticketMedio = ticketMedioData?.padarias_by_pk?.ticket_medio || 28.65;
  
  // Dados de campanha e sorteio
  const campanhaAtiva = campanhaData?.campanha?.[0];
  const proximoSorteio = sorteioData?.sorteios?.[0];
  
  // Calcular saldo de desconto - usar apenas o último saldo da padaria
  const saldoQueryCentavos = saldoDescontoData?.clientes_padarias_saldos?.[0]?.saldo_centavos;
  const saldoDescontoCentavos =
    saldoQueryCentavos !== undefined && saldoQueryCentavos !== null
      ? Number(saldoQueryCentavos)
      : ultimoSaldoCentavos ?? 0;
  const saldoDescontoAtual = saldoDescontoCentavos / 100;
  const saldoDescontoFormatado = saldoUtils.formatarSaldo(saldoDescontoCentavos);

  // Debug: Log dos dados para verificar se estão atualizados
  console.log('🔍 Debug Saldo Desconto por Padaria (CupomModal):', {
    clienteId: clienteEncontrado?.id,
    padariaId: user?.padarias_id,
    saldoDescontoData,
    saldoDescontoAtual,
    saldoRegistro: saldoDescontoData?.clientes_padarias_saldos?.[0],
    saldoCentavosAtual: saldoDescontoData?.clientes_padarias_saldos?.[0]?.saldo_centavos,
    ultimoSaldoCentavos
  });

  useEffect(() => {
    const saldoAtualizado = saldoDescontoData?.clientes_padarias_saldos?.[0]?.saldo_centavos;
    if (saldoAtualizado !== undefined && saldoAtualizado !== null) {
      setUltimoSaldoCentavos(Number(saldoAtualizado));
    }
  }, [saldoDescontoData]);

  useEffect(() => {
    if (clienteEncontrado?.id && user?.padarias_id) {
      refetchSaldoDesconto();
    }
  }, [clienteEncontrado?.id, user?.padarias_id, refetchSaldoDesconto]);

  useEffect(() => {
    if (!clienteEncontrado?.id) {
      setUltimoSaldoCentavos(null);
    }
  }, [clienteEncontrado?.id]);

  // Função para obter timestamp no fuso horário de Brasília
  const getBrasiliaTimestamp = () => {
    const now = new Date();
    // Brasília está sempre UTC-3 (não há mais horário de verão)
    const brasiliaTime = new Date(now.getTime() - (3 * 60 * 60 * 1000));
    return brasiliaTime.toISOString();
  };

  // Função para calcular padaria com mais cupons (similar ao AdminCupomModal)
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
    
    console.log("🔍 DEBUG - Padaria com mais cupons calculada:", {
      cuponsPorPadaria: Object.fromEntries(cuponsPorPadaria),
      padariaComMaisCupons,
      maxCupons,
      padariaAtual: cliente.padaria_id
    });
    
    return padariaComMaisCupons;
  };

  // Função de busca de cliente (similar ao AdminCupomModal)
  const handleSearch = async () => {
    if (!searchTerm.trim()) return;

    try {
      const result = await refetchCliente();
      const clientes = (result.data as any)?.clientes || [];
      
      console.log('🔍 Resultado da busca:', { searchTerm, clientes });
      
      if (clientes.length > 0) {
        const cliente = clientes[0];
        setClienteEncontrado({
          ...cliente,
          saldoAcumulado: "0"
        });
        
        // Calcular padaria com mais cupons automaticamente
        const padariaComMaisCupons = calcularPadariaComMaisCupons(cliente);
        
        // Mostrar feedback se a vinculação foi alterada
        if (padariaComMaisCupons && padariaComMaisCupons !== cliente.padaria_id) {
          const padaria = padariasData?.padarias?.find((p: any) => p.id === padariaComMaisCupons);
          toast({
            title: "Cliente encontrado!",
            description: `${cliente.nome} foi encontrado. Padaria automaticamente vinculada: ${padaria?.nome || 'N/A'}`,
          });
        } else {
          toast({
            title: "Cliente encontrado!",
            description: `${cliente.nome} foi encontrado com sucesso`
          });
        }
      } else {
        setClienteEncontrado(null);

        const apenasNumeros = searchTerm.replace(/\D/g, "");
        const ehCPF = apenasNumeros.length === 11 && !searchTerm.includes("@");

        setIdentificadorNovoCliente({
          cpf: ehCPF ? apenasNumeros : undefined,
          whatsapp: ehCPF ? undefined : apenasNumeros || searchTerm
        });
        setNovoClienteModalAberto(true);

        toast({
          title: "Cliente não encontrado",
          description: "Cadastre o cliente para continuar o registro do cupom.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Erro ao buscar cliente:", error);
      toast({
        title: "Erro",
        description: "Erro ao buscar cliente",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    if (open) {
      // Set current date/time in Brasília timezone (UTC-3)
      const now = new Date();
      const brasiliaTime = new Date(now.getTime() - (3 * 60 * 60 * 1000)); // UTC-3
      const formatted = brasiliaTime.toISOString().slice(0, 16);
      setDataHora(formatted);
    }
  }, [open]);

  // Função para calcular a padaria com mais cupons



  // Função para validar e atualizar padaria do cliente
  const validarEAtualizarPadaria = async (
    cliente: any,
    padariaIdNovosCupons: string,
    novosCuponsEmitidos: number
  ) => {
    console.log("🔍 DEBUG - Iniciando validação de padaria:", {
      cliente: cliente.nome,
      padariaIdNovosCupons,
      padariaIdOriginal: cliente.padaria_id,
      cupons: cliente.cupons
    });

    // Calcular cupons atuais por padaria
    const cuponsAtivos = cliente.cupons?.filter((cupom: any) => cupom.status === "ativo") || [];
    const cuponsPorPadaria = new Map<string, number>();
    
    cuponsAtivos.forEach((cupom: any) => {
      const padariaId = cupom.padaria_id || cliente.padaria_id;
      if (padariaId) {
        cuponsPorPadaria.set(padariaId, (cuponsPorPadaria.get(padariaId) || 0) + 1);
      }
    });

    // Adicionar os novos cupons emitidos pela API
    const cuponsGerados = novosCuponsEmitidos || 0;
    const cuponsAtuaisNovaPadaria = cuponsPorPadaria.get(padariaIdNovosCupons) || 0;
    const totalCuponsNovaPadaria = cuponsAtuaisNovaPadaria + cuponsGerados;
    
    // Encontrar a padaria com mais cupons (incluindo a nova)
    let padariaComMaisCupons = padariaIdNovosCupons;
    let maxCupons = totalCuponsNovaPadaria;
    
    cuponsPorPadaria.forEach((quantidade, padariaId) => {
      if (padariaId !== padariaIdNovosCupons && quantidade > maxCupons) {
        maxCupons = quantidade;
        padariaComMaisCupons = padariaId;
      }
    });
    
    console.log("🔍 DEBUG - Cálculos de validação:", {
      cuponsAtivos: cuponsAtivos.length,
      cuponsPorPadaria: Object.fromEntries(cuponsPorPadaria),
      cuponsGerados,
      cuponsAtuaisNovaPadaria,
      totalCuponsNovaPadaria,
      padariaComMaisCupons,
      maxCupons,
      deveAtualizar: padariaComMaisCupons !== cliente.padaria_id
    });
    
    // Validação: se a padaria com mais cupons é diferente da atual, atualizar no banco
    if (padariaComMaisCupons !== cliente.padaria_id) {
      console.log("✅ DEBUG - Atualizando padaria no banco de dados");
      try {
        // Atualizar padaria do cliente no banco
        await updateClienteMutation.mutateAsync({
          id: cliente.id,
          padaria_id: padariaComMaisCupons
        });
        
        console.log("✅ DEBUG - Padaria atualizada com sucesso");
        const padariaNome = padariasData?.padarias?.find((p: any) => p.id === padariaComMaisCupons)?.nome || 'N/A';
        toast({
          title: "Padaria atualizada!",
          description: `Padaria do cliente foi atualizada para: ${padariaNome} (${maxCupons} cupons)`,
        });
        
        return true;
      } catch (error) {
        console.error("❌ DEBUG - Erro ao atualizar padaria do cliente:", error);
        toast({
          title: "Aviso",
          description: "Cupons criados, mas não foi possível atualizar a padaria do cliente",
          variant: "destructive"
        });
        return false;
      }
    } else {
      console.log("ℹ️ DEBUG - Não é necessário atualizar padaria");
    }
    
    return false;
  };

  const handleSubmit = async () => {
    const padariaId = user?.padarias_id;

    // VALIDAÇÕES IMEDIATAS (antes de buscar no banco)
    if (!clienteEncontrado || !clienteEncontrado.id || !valorCompra || !padariaId || !atendenteIdSelecionado) {
      toast({
        title: "Erro",
        description: "Cliente, valor da compra, padaria e atendente são obrigatórios",
        variant: "destructive"
      });
      return;
    }

    const valor = parseFloat(valorCompra);
    if (valor <= 0) {
      toast({
        title: "Erro",
        description: "Valor da compra deve ser maior que zero",
        variant: "destructive"
      });
      return;
    }

    // Validação: verificar se há campanha ativa
    if (!campanhaAtiva) {
      toast({
        title: "Cupom não gerado", 
        description: "Não há campanha ativa no momento. Crie ou ative uma campanha antes de gerar cupons.",
        variant: "destructive"
      });
      setIsLoading(false);
      setProcessingMessage("");
      return;
    }

    const cnpjLimpo = (user?.cnpj || "").replace(/\D/g, "");
    if (!cnpjLimpo) {
      toast({
        title: "Erro",
        description: "CNPJ da padaria é obrigatório para registrar o cupom",
        variant: "destructive",
      });
      return;
    }

    const valorCentavos = Math.round(valor * 100);
    const dataCompra = dataHora ? new Date(dataHora).toISOString() : getBrasiliaTimestamp();

    // AGORA SIM: Iniciar processamento e buscar no banco
    setIsLoading(true);
    setProcessingMessage("🔄 Registrando compra e gerando cupons...");

    try {
      const registerResult = await registerReceiptBasicMutation.mutateAsync({
        cliente: String(clienteEncontrado.id),
        padaria: padariaId,
        valor: valorCentavos,
        data: dataCompra,
        cnpj: cnpjLimpo,
        conf: 1.0,
        raw: "raw",
        img: "img",
      });

      const registro = registerResult?.register_receipt_basic;
      const receiptId = (registro as any)?.receipt_id;
      if (receiptId && atendenteIdSelecionado) {
        await updateCompraAtendenteMutation.mutateAsync({
          id: receiptId,
          atendente_id: atendenteIdSelecionado,
          valor_centavos: valorCentavos,
        });
      }

      let saldoAtualCentavos =
        registro?.saldo_atual_centavos !== undefined && registro?.saldo_atual_centavos !== null
          ? Number(registro.saldo_atual_centavos)
          : null;
      let cuponsEmitidosAgora =
        registro?.cupons_emitidos_agora !== undefined && registro?.cupons_emitidos_agora !== null
          ? Number(registro.cupons_emitidos_agora)
          : null;

      if (saldoAtualCentavos === null || cuponsEmitidosAgora === null) {
        setProcessingMessage("🔄 Sincronizando saldos...");

        const saldoRefetchFallback = await refetchSaldoDesconto();
        const saldoCentavosRefetch = (saldoRefetchFallback?.data as typeof saldoDescontoData | undefined)?.clientes_padarias_saldos?.[0]?.saldo_centavos;

        if (saldoCentavosRefetch !== undefined && saldoCentavosRefetch !== null) {
          saldoAtualCentavos = Number(saldoCentavosRefetch);
        }

        if (cuponsEmitidosAgora === null) {
          cuponsEmitidosAgora = 0;
        }

        if (saldoAtualCentavos === null) {
          console.error("❌ register_receipt_basic não retornou saldo nem refetch produziu valor:", registerResult);
          toast({
            title: "Erro ao registrar compra",
            description: "Não foi possível sincronizar o saldo. Tente novamente.",
            variant: "destructive",
          });
          return;
        }
      }

      setUltimoSaldoCentavos(saldoAtualCentavos);

      setProcessingMessage("💾 Sincronizando saldos...");

      const saldoRefetch = await refetchSaldoDesconto();

      const saldoCentavosRefetch = (saldoRefetch?.data as typeof saldoDescontoData | undefined)?.clientes_padarias_saldos?.[0]?.saldo_centavos;
      if (saldoCentavosRefetch !== undefined && saldoCentavosRefetch !== null) {
        setUltimoSaldoCentavos(Number(saldoCentavosRefetch));
        saldoAtualCentavos = Number(saldoCentavosRefetch);
      }

      const saldoFormatado = saldoUtils.formatarSaldo(saldoAtualCentavos ?? 0);
      const cupomLabel = cuponsEmitidosAgora === 1 ? 'cupom' : 'cupons';
      const emitidoLabel = cuponsEmitidosAgora === 1 ? 'emitido' : 'emitidos';

      const gerouCupons = cuponsEmitidosAgora > 0;
      const tituloToast = gerouCupons
        ? "Cupons registrados com sucesso!"
        : "Compra registrada e saldo atualizado";
      const descricaoToast = gerouCupons
        ? `${cuponsEmitidosAgora} ${cupomLabel} ${emitidoLabel}. Saldo atual: ${saldoFormatado}`
        : `Nenhum cupom emitido por estar abaixo do ticket médio, mas o saldo foi atualizado. Saldo atual: ${saldoFormatado}`;

      toast({
        title: tituloToast,
        description: descricaoToast,
      });

      setProcessingMessage("🏪 Validando padaria do cliente...");

      // VALIDAÇÃO E ATUALIZAÇÃO DA PADARIA NO BANCO
      await validarEAtualizarPadaria(clienteEncontrado, padariaId, cuponsEmitidosAgora);

      // Reset form
      setSearchTerm("");
      setClienteEncontrado(null);
      setShowClienteForm(false);
      setValorCompra("");
      setStatusCupom('ativo');
      setAtendenteIdSelecionado("");

      // Fechar modal automaticamente
      onOpenChange(false);

      // Atualizar dados da página
      onCupomCadastrado();
    } catch (error) {
      console.error("Erro ao cadastrar cupom:", error);
      toast({
        title: "Erro",
        description: "Erro ao criar cupom. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setProcessingMessage("");
    }
  };

  const handleNovoClienteFechado = () => {
    setNovoClienteModalAberto(false);
    setIdentificadorNovoCliente({});
  };

  const handleClienteCriado = async (novoCliente?: Cliente) => {
    const identificadorAnterior = identificadorNovoCliente;
    handleNovoClienteFechado();

    if (!novoCliente) {
      return;
    }

    const cpfLimpo = novoCliente.cpf?.replace(/\D/g, "");
    const whatsappNormalizado = novoCliente.whatsapp || identificadorAnterior.whatsapp;

    if (cpfLimpo) {
      setSearchTerm(maskCPF(cpfLimpo));
    } else if (whatsappNormalizado) {
      setSearchTerm(whatsappNormalizado);
    }

    const clienteId = novoCliente.id ? String(novoCliente.id) : undefined;

    setClienteEncontrado({
      ...novoCliente,
      id: clienteId,
      saldoAcumulado: "0"
    });

    try {
      await new Promise((resolve) => setTimeout(resolve, 0));
      const resultadoBusca = await refetchCliente();
      const clientes = (resultadoBusca.data as ClienteQueryData | undefined)?.clientes ?? [];
      const clienteAtualizado = clientes.find((cliente) => cliente.id === novoCliente.id);

      if (clienteAtualizado) {
        setClienteEncontrado({
          ...clienteAtualizado,
          id: clienteAtualizado.id ? String(clienteAtualizado.id) : clienteAtualizado.id,
          saldoAcumulado: "0"
        });
      }
    } catch (error) {
      console.error("Erro ao atualizar cliente recém-criado:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Criar Cupom</DialogTitle>
          <DialogDescription>
            Registre a compra para gerar cupons automaticamente
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Info de Campanha e Sorteio */}
          {(campanhaAtiva || proximoSorteio) && (
            <Card className="border-primary/20 bg-primary/5">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Vinculação automática
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {campanhaAtiva ? (
                  <div>
                    <span className="font-medium">Campanha:</span>{' '}
                    <span className="text-primary">{campanhaAtiva.Nome}</span>
                  </div>
                ) : (
                  <div className="text-amber-600">
                    ⚠️ Nenhuma campanha ativa no momento
                  </div>
                )}
                {proximoSorteio ? (
                  <div>
                    <span className="font-medium">Próximo sorteio:</span>{' '}
                    <span className="text-primary">
                      {new Date(proximoSorteio.data_sorteio).toLocaleString('pt-BR')}
                    </span>
                  </div>
                ) : (
                  <div className="text-amber-600">
                    ⚠️ Nenhum sorteio agendado
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Cliente Search */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <User className="w-5 h-5" />
                Identificação do Cliente
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Input
                  placeholder="Digite CPF ou WhatsApp do cliente"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                />
                <Button onClick={handleSearch} variant="outline">
                  <Search className="w-4 h-4" />
                </Button>
              </div>

               {/* Cliente encontrado */}
               {clienteEncontrado && (
                 <div className="mt-4 p-4 bg-muted/50 rounded-lg">
                   <div className="flex items-center gap-2 mb-2">
                     <h4 className="font-medium text-foreground">{clienteEncontrado.nome}</h4>
                     {(() => {
                       const padariaComMaisCupons = calcularPadariaComMaisCupons(clienteEncontrado);
                       const foiAlterada = padariaComMaisCupons && padariaComMaisCupons !== clienteEncontrado.padaria_id;
                       return foiAlterada && (
                         <Badge variant="secondary" className="text-xs">
                           Padaria auto-vinculada
                         </Badge>
                       );
                     })()}
                   </div>
                   <p className="text-sm text-muted-foreground">CPF: {maskCPF(clienteEncontrado.cpf)}</p>
                   <p className="text-sm text-muted-foreground">WhatsApp: {formatPhone(clienteEncontrado.whatsapp || '')}</p>
                   <p className="text-sm text-muted-foreground">
                     Saldo de desconto: {saldoDescontoFormatado}
                   </p>
                   
                   {/* Informação sobre vinculação automática */}
                   {(() => {
                     const padariaComMaisCupons = calcularPadariaComMaisCupons(clienteEncontrado);
                     const foiAlterada = padariaComMaisCupons && padariaComMaisCupons !== clienteEncontrado.padaria_id;
                     
                     if (foiAlterada) {
                       return (
                         <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-700">
                           <strong>Vinculação automática:</strong> Padaria foi automaticamente vinculada baseada nos cupons ativos.
                         </div>
                       );
                     }
                     return null;
                   })()}
                 </div>
               )}

              {/* Formulário inline para novo cliente */}
              {showClienteForm && (
                <div className="mt-4">
                  <ClienteInlineForm
                    onClienteCriado={(cliente) => {
                      setClienteEncontrado({
                        ...cliente,
                        id: String(cliente.id), // Converter id para string
                        saldoAcumulado: "0" // Converter para string
                      });
                      setShowClienteForm(false);
                    }}
                    searchTerm={searchTerm}
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Saldos por Padaria */}
          {clienteEncontrado && (
            <SaldosPorPadaria 
              clienteId={clienteEncontrado.id} 
              className="border-green-200 bg-green-50/50"
            />
          )}

          {/* Dados da Compra */}
          {clienteEncontrado && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Receipt className="w-5 h-5" />
                  Dados da Compra
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="valor">Valor da Compra (R$)</Label>
                    <Input
                      id="valor"
                      type="number"
                      step="0.01"
                      placeholder="0,00"
                      value={valorCompra}
                      onChange={(e) => setValorCompra(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dataHora">Data/Hora</Label>
                    <Input
                      id="dataHora"
                      type="datetime-local"
                      value={dataHora}
                      onChange={(e) => setDataHora(e.target.value)}
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="atendente">Atendente</Label>
                    <Select value={atendenteIdSelecionado} onValueChange={setAtendenteIdSelecionado}>
                      <SelectTrigger id="atendente">
                        <SelectValue placeholder="Selecione o atendente" />
                      </SelectTrigger>
                      <SelectContent>
                        {(atendentesData?.atendentes || []).map((atendente) => (
                          <SelectItem key={atendente.id} value={atendente.id}>{atendente.nome}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="status">Status do Cupom</Label>
                    <select
                      id="status"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      value={statusCupom}
                      onChange={(e) => setStatusCupom(e.target.value as 'ativo' | 'inativo')}
                    >
                      <option value="ativo">Ativo</option>
                      <option value="inativo">Inativo</option>
                    </select>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Resumo */}
          {clienteEncontrado && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Calculator className="w-5 h-5" />
                  Resumo do Cupom
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Padaria Selecionada:</span>
                    <span className="font-medium">
                      {user?.padarias_id 
                        ? (padariasData?.padarias || []).find(p => p.id === user.padarias_id)?.nome || 'N/A'
                        : 'Nenhuma'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Ticket Médio:</span>
                    <span className="font-medium">R$ {ticketMedio.toFixed(2)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Valor da Compra:</span>
                    <span className="font-medium">R$ {parseFloat(valorCompra || "0").toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Saldo Acumulado:</span>
                    <span className="font-medium text-green-600">
                      + R$ {saldoDescontoAtual.toFixed(2)}
                      {isLoading && " (atualizando...)"}
                    </span>
                  </div>
                  {(parseFloat(valorCompra || "0") + saldoDescontoAtual) > 0 && (
                    <div className="flex justify-between bg-primary/10 -mx-4 px-4 py-2">
                      <span className="font-medium">Valor Total:</span>
                      <span className="font-bold text-primary">
                        R$ {(parseFloat(valorCompra || "0") + saldoDescontoAtual).toFixed(2)}
                      </span>
                    </div>
                  )}
                  <Separator />
                  <div className="flex justify-between text-primary font-medium text-lg">
                    <span>Cupons Gerados:</span>
                    <span>Será calculado na confirmação</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Saldo após confirmação:</span>
                    <span className="font-medium text-green-600">
                      Atualizado pelo sistema
                    </span>
                  </div>
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                    <p className="text-sm text-blue-600">
                      ℹ️ Cupons e saldo são calculados automaticamente pela confirmação do cupom.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Mensagem de Processamento */}
          {isLoading && processingMessage && (
            <Card className="border-blue-200 bg-blue-50/50">
              <CardContent className="pt-4">
                <div className="flex items-center gap-3">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent"></div>
                  <p className="text-sm text-blue-700 font-medium">{processingMessage}</p>
                </div>
                <p className="text-xs text-blue-600 mt-2">
                  Por favor, aguarde enquanto processamos seu cupom...
                </p>
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
              Cancelar
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!clienteEncontrado || !valorCompra || !atendenteIdSelecionado || isLoading}
            >
              {isLoading ? "Processando..." : "Criar Cupom"}
            </Button>
          </div>
        </div>
      </DialogContent>
      <NovoClienteModal
        open={novoClienteModalAberto}
        onOpenChange={(estado) => {
          setNovoClienteModalAberto(estado);

          if (!estado) {
            setIdentificadorNovoCliente({});
          }
        }}
        onClienteAdded={handleClienteCriado}
        initialCPF={identificadorNovoCliente.cpf}
        initialWhatsapp={identificadorNovoCliente.whatsapp}
      />
    </Dialog>
  );
}
