import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Search, User, Calculator, Receipt, Store } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useGraphQLQuery, useGraphQLMutation } from "@/hooks/useGraphQL";
import { useUpdateCliente } from "@/hooks/useClientes";
import { useUpsertSaldoClientePadaria, useInsertSaldoClientePadaria, saldoUtils } from "@/hooks/useSaldosPadarias";
import { SaldosPorPadaria } from "@/components/SaldosPorPadaria";
import { GET_CLIENTE_BY_CPF_OR_WHATSAPP, GET_CAMPANHA_ATIVA, GET_PROXIMO_SORTEIO_AGENDADO, GET_PADARIAS, GET_PADARIA_TICKET_MEDIO, GET_CLIENTE_SALDO_POR_PADARIA, ZERAR_SALDO_CUPONS_ANTERIORES, GET_CUPONS_DISPONIVEIS, VINCULAR_CUPOM_AO_CLIENTE } from "@/graphql/queries";
import { formatCPF, formatPhone, maskCPF } from "@/utils/formatters";
import { AdminNovoClienteModal } from "./AdminNovoClienteModal";

interface AdminCupomModalProps {
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
  saldoAcumulado?: string;
  padaria?: {
    id: string;
    nome: string;
  };
}

type ClienteBuscaData = {
  clientes: Cliente[];
};

export function AdminCupomModal({ open, onOpenChange, onCupomCadastrado }: AdminCupomModalProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [clienteEncontrado, setClienteEncontrado] = useState<Cliente | null>(null);
  const [valorCompra, setValorCompra] = useState("");
  const [dataHora, setDataHora] = useState("");
  const [statusCupom, setStatusCupom] = useState<'ativo' | 'inativo'>('ativo');
  const [padariaIdSelecionada, setPadariaIdSelecionada] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [processingMessage, setProcessingMessage] = useState("");
  const [novoClienteModalAberto, setNovoClienteModalAberto] = useState(false);
  const [identificadorNovoCliente, setIdentificadorNovoCliente] = useState<{ cpf?: string; whatsapp?: string }>({});
  const { toast } = useToast();

  // Reset automático do modal quando fechado
  useEffect(() => {
    if (!open) {
      // Reset todos os estados quando o modal é fechado
      setSearchTerm("");
      setClienteEncontrado(null);
      setValorCompra("");
      setDataHora("");
      setStatusCupom('ativo');
      setPadariaIdSelecionada("");
      setIsLoading(false);
      setProcessingMessage("");
      setNovoClienteModalAberto(false);
      setIdentificadorNovoCliente({});
    }
  }, [open]);

  // Query para buscar cliente
  const { data: clienteData, refetch: refetchCliente } = useGraphQLQuery<ClienteBuscaData>(
    ['search-cliente', searchTerm],
    GET_CLIENTE_BY_CPF_OR_WHATSAPP,
    { cpf: searchTerm.replace(/\D/g, ""), whatsapp: searchTerm },
    { enabled: false } // Só executa quando chamamos refetch
  );

  // Query para buscar campanha ativa
  const hoje = new Date().toISOString().split('T')[0]; // formato YYYY-MM-DD
  const { data: campanhaAtivaData } = useGraphQLQuery<{
    campanha: Array<{
      id: string;
      Nome: string;
      data_inicio: string;
      data_fim: string;
    }>;
  }>(
    ['campanha-ativa', hoje],
    GET_CAMPANHA_ATIVA,
    { hoje }
  );

  // Query para buscar próximo sorteio
  const { data: proximoSorteioData } = useGraphQLQuery<{
    sorteios: Array<{
      id: string;
      data_sorteio: string;
      campanha_id: string;
    }>;
  }>(
    ['proximo-sorteio'],
    GET_PROXIMO_SORTEIO_AGENDADO
  );

  const campanhaAtiva = campanhaAtivaData?.campanha?.[0];
  const proximoSorteio = proximoSorteioData?.sorteios?.[0];

  // Query para buscar todas as padarias
  const { data: padariasData } = useGraphQLQuery<{
    padarias: Array<{
      id: string;
      nome: string;
      ticket_medio: number;
    }>;
  }>(
    ['padarias-list'],
    GET_PADARIAS
  );

  // Query para buscar ticket_medio da padaria selecionada
  const { data: ticketMedioData } = useGraphQLQuery<{
    padarias_by_pk: {
      id: string;
      nome: string;
      ticket_medio: number;
    };
  }>(
    ['padaria-ticket-medio', padariaIdSelecionada],
    GET_PADARIA_TICKET_MEDIO,
    { padaria_id: padariaIdSelecionada },
    { enabled: !!padariaIdSelecionada }
  );

  const ticketMedioPadaria = ticketMedioData?.padarias_by_pk?.ticket_medio || 50;

  // Query para buscar saldo do cliente na padaria selecionada a partir da tabela clientes_padarias_saldos
  const { data: saldoData, refetch: refetchSaldo } = useGraphQLQuery<{
    clientes_padarias_saldos: Array<{
      id: string;
      saldo_centavos: number | string;
      updated_at: string;
    }>;
  }>(
    ['cliente-saldo-padaria', String(clienteEncontrado?.id || ''), padariaIdSelecionada || ''],
    GET_CLIENTE_SALDO_POR_PADARIA,
    {
      cliente_id: String(clienteEncontrado?.id || ''),
      padaria_id: padariaIdSelecionada
    },
    { enabled: !!(clienteEncontrado?.id && padariaIdSelecionada) }
  );

  const saldoCentavosAtual = saldoData?.clientes_padarias_saldos?.[0]?.saldo_centavos;
  const saldoAcumulado = saldoCentavosAtual ? Number(saldoCentavosAtual) / 100 : 0;

  // Query para buscar cupons disponíveis (será habilitada quando necessário)
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
    { enabled: false } // Será habilitada dinamicamente
  );

  // Debug: log do saldo e força reload quando padaria muda
  useEffect(() => {
    if (clienteEncontrado?.id && padariaIdSelecionada) {
      console.log('🔍 Buscando saldo (Admin):', {
        cliente_id: clienteEncontrado.id,
        padaria_id: padariaIdSelecionada,
        saldoData,
        saldoAcumulado,
        saldoCentavosAtual,
        saldoRegistro: saldoData?.clientes_padarias_saldos?.[0]
      });
      // Força refetch do saldo quando padaria muda
      refetchSaldo();
    }
  }, [padariaIdSelecionada]);

  // Debug: log dos cupons disponíveis
  useEffect(() => {
    console.log('🎫 Cupons disponíveis:', {
      cuponsDisponiveisData,
      total: cuponsDisponiveisData?.cupons?.length || 0
    });
  }, [cuponsDisponiveisData]);

  // Mutation para zerar saldo de cupons anteriores
  const zerarSaldoAnteriorMutation = useGraphQLMutation(ZERAR_SALDO_CUPONS_ANTERIORES, {
    onError: (error: any) => {
      console.error("Erro ao zerar saldo anterior:", error);
    }
  });

  // Mutation para vincular cupom disponível ao cliente
  const vincularCupomMutation = useGraphQLMutation(VINCULAR_CUPOM_AO_CLIENTE, {
    onSuccess: () => {
      // Invalida cache após vincular cupom
      refetchCuponsDisponiveis();
    },
    onError: (error: any) => {
      console.error("Erro ao vincular cupom:", error);
    },
    invalidateQueries: [
      ['clientes-admin'],
      ['admin-metrics'],
      ['cliente-saldo-padaria'],
      ['saldos-cliente'],
      ['cupons-disponiveis']
    ]
  });

  // Mutation para atualizar cliente
  const updateClienteMutation = useUpdateCliente();

  // Hook para gerenciar saldos por padaria
  const upsertSaldoMutation = useUpsertSaldoClientePadaria();
  const insertSaldoMutation = useInsertSaldoClientePadaria();

  // Função para buscar cupons disponíveis quando necessário
  const buscarCuponsDisponiveis = async (quantidade: number) => {
    try {
      // Buscar mais cupons do que necessário para ter opções para randomizar
      const result = await refetchCuponsDisponiveis();
      const todosCupons = result.data?.cupons || [];
      
      if (todosCupons.length === 0) {
        return [];
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
        
        console.log('🎲 Cupons selecionados aleatoriamente:', {
          totalDisponiveis: todosCupons.length,
          necessarios: quantidade,
          selecionados: cuponsSelecionados.map(c => ({
            numero_sorte: c.numero_sorte,
            serie: c.serie,
            id: c.id
          }))
        });
        
        return cuponsSelecionados;
      }
      
      return todosCupons;
    } catch (error) {
      console.error("Erro ao buscar cupons disponíveis:", error);
      return [];
    }
  };

  // Função para obter timestamp no fuso horário de Brasília
  const getBrasiliaTimestamp = () => {
    const now = new Date();
    // Brasília está sempre UTC-3 (não há mais horário de verão)
    const brasiliaTime = new Date(now.getTime() - (3 * 60 * 60 * 1000));
    return brasiliaTime.toISOString();
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
    
    return padariaComMaisCupons;
  };

  const handleSearch = async () => {
    if (!searchTerm.trim()) return;

    try {
      const result = await refetchCliente();
      const clientes = (result.data as ClienteBuscaData | undefined)?.clientes ?? [];
      
      console.log('🔍 Resultado da busca:', { searchTerm, clientes });
      
      if (clientes.length > 0) {
        const cliente = clientes[0];
        setClienteEncontrado({
          ...cliente,
          saldoAcumulado: "0"
        });
        // Calcular padaria com mais cupons automaticamente
        const padariaComMaisCupons = calcularPadariaComMaisCupons(cliente);
        const padariaParaUsar = padariaComMaisCupons || cliente.padaria_id || "";
        
        setPadariaIdSelecionada(padariaParaUsar);
        
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

  const handleFecharNovoCliente = () => {
    setNovoClienteModalAberto(false);
    setIdentificadorNovoCliente({});
  };

  const handleClienteCriado = async (novoCliente?: Cliente) => {
    const identificadorAnterior = identificadorNovoCliente;
    handleFecharNovoCliente();

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

    if (novoCliente.padaria_id) {
      setPadariaIdSelecionada(novoCliente.padaria_id);
    }

    try {
      await new Promise((resolve) => setTimeout(resolve, 0));
      const resultadoBusca = await refetchCliente();
      const clientes = (resultadoBusca.data as ClienteBuscaData | undefined)?.clientes ?? [];
      const clienteAtualizado = clientes.find((cliente) => cliente.id === novoCliente.id);

      if (clienteAtualizado) {
        setClienteEncontrado({
          ...clienteAtualizado,
          id: clienteAtualizado.id ? String(clienteAtualizado.id) : clienteAtualizado.id,
          saldoAcumulado: "0"
        });

        if (clienteAtualizado.padaria_id) {
          setPadariaIdSelecionada(clienteAtualizado.padaria_id);
        }
      }
    } catch (error) {
      console.error("Erro ao atualizar cliente recém-criado (admin):", error);
    }
  };

  const calcularCupons = () => {
    const valorCompraAtual = parseFloat(valorCompra) || 0;
    const valorTotal = valorCompraAtual + saldoAcumulado;
    return Math.floor(valorTotal / ticketMedioPadaria);
  };

  const calcularNovoSaldo = () => {
    const valorCompraAtual = parseFloat(valorCompra) || 0;
    const valorTotal = valorCompraAtual + saldoAcumulado;
    const cuponsGerados = Math.floor(valorTotal / ticketMedioPadaria);
    const valorUtilizado = cuponsGerados * ticketMedioPadaria;
    return valorTotal - valorUtilizado;
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
    const cuponsAtuaisPadariaOriginal = cuponsPorPadaria.get(cliente.padaria_id) || 0;
    
    const totalCuponsNovaPadaria = cuponsAtuaisNovaPadaria + cuponsGerados;
    
    console.log("🔍 DEBUG - Cálculos de validação:", {
      cuponsAtivos: cuponsAtivos.length,
      cuponsPorPadaria: Object.fromEntries(cuponsPorPadaria),
      cuponsGerados,
      cuponsAtuaisNovaPadaria,
      cuponsAtuaisPadariaOriginal,
      totalCuponsNovaPadaria,
      deveAtualizar: totalCuponsNovaPadaria > cuponsAtuaisPadariaOriginal
    });
    
    // Validação: se a nova padaria terá mais cupons que a original, atualizar no banco
    if (totalCuponsNovaPadaria > cuponsAtuaisPadariaOriginal) {
      console.log("✅ DEBUG - Atualizando padaria no banco de dados");
      try {
        // Atualizar padaria do cliente no banco
        await updateClienteMutation.mutateAsync({
          id: cliente.id,
          padaria_id: padariaIdNovosCupons,
        });
        
        console.log("✅ DEBUG - Padaria atualizada com sucesso");
        toast({
          title: "Padaria atualizada!",
          description: "Padaria do cliente foi atualizada no banco de dados baseada na validação dos cupons",
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
    // VALIDAÇÕES IMEDIATAS (antes de buscar no banco)
    if (!clienteEncontrado || !clienteEncontrado.id || !valorCompra) {
      toast({
        title: "Erro",
        description: "Cliente e valor da compra são obrigatórios",
        variant: "destructive"
      });
      return;
    }

    // Usar padaria selecionada ou a do cliente
    const padariaId = padariaIdSelecionada || clienteEncontrado.padaria_id;
    if (!padariaId) {
      toast({
        title: "Erro",
        description: "Selecione uma padaria para o cupom",
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

    const cuponsGerados = calcularCupons();
    
    if (cuponsGerados === 0) {
      toast({
        title: "Erro", 
        description: `Valor insuficiente para gerar cupons. Valor mínimo: R$ ${ticketMedioPadaria.toFixed(2)}`,
        variant: "destructive"
      });
      return;
    }

    // AGORA SIM: Iniciar processamento e buscar no banco
    setIsLoading(true);
    setProcessingMessage("🔄 Iniciando processamento do cupom...");

    try {
      setProcessingMessage("🎫 Buscando cupons disponíveis...");
      
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

      const numerosSorte: string[] = [];
      const novoSaldo = calcularNovoSaldo();

      setProcessingMessage("🧹 Zerando saldos anteriores...");
      
      // PRIMEIRO: Zerar saldo de cupons anteriores desta padaria
      await zerarSaldoAnteriorMutation.mutateAsync({
        cliente_id: clienteEncontrado.id,
        padaria_id: padariaId
      });

      // Preparar data no fuso horário de Brasília
      const dataCompra = dataHora ? 
        new Date(dataHora).toISOString() : 
        getBrasiliaTimestamp();

      setProcessingMessage("🔗 Vinculando cupons ao cliente...");
      
      // Vincular cupons disponíveis ao cliente
      for (let i = 0; i < cuponsGerados; i++) {
        const cupomDisponivel = cuponsDisponiveis[i];
        numerosSorte.push(cupomDisponivel.numero_sorte);

        const ehUltimoCupom = i === cuponsGerados - 1;

        await vincularCupomMutation.mutateAsync({
          id: cupomDisponivel.id,
          cliente_id: clienteEncontrado.id,
          padaria_id: padariaId,
          valor_compra: String(ticketMedioPadaria.toFixed(2)), // Cada cupom = ticket_medio
          valor_desconto: ehUltimoCupom ? String(novoSaldo.toFixed(2)) : "0", // Último cupom guarda o novo saldo
          data_compra: dataCompra,
          status: "ativo", 
          campanha_id: campanhaAtiva?.id || null,
          sorteio_id: proximoSorteio?.id || null
        });
      }

      setProcessingMessage("💰 Calculando saldos...");
      
      // Calcular e salvar saldo por padaria (considerando saldo anterior)
      const saldoAnterior = saldoData?.clientes_padarias_saldos?.[0]?.saldo_centavos 
        ? Number(saldoData.clientes_padarias_saldos[0].saldo_centavos) / 100 
        : 0;
      const trocoCentavos = saldoUtils.calcularTroco(valor, ticketMedioPadaria, saldoAnterior);
      if (trocoCentavos > 0) {
        console.log('💰 Calculando saldo por padaria (Admin):', {
          valorCompra: valor,
          saldoAnterior: saldoAnterior,
          valorTotal: valor + saldoAnterior,
          ticketMedio: ticketMedioPadaria,
          trocoCentavos,
          clienteId: clienteEncontrado.id,
          padariaId: padariaId,
          saldoData: saldoData,
          saldoCentavosAtual: saldoData?.clientes_padarias_saldos?.[0]?.saldo_centavos
        });

        try {
          console.log('🔄 Tentando salvar saldo (Admin):', {
            cliente_id: clienteEncontrado.id,
            padaria_id: padariaId,
            saldo_centavos: trocoCentavos,
            valorCompra: valor,
            saldoAnterior: saldoAnterior,
            valorTotal: valor + saldoAnterior,
            ticketMedio: ticketMedioPadaria
          });
          
          // PRIMEIRO: Tenta atualizar registro existente
          const updateResult = await upsertSaldoMutation.mutateAsync({
            cliente_id: String(clienteEncontrado.id),
            padaria_id: padariaId,
            saldo_centavos: trocoCentavos
          });
          
          console.log('📊 Resultado do UPDATE (Admin):', {
            affected_rows: (updateResult as any)?.update_clientes_padarias_saldos?.affected_rows || 0,
            returning: (updateResult as any)?.update_clientes_padarias_saldos?.returning
          });
          
          // Se não afetou nenhuma linha, insere novo registro
          if (((updateResult as any)?.update_clientes_padarias_saldos?.affected_rows || 0) === 0) {
            console.log('🆕 Nenhum registro atualizado, criando novo (Admin)...');
            await insertSaldoMutation.mutateAsync({
              cliente_id: String(clienteEncontrado.id),
              padaria_id: padariaId,
              saldo_centavos: trocoCentavos
            });
            console.log('✅ Novo saldo por padaria criado (Admin):', trocoCentavos, 'centavos');
          } else {
            console.log('✅ Saldo por padaria atualizado (Admin):', trocoCentavos, 'centavos');
          }
          
          // Forçar refetch do saldo após salvar
          await refetchSaldo();
        } catch (saldoError) {
          console.error('❌ Erro ao salvar saldo por padaria (Admin):', saldoError);
          // Não falha o processo principal, apenas loga o erro
        }
      }

      setProcessingMessage("🏪 Validando padaria do cliente...");
      
      // VALIDAÇÃO E ATUALIZAÇÃO DA PADARIA NO BANCO
      await validarEAtualizarPadaria(clienteEncontrado, padariaId);

      toast({
        title: "Cupons usados no sorteio com sucesso!",
        description: `${cuponsGerados} cupons de R$ ${ticketMedioPadaria.toFixed(2)} cada • Números: ${numerosSorte.join(', ')}${novoSaldo > 0 ? ` • Saldo restante: R$ ${novoSaldo.toFixed(2)}` : ''}${trocoCentavos > 0 ? ` | Saldo Padaria: ${saldoUtils.formatarSaldo(trocoCentavos)}` : ''}`
      });

      // Fechar modal automaticamente
      onOpenChange(false);
      
      // Atualizar dados da página
      onCupomCadastrado();

    } catch (error) {
      console.error("Erro ao cadastrar cupons:", error);
      toast({
        title: "Erro",
        description: "Erro ao cadastrar cupons. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
      setProcessingMessage("");
    }
  };

  const cuponsGerados = calcularCupons();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Cadastrar Cupom</DialogTitle>
          <DialogDescription>
            Cadastre um novo cupom para a compra do cliente
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
                  <h4 className="font-medium text-foreground">{clienteEncontrado.nome}</h4>
                  <p className="text-sm text-muted-foreground">CPF: {maskCPF(clienteEncontrado.cpf)}</p>
                  <p className="text-sm text-muted-foreground">WhatsApp: {formatPhone(clienteEncontrado.whatsapp || '')}</p>
                  <p className="text-sm text-muted-foreground">
                 
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Saldos por Padaria */}
          {clienteEncontrado && (
            <SaldosPorPadaria 
              clienteId={String(clienteEncontrado.id)} 
              className="border-green-200 bg-green-50/50"
            />
          )}

          {/* Seleção de Padaria */}
          {clienteEncontrado && (
            <Card className="border-blue-200 bg-blue-50/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Store className="w-5 h-5" />
                  Padaria do Cupom
                  {(() => {
                    const padariaComMaisCupons = calcularPadariaComMaisCupons(clienteEncontrado);
                    const foiAlterada = padariaComMaisCupons && padariaComMaisCupons !== clienteEncontrado.padaria_id;
                    return foiAlterada && (
                      <Badge variant="secondary" className="text-xs">
                        Auto-vinculada
                      </Badge>
                    );
                  })()}
                </CardTitle>
                <CardDescription>
                  {(() => {
                    const padariaComMaisCupons = calcularPadariaComMaisCupons(clienteEncontrado);
                    const foiAlterada = padariaComMaisCupons && padariaComMaisCupons !== clienteEncontrado.padaria_id;
                    return foiAlterada 
                      ? "Padaria automaticamente vinculada baseada nos cupons ativos (pode ser alterada)"
                      : "Selecione a padaria para este cupom (afeta o cálculo do ticket médio)";
                  })()}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="padaria">Padaria</Label>
                  <Select value={padariaIdSelecionada} onValueChange={setPadariaIdSelecionada}>
                    <SelectTrigger id="padaria">
                      <SelectValue placeholder="Selecione a padaria" />
                    </SelectTrigger>
                    <SelectContent>
                      {(padariasData?.padarias || []).map((padaria: any) => (
                        <SelectItem key={padaria.id} value={padaria.id}>
                          {padaria.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Informação sobre Vinculação Automática */}
                {(() => {
                  const padariaComMaisCupons = calcularPadariaComMaisCupons(clienteEncontrado);
                  const foiAlterada = padariaComMaisCupons && padariaComMaisCupons !== clienteEncontrado.padaria_id;
                  
                  if (foiAlterada) {
                    const padaria = padariasData?.padarias?.find((p: any) => p.id === padariaComMaisCupons);
                    return (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          <h4 className="font-medium text-blue-900 text-sm">Vinculação Automática</h4>
                        </div>
                        <p className="text-xs text-blue-700">
                          Padaria <strong>{padaria?.nome || 'N/A'}</strong> foi automaticamente selecionada baseada na análise dos cupons ativos.
                        </p>
                      </div>
                    );
                  }
                  return null;
                })()}
                
                {padariaIdSelecionada && (
                  <div className="bg-white rounded-md p-3 border space-y-2">
                    <p className="text-sm">
                      <span className="font-medium">Ticket médio:</span>{' '}
                      <span className="text-primary font-semibold">
                        R$ {ticketMedioPadaria.toFixed(2)}
                      </span>
                    </p>
                    {saldoAcumulado > 0 && (
                      <p className="text-sm">
                        <span className="font-medium">Saldo acumulado:</span>{' '}
                        <span className="text-green-600 font-semibold">
                          R$ {saldoAcumulado.toFixed(2)}
                        </span>
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
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
                      {padariaIdSelecionada 
                        ? (padariasData?.padarias || []).find(p => p.id === padariaIdSelecionada)?.nome || 'N/A'
                        : 'Nenhuma'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Ticket Médio:</span>
                    <span className="font-medium">R$ {ticketMedioPadaria.toFixed(2)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Valor da Compra:</span>
                    <span className="font-medium">R$ {parseFloat(valorCompra || "0").toFixed(2)}</span>
                  </div>
                  {saldoAcumulado > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Saldo Acumulado:</span>
                      <span className="font-medium text-green-600">+ R$ {saldoAcumulado.toFixed(2)}</span>
                    </div>
                  )}
                  {(parseFloat(valorCompra || "0") + saldoAcumulado) > 0 && (
                    <div className="flex justify-between bg-primary/10 -mx-4 px-4 py-2">
                      <span className="font-medium">Valor Total:</span>
                      <span className="font-bold text-primary">
                        R$ {(parseFloat(valorCompra || "0") + saldoAcumulado).toFixed(2)}
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
                      {cuponsGerados} {cuponsGerados === 1 ? 'cupom' : 'cupons'} de R$ {ticketMedioPadaria.toFixed(2)} cada
                    </div>
                  )}
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                    <p className="text-sm text-blue-600">
                      ℹ️ Cupons disponíveis serão verificados ao confirmar.
                    </p>
                  </div>
                  {calcularNovoSaldo() > 0 && (
                    <div className="flex justify-between bg-green-50 -mx-4 px-4 py-2 rounded">
                      <span className="text-sm font-medium text-green-700">Novo Saldo (próxima compra):</span>
                      <span className="text-sm font-bold text-green-700">
                        R$ {calcularNovoSaldo().toFixed(2)}
                      </span>
                    </div>
                  )}
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
              disabled={
                !clienteEncontrado || 
                !valorCompra || 
                !padariaIdSelecionada || 
                isLoading
              }
            >
              {isLoading ? "Processando..." : "Confirmar Cupom"}
            </Button>
          </div>
        </div>
      </DialogContent>
      <AdminNovoClienteModal
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
