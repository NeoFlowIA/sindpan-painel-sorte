import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Search, User, Calculator, Receipt } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ClienteInlineForm, type Cliente } from "./ClienteInlineForm";
import { useAuth } from "@/contexts/AuthContext";
import { useGraphQLQuery } from "@/hooks/useGraphQL";
import { graphqlClient } from "@/lib/graphql-client";
import { GET_PADARIA_TICKET_MEDIO, GET_CLIENTE, CADASTRAR_CUPOM } from "@/graphql/queries";

interface CupomModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCupomCadastrado: () => void;
}


export function CupomModal({ open, onOpenChange, onCupomCadastrado }: CupomModalProps) {
  const { user } = useAuth();
  const padariaId = user?.id;
  const [searchTerm, setSearchTerm] = useState("");
  const [clienteEncontrado, setClienteEncontrado] = useState<Cliente | null>(null);
  const [showClienteForm, setShowClienteForm] = useState(false);
  const [valorCompra, setValorCompra] = useState("");
  const [dataHora, setDataHora] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const { data: padariaData } = useGraphQLQuery<{
    padarias_by_pk: { ticket_medio: number | string } | null;
  }>(
    ["padaria-ticket", padariaId],
    GET_PADARIA_TICKET_MEDIO,
    { id: padariaId },
    { enabled: !!padariaId && open }
  );

  const ticketMedio = padariaData?.padarias_by_pk?.ticket_medio
    ? parseFloat(padariaData.padarias_by_pk.ticket_medio as string)
    : 0;

  useEffect(() => {
    if (open) {
      // Set current date/time
      const now = new Date();
      const formatted = now.toISOString().slice(0, 16);
      setDataHora(formatted);
    }
  }, [open]);

  const formatCPF = (value: string) => {
    const digits = value.replace(/\D/g, "");
    return digits
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})/, "$1-$2");
  };

  const formatWhatsApp = (value: string) => {
    const digits = value.replace(/\D/g, "");
    let formatted = "(+55) ";
    
    if (digits.length >= 2) {
      formatted += `(${digits.slice(0, 2)}) `;
    }
    
    if (digits.length >= 7) {
      const localNumber = digits.slice(2);
      if (localNumber.length === 9) {
        formatted += `${localNumber.slice(0, 5)}-${localNumber.slice(5)}`;
      } else if (localNumber.length === 8) {
        formatted += `${localNumber.slice(0, 4)}-${localNumber.slice(4)}`;
      } else {
        formatted += localNumber;
      }
    } else if (digits.length > 2) {
      formatted += digits.slice(2);
    }
    
    return formatted;
  };

  const handleSearch = async () => {
    if (!searchTerm.trim() || !padariaId) return;

    try {
      const digits = searchTerm.replace(/\D/g, "");
      const variables = {
        padariaId,
        cpf: digits.length === 11 ? digits : null,
        whatsapp: digits.length >= 10 ? digits : null,
      };

      const data = await graphqlClient.query<{
        clientes: Array<{
          id: string;
          nome: string;
          cpf: string;
          whatsapp: string;
          clientes_padarias_saldos: Array<{ saldo_centavos: number }>;
        }>;
      }>(GET_CLIENTE, variables);

      if (data.clientes.length > 0) {
        const c = data.clientes[0];
        const saldo = c.clientes_padarias_saldos[0]?.saldo_centavos || 0;
        setClienteEncontrado({
          id: c.id,
          nome: c.nome,
          cpf: formatCPF(c.cpf),
          whatsapp: formatWhatsApp(c.whatsapp),
          saldoAcumulado: Number(saldo) / 100,
        });
        setShowClienteForm(false);
      } else {
        setClienteEncontrado(null);
        setShowClienteForm(true);
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao buscar cliente",
        variant: "destructive",
      });
    }
  };

  const handleClienteCriado = (cliente: Cliente) => {
    setClienteEncontrado(cliente);
    setShowClienteForm(false);
  };

  const calcularCupons = () => {
    const valor = parseFloat(valorCompra) || 0;
    const saldoAtual = clienteEncontrado?.saldoAcumulado || 0;
    const valorTotal = valor + saldoAtual;
    return ticketMedio > 0 ? Math.floor(valorTotal / ticketMedio) : 0;
  };

  const calcularNovoSaldo = () => {
    const valor = parseFloat(valorCompra) || 0;
    const saldoAtual = clienteEncontrado?.saldoAcumulado || 0;
    const valorTotal = valor + saldoAtual;
    const cuponsGerados = ticketMedio > 0 ? Math.floor(valorTotal / ticketMedio) : 0;
    return valorTotal - cuponsGerados * ticketMedio;
  };

  const gerarNumerosSorte = (quantidade: number): string[] => {
    const numeros: string[] = [];
    for (let i = 0; i < quantidade; i++) {
      // Generate unique 5-digit numbers
      const numero = Math.floor(10000 + Math.random() * 90000).toString();
      numeros.push(numero);
    }
    return numeros;
  };

  const handleSubmit = async () => {
    if (!clienteEncontrado || !valorCompra || !padariaId) {
      toast({
        title: "Erro",
        description: "Cliente e valor da compra são obrigatórios",
        variant: "destructive",
      });
      return;
    }

    const cuponsGerados = calcularCupons();

    if (cuponsGerados === 0) {
      toast({
        title: "Erro",
        description: "Valor insuficiente para gerar cupons",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const numerosSorte = gerarNumerosSorte(cuponsGerados);
      await graphqlClient.mutate(CADASTRAR_CUPOM, {
        compra: {
          cliente_id: clienteEncontrado.id,
          padaria_id: padariaId,
          valor_centavos: Math.round(parseFloat(valorCompra) * 100),
          data_compra: new Date(dataHora).toISOString(),
        },
        cupons: numerosSorte.map(numero => ({
          numero_sorte: numero,
          cliente_id: clienteEncontrado.id,
          padaria_id: padariaId,
          valor_compra: valorCompra.toString(),
          data_compra: new Date(dataHora).toISOString(),
        })),
        saldo: {
          cliente_id: clienteEncontrado.id,
          padaria_id: padariaId,
          saldo_centavos: Math.round(calcularNovoSaldo() * 100),
        },
      });

      toast({
        title: "Cupom cadastrado com sucesso",
        description: `${cuponsGerados} números gerados: ${numerosSorte.join(", ")}`,
      });

      setSearchTerm("");
      setClienteEncontrado(null);
      setShowClienteForm(false);
      setValorCompra("");

      onCupomCadastrado();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao cadastrar cupom",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };



  const cuponsGerados = calcularCupons();
  const novoSaldo = calcularNovoSaldo();

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
                  <p className="text-sm text-muted-foreground">CPF: {clienteEncontrado.cpf}</p>
                  <p className="text-sm text-muted-foreground">WhatsApp: {clienteEncontrado.whatsapp}</p>
                  <p className="text-sm text-muted-foreground">
                    Saldo acumulado: R$ {clienteEncontrado.saldoAcumulado.toFixed(2)}
                  </p>
                </div>
              )}

              {/* Formulário inline para novo cliente */}
              {showClienteForm && (
                <div className="mt-4">
                  <ClienteInlineForm
                    onClienteCriado={handleClienteCriado}
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
                    <span className="text-muted-foreground">Saldo Anterior:</span>
                    <span className="font-medium">R$ {clienteEncontrado.saldoAcumulado.toFixed(2)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between text-primary font-medium">
                    <span>Cupons Gerados:</span>
                    <span>{cuponsGerados}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Novo Saldo:</span>
                    <span className="font-medium">R$ {novoSaldo.toFixed(2)}</span>
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