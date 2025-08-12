import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock } from "lucide-react";

// Mock data
const mockCuponsRecentes = [
  {
    id: 1,
    numero: "10452",
    cpf: "123.456.789-**",
    valorCompra: 40.00,
    dataHora: "07/08/2025 15:30",
    cliente: "Ana S."
  },
  {
    id: 2,
    numero: "10453",
    cpf: "987.654.321-**",
    valorCompra: 32.50,
    dataHora: "07/08/2025 14:15",
    cliente: "Carlos S."
  },
  {
    id: 3,
    numero: "10454",
    cpf: "456.789.123-**",
    valorCompra: 55.80,
    dataHora: "07/08/2025 13:45",
    cliente: "Maria S."
  },
  {
    id: 4,
    numero: "10455",
    cpf: "789.123.456-**",
    valorCompra: 28.65,
    dataHora: "07/08/2025 12:20",
    cliente: "João S."
  },
  {
    id: 5,
    numero: "10456",
    cpf: "321.654.987-**",
    valorCompra: 45.30,
    dataHora: "07/08/2025 11:10",
    cliente: "Paula C."
  }
];

export function CuponsRecentesTable() {
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
              {mockCuponsRecentes.map((cupom) => (
                <tr key={cupom.id} className="border-b border-border/50 hover:bg-muted/50 transition-colors duration-200">
                  <td className="p-3">
                    <span className="font-mono text-lg font-bold text-primary bg-primary/10 px-2 py-1 rounded">
                      {cupom.numero}
                    </span>
                  </td>
                  <td className="p-3 font-medium">{cupom.cliente}</td>
                  <td className="p-3 font-mono text-sm text-muted-foreground">{cupom.cpf}</td>
                  <td className="p-3 text-center font-medium">
                    R$ {cupom.valorCompra.toFixed(2)}
                  </td>
                  <td className="p-3 text-center text-muted-foreground text-sm">
                    {cupom.dataHora}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {mockCuponsRecentes.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum cupom cadastrado ainda
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}