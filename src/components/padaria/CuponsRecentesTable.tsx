import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock } from "lucide-react";
import { maskCPF, formatCurrency } from "@/utils/formatters";

interface CupomRecente {
  numeroSorte: string;
  cliente: string;
  cpf: string;
  valor: number;
  serie: string;
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
          <div className="flex items-center justify-center py-6 sm:py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left p-2 sm:p-3 text-xs font-medium text-muted-foreground">Nº Sorte</th>
                  <th className="text-center p-2 sm:p-3 text-xs font-medium text-muted-foreground hidden sm:table-cell">Série</th>
                  <th className="text-left p-2 sm:p-3 text-xs font-medium text-muted-foreground">Cliente</th>
                  <th className="text-left p-2 sm:p-3 text-xs font-medium text-muted-foreground hidden md:table-cell">CPF</th>
                  <th className="text-center p-2 sm:p-3 text-xs font-medium text-muted-foreground hidden lg:table-cell">Valor</th>
                  <th className="text-center p-2 sm:p-3 text-xs font-medium text-muted-foreground hidden lg:table-cell">Data/Hora</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {cuponsRecentes.length > 0 ? (
                  cuponsRecentes.map((cupom, index) => (
                    <tr key={index} className="hover:bg-muted/30 transition-colors duration-200">
                      <td className="p-2 sm:p-3">
                        <span className="font-mono text-xs sm:text-sm md:text-base font-bold text-primary bg-primary/10 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded">
                          {cupom.numeroSorte}
                        </span>
                      </td>
                      <td className="p-2 sm:p-3 text-center hidden sm:table-cell">
                        <span className="font-mono text-xs sm:text-sm font-bold text-secondary bg-secondary/10 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded">
                          {cupom.serie}
                        </span>
                      </td>
                      <td className="p-2 sm:p-3 text-xs sm:text-sm">
                        <div className="font-medium truncate max-w-[100px] sm:max-w-[150px] md:max-w-none">{cupom.cliente}</div>
                        <div className="text-xs text-muted-foreground sm:hidden">{cupom.serie}</div>
                      </td>
                      <td className="p-2 sm:p-3 font-mono text-xs sm:text-sm text-muted-foreground hidden md:table-cell">{maskCPF(cupom.cpf)}</td>
                      <td className="p-2 sm:p-3 text-center text-xs sm:text-sm font-medium hidden lg:table-cell">
                        {formatCurrency(cupom.valor)}
                      </td>
                      <td className="p-2 sm:p-3 text-center text-muted-foreground text-xs hidden lg:table-cell">
                        {cupom.dataHora}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="p-6 sm:p-8 text-center text-xs sm:text-sm text-muted-foreground">
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
