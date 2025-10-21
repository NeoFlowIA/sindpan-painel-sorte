import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Search, User, Calculator, Receipt, Store } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ClienteInlineForm } from "./ClienteInlineForm";
import { useAuth } from "@/contexts/AuthContext";
import { useCreateCupom, usePadariaTicketMedio, useClienteSaldoDesconto, useClienteSaldoPorPadaria, useResetClienteDesconto, gerarNumeroSorte } from "@/hooks/useCupons";
import { useUpdateCliente } from "@/hooks/useClientes";
import { useUpsertSaldoClientePadaria, saldoUtils } from "@/hooks/useSaldosPadarias";
import { useGraphQLQuery, useGraphQLMutation } from "@/hooks/useGraphQL";
import { GET_CLIENTE_BY_CPF_OR_WHATSAPP, GET_PADARIAS, GET_CUPONS_DISPONIVEIS, VINCULAR_CUPOM_AO_CLIENTE, ZERAR_SALDO_CUPONS_ANTERIORES, CREATE_CUPONS_DISPONIVEIS, GET_CAMPANHA_ATIVA, GET_PROXIMO_SORTEIO_AGENDADO } from "@/graphql/queries";
import { formatCPF, formatPhone, maskCPF } from "@/utils/formatters";

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
  padaria?: {
    id: string;
    nome: string;
  };
}

export function CupomModal({ open, onOpenChange, onCupomCadastrado }: CupomModalProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [clienteEncontrado, setClienteEncontrado] = useState<Cliente | null>(null);
  const [showClienteForm, setShowClienteForm] = useState(false);
  const [valorCompra, setValorCompra] = useState("");
  const [dataHora, setDataHora] = useState("");
  const [statusCupom, setStatusCupom] = useState<'ativo' | 'inativo'>('ativo');
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
    }
  }, [open]);

  // Hooks para GraphQL
  const { data: ticketMedioData } = usePadariaTicketMedio(user?.padarias_id || "");
  
  // Query para buscar cliente por CPF ou WhatsApp (similar ao AdminCupomModal)
  const { data: clienteData, refetch: refetchCliente } = useGraphQLQuery<{
    clientes: Array<{
      id: number;
      cpf: string;
      nome: string;
      whatsapp?: string;
      padaria_id?: string;
      resposta_pergunta?: string;
      cupons?: Array<{
        id: number;
        padaria_id: string;
        status: string;
      }>;
      padaria?: {
        id: string;
        nome: string;
      };
    }>;
  }>(
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

  // Query para buscar cupons disponíveis (similar ao AdminCupomModal)
  const { data: cuponsDisponiveisData, refetch: refetchCuponsDisponiveis } = useGraphQLQuery<{
    cupons: Array<{
      id: string;
      numero_sorte: string;
      serie: number;
      status: string;
    }>;
  }>(
    ['cupons-disponiveis'],
    GET_CUPONS_DISPONIVEIS,
    {}, // Sem parâmetros - busca todos os cupons disponíveis
    { enabled: false } // Só executa quando chamamos refetch
  );

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
  
  // Hook para gerenciar saldos por padaria
  const upsertSaldoMutation = useUpsertSaldoClientePadaria();

  // Mutation para zerar saldo de cupons anteriores
  const zerarSaldoAnteriorMutation = useGraphQLMutation(ZERAR_SALDO_CUPONS_ANTERIORES, {
    onError: (error: any) => {
      console.error("Erro ao zerar saldo anterior:", error);
    }
  });

  // Mutation para vincular cupom disponível ao cliente
  const vincularCupomMutation = useGraphQLMutation(VINCULAR_CUPOM_AO_CLIENTE, {
    onError: (error: any) => {
      console.error("Erro ao vincular cupom:", error);
    }
  });

  // Mutation para criar cupons disponíveis
  const criarCuponsDisponiveisMutation = useGraphQLMutation(CREATE_CUPONS_DISPONIVEIS, {
    onError: (error: any) => {
      console.error("Erro ao criar cupons disponíveis:", error);
    }
  });
  

  const ticketMedio = ticketMedioData?.padarias_by_pk?.ticket_medio || 28.65;
  
  // Dados de campanha e sorteio
  const campanhaAtiva = campanhaData?.campanha?.[0];
  const proximoSorteio = sorteioData?.sorteios?.[0];
  
  // Calcular saldo de desconto - usar apenas o último cupom da padaria (que contém o saldo acumulado)
  const saldoDescontoAtual = saldoDescontoData?.cupons?.[0]?.valor_desconto 
    ? parseFloat(saldoDescontoData.cupons[0].valor_desconto) 
    : 0;

  // Debug: Log dos dados para verificar se estão atualizados
  console.log('🔍 Debug Saldo Desconto por Padaria:', {
    clienteId: clienteEncontrado?.id,
    padariaId: user?.padarias_id,
    saldoDescontoData,
    saldoDescontoAtual,
    saldoRegistro: saldoDescontoData?.clientes_padarias_saldos?.[0],
  });

  // Função para obter timestamp no fuso horário de Brasília
  const getBrasiliaTimestamp = () => {
    const now = new Date();
    // Brasília está sempre UTC-3 (não há mais horário de verão)
    const brasiliaTime = new Date(now.getTime() - (3 * 60 * 60 * 1000));
    return brasiliaTime.toISOString();
  };

  // Função para buscar cupons disponíveis quando necessário (similar ao AdminCupomModal)
  const buscarCuponsDisponiveis = async (quantidade: number) => {
    try {
      // Buscar mais cupons do que necessário para ter opções para randomizar
      const result = await refetchCuponsDisponiveis();
      const todosCupons = result.data?.cupons || [];
      
      // Se não há cupons disponíveis, criar novos cupons
      if (todosCupons.length === 0) {
        console.log("🎫 Nenhum cupom disponível encontrado. Criando novos cupons...");
        await criarCuponsDisponiveis(quantidade + 10); // Criar 10 extras para ter estoque
        
        // Buscar novamente após criar
        const novoResult = await refetchCuponsDisponiveis();
        const novosCupons = novoResult.data?.cupons || [];
        
        if (novosCupons.length === 0) {
          console.error("❌ Erro: Não foi possível criar cupons disponíveis");
          return [];
        }
        
        // Usar os novos cupons criados
        const cuponsSelecionados = novosCupons.slice(0, quantidade);
        console.log(`🎫 Criados e selecionados ${cuponsSelecionados.length} cupons`);
        return cuponsSelecionados;
      }
      
      // Se temos cupons suficientes, randomizar a seleção
      if (todosCupons.length >= quantidade) {
        // Embaralhar array usando Fisher-Yates
        const cuponsEmbaralhados = [...todosCupons];
        for (let i = cuponsEmbaralhados.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [cuponsEmbaralhados[i], cuponsEmbaralhados[j]] = [cuponsEmbaralhados[j], cuponsEmbaralhados[i]];
        }
        
        // Retornar apenas a quantidade necessária
        const cuponsSelecionados = cuponsEmbaralhados.slice(0, quantidade);
        console.log(`🎫 Selecionados ${cuponsSelecionados.length} cupons de ${todosCupons.length} disponíveis`);
        return cuponsSelecionados;
      }
      
      // Se não temos cupons suficientes, criar mais cupons
      console.log(`⚠️ Apenas ${todosCupons.length} cupons disponíveis, necessários ${quantidade}. Criando mais cupons...`);
      const cuponsFaltantes = quantidade - todosCupons.length;
      await criarCuponsDisponiveis(cuponsFaltantes + 10); // Criar extras para estoque
      
      // Buscar novamente após criar
      const novoResult = await refetchCuponsDisponiveis();
      const todosCuponsAtualizados = novoResult.data?.cupons || [];
      
      if (todosCuponsAtualizados.length >= quantidade) {
        const cuponsSelecionados = todosCuponsAtualizados.slice(0, quantidade);
        console.log(`🎫 Criados e selecionados ${cuponsSelecionados.length} cupons`);
        return cuponsSelecionados;
      }
      
      // Se ainda não temos suficientes, retornar todos os disponíveis
      console.log(`⚠️ Apenas ${todosCuponsAtualizados.length} cupons disponíveis após criação`);
      return todosCuponsAtualizados;
    } catch (error) {
      console.error("Erro ao buscar cupons disponíveis:", error);
      return [];
    }
  };

  // Função para criar cupons disponíveis
  const criarCuponsDisponiveis = async (quantidade: number) => {
    try {
      const cuponsParaCriar = [];
      
      for (let i = 0; i < quantidade; i++) {
        const numeroSorte = gerarNumeroSorte();
        const serie = Math.floor(Math.random() * 1000000) + 1; // Série aleatória
        
        cuponsParaCriar.push({
          numero_sorte: numeroSorte,
          serie: serie,
          status: "disponivel",
          valor_compra: "0.00",
          valor_desconto: "0.00",
          data_compra: new Date().toISOString(),
          cliente_id: null,
          padaria_id: null,
          campanha_id: null,
          sorteio_id: null
        });
      }
      
      console.log(`🎫 Criando ${quantidade} cupons disponíveis...`);
      await criarCuponsDisponiveisMutation.mutateAsync({
        cupons: cuponsParaCriar
      });
      
      console.log(`✅ ${quantidade} cupons disponíveis criados com sucesso`);
    } catch (error) {
      console.error("Erro ao criar cupons disponíveis:", error);
      throw error;
    }
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
        toast({
          title: "Cliente não encontrado",
          description: "Nenhum cliente encontrado com os dados informados",
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



  const calcularCupons = () => {
    const valor = parseFloat(valorCompra) || 0;
    const valorTotal = valor + saldoDescontoAtual;
    return Math.floor(valorTotal / ticketMedio);
  };

  const calcularNovoSaldoDesconto = () => {
    const valor = parseFloat(valorCompra) || 0;
    const valorTotal = valor + saldoDescontoAtual;
    const cuponsGerados = Math.floor(valorTotal / ticketMedio);
    return valorTotal - (cuponsGerados * ticketMedio);
  };

  // Função para validar e atualizar padaria do cliente
  const validarEAtualizarPadaria = async (cliente: any, padariaIdNovosCupons: string) => {
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
    
    // Adicionar os novos cupons que serão criados
    const cuponsGerados = calcularCupons();
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
          changes: {
            padaria_id: parseInt(padariaComMaisCupons)
          }
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

    if (!clienteEncontrado || !clienteEncontrado.id || !valorCompra || !padariaId) {
      toast({
        title: "Erro",
        description: "Cliente, valor da compra e padaria são obrigatórios",
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

    const cuponsGerados = calcularCupons();
    
    if (cuponsGerados === 0) {
      toast({
        title: "Erro", 
        description: `Valor insuficiente para gerar cupons. Valor mínimo: R$ ${ticketMedio.toFixed(2)}`,
        variant: "destructive"
      });
      return;
    }

    // Buscar cupons disponíveis
    const cuponsDisponiveis = await buscarCuponsDisponiveis(cuponsGerados);
    if (cuponsDisponiveis.length < cuponsGerados) {
      toast({
        title: "Erro", 
        description: `Não há cupons disponíveis suficientes. Disponíveis: ${cuponsDisponiveis.length}, Necessários: ${cuponsGerados}`,
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);

    try {
      // Preparar data no fuso horário de Brasília
      const dataCompra = dataHora ? 
        new Date(dataHora).toISOString() : 
        getBrasiliaTimestamp();

      const numerosSorte: string[] = [];
      const novoSaldo = calcularNovoSaldoDesconto();

      // PRIMEIRO: Zerar saldo de cupons anteriores desta padaria
      await zerarSaldoAnteriorMutation.mutateAsync({
        cliente_id: clienteEncontrado.id,
        padaria_id: user.padarias_id
      });

      // Vincular cupons disponíveis ao cliente
      for (let i = 0; i < cuponsGerados; i++) {
        const cupomDisponivel = cuponsDisponiveis[i];
        numerosSorte.push(cupomDisponivel.numero_sorte);

        const ehUltimoCupom = i === cuponsGerados - 1;

        await vincularCupomMutation.mutateAsync({
          id: cupomDisponivel.id,
          cliente_id: String(clienteEncontrado.id),
          padaria_id: user.padarias_id,
          valor_compra: String(ticketMedio.toFixed(2)), // Cada cupom = ticket_medio
          valor_desconto: ehUltimoCupom ? String(novoSaldo.toFixed(2)) : "0", // Último cupom guarda o novo saldo
          data_compra: dataCompra,
          status: "ativo",
          campanha_id: null,
          sorteio_id: null
        });
      }

      // Calcular e salvar saldo por padaria (considerando saldo anterior)
      const trocoCentavos = saldoUtils.calcularTroco(valor, ticketMedio, saldoDescontoAtual);
      if (trocoCentavos > 0) {
        console.log('💰 Calculando saldo por padaria:', {
          valorCompra: valor,
          saldoAnterior: saldoDescontoAtual,
          valorTotal: valor + saldoDescontoAtual,
          ticketMedio,
          trocoCentavos,
          clienteId: clienteEncontrado.id,
          padariaId: user.padarias_id
        });

      const receiptData = response.register_receipt_basic;
      const cuponsEmitidos = receiptData?.cupons_emitidos_agora ?? cuponsGerados;
      const saldoAtual = (receiptData?.saldo_atual_centavos ?? 0) / 100;
      const saldoFormatado = new Intl.NumberFormat('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(Number.isFinite(saldoAtual) ? saldoAtual : 0);
      const cupomLabel = cuponsEmitidos === 1 ? 'cupom' : 'cupons';
      const emitidoLabel = cuponsEmitidos === 1 ? 'emitido' : 'emitidos';

      toast({
        title: "Cupons criados com sucesso!",
        description: `${cuponsGerados} cupons criados: ${numerosSorte.join(", ")}${trocoCentavos > 0 ? ` | Saldo: ${saldoUtils.formatarSaldo(trocoCentavos)}` : ''}`
      });

      // VALIDAÇÃO E ATUALIZAÇÃO DA PADARIA NO BANCO
      await validarEAtualizarPadaria(clienteEncontrado, padariaId);

      // Forçar atualização do saldo de desconto
      if (clienteEncontrado?.id) {
        await refetchSaldoDesconto();
      }

      // Reset form
      setSearchTerm("");
      setClienteEncontrado(null);
      setShowClienteForm(false);
      setValorCompra("");
      setStatusCupom('ativo');

      // Fechar modal automaticamente
      onOpenChange(false);

      // Atualizar dados da página
      onCupomCadastrado();
    } catch (error) {
      console.error("Erro ao cadastrar cupom:", error);
      toast({
        title: "Erro",
        description: "Erro ao criar cupom. Tente novamente.",
        variant: "destructive"
      });
    }
  };

  const cuponsGerados = calcularCupons();
  const novoSaldoDesconto = calcularNovoSaldoDesconto();

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
                     Saldo de desconto: R$ {saldoDescontoAtual.toFixed(2)}
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
          {clienteEncontrado && valorCompra && (
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
                  {saldoDescontoAtual > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Saldo Acumulado:</span>
                      <span className="font-medium text-green-600">+ R$ {saldoDescontoAtual.toFixed(2)}</span>
                    </div>
                  )}
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
                    <span>{cuponsGerados}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Cupons disponíveis:</span>
                    <span className="font-medium text-blue-600">
                      Verificando...
                    </span>
                  </div>
                  {cuponsGerados > 0 && (
                    <div className="bg-blue-50 -mx-4 px-4 py-2 rounded text-xs text-blue-700">
                      {cuponsGerados} {cuponsGerados === 1 ? 'cupom' : 'cupons'} de R$ {ticketMedio.toFixed(2)} cada
                    </div>
                  )}
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                    <p className="text-sm text-blue-600">
                      ℹ️ Cupons disponíveis serão verificados ao confirmar.
                    </p>
                  </div>
                  {novoSaldoDesconto > 0 && (
                    <div className="flex justify-between bg-green-50 -mx-4 px-4 py-2 rounded">
                      <span className="text-sm font-medium text-green-700">Novo Saldo (próxima compra):</span>
                      <span className="text-sm font-bold text-green-700">
                        R$ {novoSaldoDesconto.toFixed(2)}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!clienteEncontrado || !valorCompra || isLoading}
            >
              {registerReceiptBasic.isPending ? "Criando..." : "Criar Cupom"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}