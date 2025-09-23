import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock } from "lucide-react";
import { maskCPF } from "@/utils/formatters";

interface CupomRecente {
  numeroSorte: string;
  cliente: string;
  cpf: string;
  valor: number;
  dataHora: string;
}

interface CuponsRecentesTableProps {
  cuponsRecentes: CupomRecente[];
  isLoading?: boolean;
}

export function CuponsRecentesTable({ cuponsRecentes, isLoading }: CuponsRecentesTableProps) {
  return (
    <Card className="transition-all duration-200 hover:shadow-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-foreground">
          <Clock className="w-5 h-5" />
          Cupons Recentes
        </CardTitle>
        <CardDescription>Últimos cupons emitidos pela padaria</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-3 font-medium text-muted-foreground">Número da Sorte</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Cliente</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">CPF</th>
                  <th className="text-center p-3 font-medium text-muted-foreground">Valor</th>
                  <th className="text-center p-3 font-medium text-muted-foreground">Data/Hora</th>
                </tr>
              </thead>
              <tbody>
                {cuponsRecentes.length > 0 ? (
                  cuponsRecentes.map((cupom, index) => (
                    <tr key={index} className="border-b border-border/50 hover:bg-muted/50 transition-colors duration-200">
                      <td className="p-3">
                        <span className="font-mono text-lg font-bold text-primary bg-primary/10 px-2 py-1 rounded">
                          {cupom.numeroSorte}
                        </span>
                      </td>
                      <td className="p-3 font-medium">{cupom.cliente}</td>
                      <td className="p-3 font-mono text-sm text-muted-foreground">{maskCPF(cupom.cpf)}</td>
                      <td className="p-3 text-center font-medium">
                        R$ {cupom.valor.toFixed(2)}
                      </td>
                      <td className="p-3 text-center text-muted-foreground text-sm">
                        {cupom.dataHora}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-muted-foreground">
                      Nenhum cupom cadastrado ainda
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}