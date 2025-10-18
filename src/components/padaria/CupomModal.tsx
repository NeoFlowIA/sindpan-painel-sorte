import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Search, User, Calculator, Receipt } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ClienteInlineForm } from "./ClienteInlineForm";
import { useAuth } from "@/contexts/AuthContext";
import { usePadariaTicketMedio, useClienteSaldoPorPadaria, useRegisterReceiptBasic } from "@/hooks/useCupons";
import { useUpdateCliente } from "@/hooks/useClientes";
import { useGraphQLQuery } from "@/hooks/useGraphQL";
import { GET_CLIENTE_BY_CPF_OR_WHATSAPP } from "@/graphql/queries";
import { formatCPF, formatPhone, maskCPF, unformatCNPJ } from "@/utils/formatters";

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
  
  // Usar saldo específico por padaria ao invés de saldo geral
  const { data: saldoDescontoData, refetch: refetchSaldoDesconto } = useClienteSaldoPorPadaria(
    clienteEncontrado?.id,
    user?.padarias_id
  );
  
  const registerReceiptBasic = useRegisterReceiptBasic();

  // Hook para atualizar cliente
  const updateClienteMutation = useUpdateCliente();
  
  // Query para buscar cliente
  const { data: clienteData, refetch: refetchCliente } = useGraphQLQuery(
    ['search-cliente', searchTerm],
    GET_CLIENTE_BY_CPF_OR_WHATSAPP,
    { cpf: searchTerm.replace(/\D/g, ""), whatsapp: searchTerm },
    { enabled: false } // Só executa quando chamamos refetch
  );

  const ticketMedio = ticketMedioData?.padarias_by_pk?.ticket_medio || 28.65;
  
  // Calcular saldo de desconto utilizando o registro mais recente da tabela clientes_padarias_saldos
  const saldoCentavos = saldoDescontoData?.clientes_padarias_saldos?.[0]?.saldo_centavos;
  const saldoDescontoAtual = saldoCentavos ? Number(saldoCentavos) / 100 : 0;

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
      const clientes = (result.data as any)?.clientes || [];
      
      if (clientes.length > 0) {
        const cliente = clientes[0];
        
        // Calcular padaria com mais cupons automaticamente
        const padariaComMaisCupons = calcularPadariaComMaisCupons(cliente);
        const clienteComPadariaAtualizada = {
          ...cliente,
          saldoAcumulado: "0", // Por enquanto, podemos calcular isso depois se necessário
          padaria_id: padariaComMaisCupons || cliente.padaria_id
        };
        
        setClienteEncontrado(clienteComPadariaAtualizada);
        setShowClienteForm(false);
        
        // Mostrar feedback se a vinculação foi alterada
        if (padariaComMaisCupons && padariaComMaisCupons !== cliente.padaria_id) {
          toast({
            title: "Cliente encontrado!",
            description: `Padaria automaticamente vinculada baseada nos cupons ativos`,
          });
        }
      } else {
        setClienteEncontrado(null);
        setShowClienteForm(true);
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

    try {
      const valorCentavos = Math.round(valor * 100);
      const dataCompra = dataHora
        ? new Date(dataHora).toISOString()
        : getBrasiliaTimestamp();

      const response = await registerReceiptBasic.mutateAsync({
        cliente: clienteEncontrado.id,
        padaria: padariaId,
        valor: valorCentavos,
        data: dataCompra,
        cnpj: unformatCNPJ(user?.cnpj || ""),
        conf: 1.0,
        raw: "raw",
        img: "img",
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
        title: "Cupom criado com sucesso!",
        description: `${cuponsEmitidos} ${cupomLabel} ${emitidoLabel}. Saldo atual: R$ ${saldoFormatado}`,
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
                    <span className="text-muted-foreground">Ticket Médio:</span>
                    <span className="font-medium">R$ {ticketMedio.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Valor da Compra:</span>
                    <span className="font-medium">R$ {parseFloat(valorCompra || "0").toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Saldo de Desconto Atual:</span>
                    <span className="font-medium">R$ {saldoDescontoAtual.toFixed(2)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between text-primary font-medium">
                    <span>Cupons gerados:</span>
                    <span>{cuponsGerados}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Novo Saldo de Desconto:</span>
                    <span className="font-medium">R$ {novoSaldoDesconto.toFixed(2)}</span>
                  </div>
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
              disabled={!clienteEncontrado || !valorCompra || registerReceiptBasic.isPending}
            >
              {registerReceiptBasic.isPending ? "Criando..." : "Criar Cupom"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}