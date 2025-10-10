import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Search, User, Calculator, Receipt, Store } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useGraphQLQuery, useGraphQLMutation } from "@/hooks/useGraphQL";
import { GET_CLIENTE_BY_CPF_OR_WHATSAPP, CREATE_CUPOM, GET_CAMPANHA_ATIVA, GET_PROXIMO_SORTEIO_AGENDADO, GET_PADARIAS, GET_PADARIA_TICKET_MEDIO, GET_CLIENTE_SALDO_POR_PADARIA, ZERAR_SALDO_CUPONS_ANTERIORES } from "@/graphql/queries";
import { formatCPF, formatPhone, maskCPF } from "@/utils/formatters";
import { gerarNumeroSorte } from "@/hooks/useCupons";

interface AdminCupomModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCupomCadastrado: () => void;
}

interface Cliente {
  id?: number;
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

export function AdminCupomModal({ open, onOpenChange, onCupomCadastrado }: AdminCupomModalProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [clienteEncontrado, setClienteEncontrado] = useState<Cliente | null>(null);
  const [valorCompra, setValorCompra] = useState("");
  const [dataHora, setDataHora] = useState("");
  const [statusCupom, setStatusCupom] = useState<'ativo' | 'inativo'>('ativo');
  const [padariaIdSelecionada, setPadariaIdSelecionada] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Query para buscar cliente
  const { data: clienteData, refetch: refetchCliente } = useGraphQLQuery(
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

  // Query para buscar saldo de desconto do cliente na padaria selecionada
  const { data: saldoData, refetch: refetchSaldo } = useGraphQLQuery<{
    cupons: Array<{
      id: string;
      valor_desconto: string;
    }>;
  }>(
    ['cliente-saldo-padaria', String(clienteEncontrado?.id || ''), padariaIdSelecionada],
    GET_CLIENTE_SALDO_POR_PADARIA,
    { 
      cliente_id: clienteEncontrado?.id || '',
      padaria_id: padariaIdSelecionada 
    },
    { enabled: !!(clienteEncontrado?.id && padariaIdSelecionada) }
  );

  const saldoAcumulado = saldoData?.cupons?.[0]?.valor_desconto 
    ? parseFloat(saldoData.cupons[0].valor_desconto) 
    : 0;

  // Debug: log do saldo e força reload quando padaria muda
  useEffect(() => {
    if (clienteEncontrado?.id && padariaIdSelecionada) {
      console.log('🔍 Buscando saldo:', {
        cliente_id: clienteEncontrado.id,
        padaria_id: padariaIdSelecionada,
        saldoData,
        saldoAcumulado
      });
      // Força refetch do saldo quando padaria muda
      refetchSaldo();
    }
  }, [padariaIdSelecionada]);

  // Mutation para zerar saldo de cupons anteriores
  const zerarSaldoAnteriorMutation = useGraphQLMutation(ZERAR_SALDO_CUPONS_ANTERIORES, {
    onError: (error: any) => {
      console.error("Erro ao zerar saldo anterior:", error);
    }
  });

  // Mutation para criar cupom
  const createCupomMutation = useGraphQLMutation(CREATE_CUPOM, {
    onSuccess: () => {
      toast({
        title: "Cupom cadastrado com sucesso!",
        description: "O cupom foi criado e vinculado ao cliente"
      });
      
      // Reset form
      setSearchTerm("");
      setClienteEncontrado(null);
      setValorCompra("");
      setStatusCupom('ativo');
      setPadariaIdSelecionada("");
      
      onCupomCadastrado();
    },
    onError: (error: any) => {
      console.error("Erro ao cadastrar cupom:", error);
      toast({
        title: "Erro",
        description: "Erro ao cadastrar cupom. Tente novamente.",
        variant: "destructive"
      });
    },
    invalidateQueries: [
      ['clientes-admin'],
      ['admin-metrics'],
      ['cliente-saldo-padaria'] // ✅ Invalida cache do saldo
    ]
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
        // Definir a padaria do cliente como padrão
        setPadariaIdSelecionada(cliente.padaria_id || "");
        toast({
          title: "Cliente encontrado!",
          description: `${cliente.nome} foi encontrado com sucesso`
        });
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

  const handleSubmit = async () => {
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

    setIsLoading(true);

    try {
      const numerosSorte: string[] = [];
      const novoSaldo = calcularNovoSaldo();

      // PRIMEIRO: Zerar saldo de cupons anteriores desta padaria
      await zerarSaldoAnteriorMutation.mutateAsync({
        cliente_id: clienteEncontrado.id,
        padaria_id: padariaId
      });

      // Preparar data no fuso horário de Brasília
      const dataCompra = dataHora ? 
        new Date(dataHora).toISOString() : 
        getBrasiliaTimestamp();

      // Criar múltiplos cupons, cada um com valor do ticket_medio
      for (let i = 0; i < cuponsGerados; i++) {
        const numeroSorte = gerarNumeroSorte();
        numerosSorte.push(numeroSorte);

        const ehUltimoCupom = i === cuponsGerados - 1;

        await createCupomMutation.mutateAsync({
          cupom: {
            numero_sorte: numeroSorte,
            valor_compra: String(ticketMedioPadaria.toFixed(2)), // Cada cupom = ticket_medio
            data_compra: dataCompra,
            status: statusCupom,
            cliente_id: clienteEncontrado.id,
            padaria_id: padariaId,
            valor_desconto: ehUltimoCupom ? String(novoSaldo.toFixed(2)) : "0", // Último cupom guarda o novo saldo
            campanha_id: campanhaAtiva?.id || null,
            sorteio_id: proximoSorteio?.id || null
          }
        });
      }

      toast({
        title: "Cupons cadastrados com sucesso!",
        description: `${cuponsGerados} cupons de R$ ${ticketMedioPadaria.toFixed(2)} cada${novoSaldo > 0 ? ` • Saldo restante: R$ ${novoSaldo.toFixed(2)}` : ''}`
      });

    } catch (error) {
      console.error("Erro ao cadastrar cupons:", error);
      toast({
        title: "Erro",
        description: "Erro ao cadastrar cupons. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
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
                    Padaria Original: {clienteEncontrado.padaria?.nome || 'N/A'}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Seleção de Padaria */}
          {clienteEncontrado && (
            <Card className="border-blue-200 bg-blue-50/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Store className="w-5 h-5" />
                  Padaria do Cupom
                </CardTitle>
                <CardDescription>
                  Selecione a padaria para este cupom (afeta o cálculo do ticket médio)
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
                  {cuponsGerados > 0 && (
                    <div className="bg-blue-50 -mx-4 px-4 py-2 rounded text-xs text-blue-700">
                      {cuponsGerados} {cuponsGerados === 1 ? 'cupom' : 'cupons'} de R$ {ticketMedioPadaria.toFixed(2)} cada
                    </div>
                  )}
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

          {/* Actions */}
          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={!clienteEncontrado || !valorCompra || !padariaIdSelecionada || isLoading}
            >
              {isLoading ? "Cadastrando..." : "Confirmar Cupom"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
