import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Search, User, Calculator, Receipt } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useGraphQLQuery, useGraphQLMutation } from "@/hooks/useGraphQL";
import { GET_CLIENTE_BY_CPF_OR_WHATSAPP, CREATE_CUPOM } from "@/graphql/queries";
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
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Query para buscar cliente
  const { data: clienteData, refetch: refetchCliente } = useGraphQLQuery(
    ['search-cliente', searchTerm],
    GET_CLIENTE_BY_CPF_OR_WHATSAPP,
    { cpf: searchTerm.replace(/\D/g, ""), whatsapp: searchTerm },
    { enabled: false } // Só executa quando chamamos refetch
  );

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
      ['admin-metrics']
    ]
  });

  const ticketMedio = 50; // Valor fixo para simplificar

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
    const valor = parseFloat(valorCompra) || 0;
    return Math.floor(valor / ticketMedio);
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

    const padariaId = clienteEncontrado.padaria_id;
    if (!padariaId) {
      toast({
        title: "Erro",
        description: "Não foi possível determinar a padaria do cliente",
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
      const numerosSorte: string[] = [];
      const cuponsPromises: Promise<any>[] = [];

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
            padaria_id: padariaId,
            valor_desconto: "0"
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
                    Padaria: {clienteEncontrado.padaria?.nome || 'N/A'}
                  </p>
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
                  <Separator />
                  <div className="flex justify-between text-primary font-medium">
                    <span>Cupons Gerados:</span>
                    <span>{cuponsGerados}</span>
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
