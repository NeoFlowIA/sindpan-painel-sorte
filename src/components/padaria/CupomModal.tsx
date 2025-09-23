import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Search, User, Calculator, Receipt } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ClienteInlineForm } from "./ClienteInlineForm";
import { useAuth } from "@/contexts/AuthContext";
import { useCreateCupom, usePadariaTicketMedio, useClienteSaldoDesconto, useResetClienteDesconto, gerarNumeroSorte } from "@/hooks/useCupons";
import { useGraphQLQuery } from "@/hooks/useGraphQL";
import { GET_CLIENTE_BY_CPF_OR_WHATSAPP } from "@/graphql/queries";
import { formatCPF, formatPhone, maskCPF } from "@/utils/formatters";

interface CupomModalProps {
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
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  // Hooks para GraphQL
  const createCupomMutation = useCreateCupom();
  const { data: ticketMedioData } = usePadariaTicketMedio(user?.padarias_id || "");
  const { data: saldoDescontoData, refetch: refetchSaldoDesconto } = useClienteSaldoDesconto(clienteEncontrado?.id);
  // const resetClienteDescontoMutation = useResetClienteDesconto(); // Desabilitado temporariamente
  
  // Query para buscar cliente
  const { data: clienteData, refetch: refetchCliente } = useGraphQLQuery(
    ['search-cliente', searchTerm],
    GET_CLIENTE_BY_CPF_OR_WHATSAPP,
    { cpf: searchTerm.replace(/\D/g, ""), whatsapp: searchTerm },
    { enabled: false } // Só executa quando chamamos refetch
  );

  const ticketMedio = ticketMedioData?.padarias_by_pk?.ticket_medio || 28.65;
  
  // Calcular saldo de desconto manualmente somando todos os valores
  const saldoDescontoAtual = saldoDescontoData?.cupons?.reduce((total, cupom) => {
    return total + parseFloat(cupom.valor_desconto || "0");
  }, 0) || 0;

  // Debug: Log dos dados para verificar se estão atualizados
  console.log('🔍 Debug Saldo Desconto:', {
    clienteId: clienteEncontrado?.id,
    saldoDescontoData,
    saldoDescontoAtual,
    cupons: saldoDescontoData?.cupons?.map(c => ({ valor_desconto: c.valor_desconto }))
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
      
      if (clientes.length > 0) {
        const cliente = clientes[0];
        setClienteEncontrado({
          ...cliente,
          saldoAcumulado: "0" // Por enquanto, podemos calcular isso depois se necessário
        });
        setShowClienteForm(false);
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

  const handleSubmit = async () => {
    if (!clienteEncontrado || !clienteEncontrado.id || !valorCompra || !user?.padarias_id) {
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

    setIsLoading(true);

     try {
       // Reset de desconto desabilitado temporariamente
       // TODO: Implementar reset de desconto quando possível
       console.log('Reset de desconto desabilitado temporariamente');

       const numerosSorte: string[] = [];
       const cuponsPromises: Promise<any>[] = [];
       const novoSaldoDesconto = calcularNovoSaldoDesconto();

      // Criar múltiplos cupons se necessário
      for (let i = 0; i < cuponsGerados; i++) {
        const numeroSorte = gerarNumeroSorte();
        numerosSorte.push(numeroSorte);

        // Preparar data no fuso horário de Brasília
        const dataCompra = dataHora ? 
          new Date(dataHora).toISOString() : 
          getBrasiliaTimestamp();

        const cupomPromise = createCupomMutation.mutateAsync({
          cupom: {
            numero_sorte: numeroSorte,
            valor_compra: String(i === 0 ? valor : 0), // Só o primeiro cupom tem o valor da compra
            data_compra: dataCompra,
            status: statusCupom,
            cliente_id: clienteEncontrado.id,
            padaria_id: user?.padarias_id, // Adicionar padaria_id obrigatório
            valor_desconto: String(i === cuponsGerados - 1 ? novoSaldoDesconto : 0), // Só o último cupom tem o saldo restante
          }
        });

        cuponsPromises.push(cupomPromise);
      }

      // Executar todas as mutations em paralelo
      await Promise.all(cuponsPromises);

      toast({
        title: "Cupons cadastrados com sucesso!",
        description: `${cuponsGerados} cupons gerados: ${numerosSorte.join(", ")}`
      });

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
    }
  };

  const cuponsGerados = calcularCupons();
  const novoSaldoDesconto = calcularNovoSaldoDesconto();

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
                     Saldo de desconto: R$ {saldoDescontoAtual.toFixed(2)}
                   </p>
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
                    <span>Cupons Gerados:</span>
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
              disabled={!clienteEncontrado || !valorCompra || isLoading}
            >
              {isLoading ? "Cadastrando..." : "Confirmar Cupom"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}