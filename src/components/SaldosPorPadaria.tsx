import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Wallet, Store, Coins } from "lucide-react";
import { useSaldosCliente, saldoUtils } from "@/hooks/useSaldosPadarias";

interface SaldosPorPadariaProps {
  clienteId: string | null;
  className?: string;
}

export function SaldosPorPadaria({ clienteId, className }: SaldosPorPadariaProps) {
  const { data: saldosData, isLoading, error } = useSaldosCliente(clienteId);

  if (!clienteId) {
    return null;
  }

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Saldos por Padaria
          </CardTitle>
          <CardDescription>
            Carregando saldos acumulativos...
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">Carregando...</div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Saldos por Padaria
          </CardTitle>
          <CardDescription>
            Erro ao carregar saldos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-red-600">Erro ao carregar saldos</div>
        </CardContent>
      </Card>
    );
  }

  // Debug: verificar dados recebidos
  console.log('🔍 SaldosPorPadaria Debug:', {
    clienteId,
    saldosData,
    isArray: Array.isArray(saldosData),
    type: typeof saldosData,
    length: Array.isArray(saldosData) ? saldosData.length : 'N/A'
  });

  const saldos = Array.isArray(saldosData) ? saldosData : [];
  const saldosComValor = saldos.filter(saldo => saldo.saldo_centavos > 0);

  if (saldosComValor.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Saldos por Padaria
          </CardTitle>
          <CardDescription>
            Saldos acumulativos por padaria
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">
            Nenhum saldo acumulado encontrado
          </div>
        </CardContent>
      </Card>
    );
  }

  const totalSaldos = saldosComValor.reduce((total, saldo) => total + saldo.saldo_centavos, 0);

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wallet className="h-5 w-5" />
          Saldos por Padaria
        </CardTitle>
        <CardDescription>
          Saldos acumulativos por padaria
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Total Geral */}
        <div className="flex items-center justify-between p-3 bg-primary/5 rounded-lg">
          <div className="flex items-center gap-2">
            <Coins className="h-4 w-4 text-primary" />
            <span className="font-medium">Total Geral</span>
          </div>
          <Badge variant="secondary" className="text-lg font-bold">
            {saldoUtils.formatarSaldo(totalSaldos)}
          </Badge>
        </div>

        <Separator />

        {/* Lista de Saldos por Padaria */}
        <div className="space-y-3">
          {saldosComValor.map((saldo) => (
            <div key={saldo.id} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                <Store className="h-4 w-4 text-muted-foreground" />
                <div>
                  <div className="font-medium text-sm">
                    {saldo.padarias_saldos?.nome || `Padaria ID: ${saldo.padaria_id.slice(0, 8)}...`}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Saldo: {saldoUtils.formatarSaldo(saldo.saldo_centavos)}
                  </div>
                </div>
              </div>
              <Badge variant="outline" className="font-medium">
                {saldoUtils.formatarSaldo(saldo.saldo_centavos)}
              </Badge>
            </div>
          ))}
        </div>

        {/* Informações Adicionais */}
        <div className="text-xs text-muted-foreground space-y-1">
          <div>• Saldos são acumulativos por padaria</div>
          <div>• Gerados automaticamente quando há troco</div>
          <div>• Podem ser usados em futuras compras</div>
        </div>
      </CardContent>
    </Card>
  );
}
