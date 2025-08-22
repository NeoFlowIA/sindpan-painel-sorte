import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Users, Play, RotateCcw } from "lucide-react";
import { toast } from "sonner";

// Mock data - em produção viria do banco de dados
const mockClientes = [
  { id: 1, nome: "João Silva", telefone: "(11) 99999-1111", cupons: 5 },
  { id: 2, nome: "Maria Santos", telefone: "(11) 99999-2222", cupons: 3 },
  { id: 3, nome: "Pedro Oliveira", telefone: "(11) 99999-3333", cupons: 7 },
  { id: 4, nome: "Ana Costa", telefone: "(11) 99999-4444", cupons: 2 },
  { id: 5, nome: "Carlos Pereira", telefone: "(11) 99999-5555", cupons: 4 },
];

export function PadariaSorteio() {
  const [sorteando, setSorteando] = useState(false);
  const [vencedor, setVencedor] = useState<typeof mockClientes[0] | null>(null);
  const [historico, setHistorico] = useState<Array<{ cliente: string; data: string }>>([]);

  const realizarSorteio = async () => {
    if (mockClientes.length === 0) {
      toast.error("Não há clientes cadastrados para o sorteio!");
      return;
    }

    setSorteando(true);
    setVencedor(null);

    // Simula o sorteio com animação
    await new Promise(resolve => setTimeout(resolve, 2000));

    const clienteVencedor = mockClientes[Math.floor(Math.random() * mockClientes.length)];
    setVencedor(clienteVencedor);
    
    // Adiciona ao histórico
    setHistorico(prev => [{
      cliente: clienteVencedor.nome,
      data: new Date().toLocaleString()
    }, ...prev]);

    setSorteando(false);
    toast.success(`🎉 ${clienteVencedor.nome} foi o ganhador!`);
  };

  const resetarSorteio = () => {
    setVencedor(null);
    setSorteando(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Sorteio de Clientes</h1>
        <p className="text-muted-foreground">
          Realize sorteios entre os clientes cadastrados em sua padaria
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Painel de Sorteio */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="w-5 h-5" />
              Realizar Sorteio
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center space-y-4">
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Users className="w-4 h-4" />
                {mockClientes.length} clientes participando
              </div>

              {sorteando && (
                <div className="p-8">
                  <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary border-t-transparent mx-auto"></div>
                  <p className="mt-4 text-muted-foreground">Sorteando...</p>
                </div>
              )}

              {vencedor && !sorteando && (
                <div className="p-6 bg-primary/10 rounded-lg border-2 border-primary">
                  <Trophy className="w-12 h-12 text-primary mx-auto mb-3" />
                  <h3 className="text-xl font-bold text-primary">🎉 Ganhador!</h3>
                  <p className="text-lg font-semibold mt-2">{vencedor.nome}</p>
                  <p className="text-sm text-muted-foreground">{vencedor.telefone}</p>
                  <Badge variant="secondary" className="mt-2">
                    {vencedor.cupons} cupons
                  </Badge>
                </div>
              )}

              {!sorteando && !vencedor && (
                <div className="p-8 text-muted-foreground">
                  <Trophy className="w-16 h-16 mx-auto mb-4 opacity-30" />
                  <p>Clique no botão abaixo para iniciar o sorteio</p>
                </div>
              )}

              <div className="flex gap-2 justify-center">
                <Button
                  onClick={realizarSorteio}
                  disabled={sorteando || mockClientes.length === 0}
                  size="lg"
                  className="gap-2"
                >
                  <Play className="w-4 h-4" />
                  {sorteando ? "Sorteando..." : "Iniciar Sorteio"}
                </Button>
                
                {vencedor && (
                  <Button
                    onClick={resetarSorteio}
                    variant="outline"
                    size="lg"
                    className="gap-2"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Novo Sorteio
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lista de Participantes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Participantes ({mockClientes.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {mockClientes.map((cliente) => (
                <div
                  key={cliente.id}
                  className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                >
                  <div>
                    <p className="font-medium">{cliente.nome}</p>
                    <p className="text-sm text-muted-foreground">{cliente.telefone}</p>
                  </div>
                  <Badge variant="secondary">
                    {cliente.cupons} cupons
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Histórico de Sorteios */}
      {historico.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Histórico de Sorteios</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {historico.map((item, index) => (
                <div
                  key={index}
                  className="flex justify-between items-center p-3 bg-muted/30 rounded"
                >
                  <span className="font-medium">{item.cliente}</span>
                  <span className="text-sm text-muted-foreground">{item.data}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}