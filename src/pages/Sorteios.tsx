import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trophy, Download, Plus, Calendar } from "lucide-react";

const raffles = [
  {
    date: "15/01/2024",
    number: "07349",
    winner: "Maria Silva Santos",
    cpf: "***456",
    bakery: "Padaria Central"
  },
  {
    date: "08/01/2024", 
    number: "02841",
    winner: "João Pereira Lima",
    cpf: "***789",
    bakery: "Pão Dourado"
  },
  {
    date: "01/01/2024",
    number: "09673", 
    winner: "Ana Costa Oliveira",
    cpf: "***123",
    bakery: "Delícias do Forno"
  }
];

export default function Sorteios() {
  return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-primary">Sorteios Digitais</h1>
            <p className="text-muted-foreground">Gerencie e execute sorteios da campanha</p>
          </div>
          <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
            <Plus className="w-4 h-4 mr-2" />
            Realizar novo sorteio
          </Button>
        </div>

        {/* Next Raffle Card */}
        <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-secondary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-primary">
              <Trophy className="w-5 h-5" />
              Próximo Sorteio
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div>
                <p className="text-2xl font-bold text-primary">22/01/2024</p>
                <p className="text-sm text-muted-foreground">15:00h</p>
              </div>
              <div className="ml-auto">
                <Badge variant="outline" className="text-secondary border-secondary">
                  <Calendar className="w-3 h-3 mr-1" />
                  Agendado
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Filters */}
        <div className="flex gap-4 items-center">
          <Input 
            placeholder="Buscar por ganhador..." 
            className="max-w-sm"
          />
          <Select>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filtrar por padaria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as padarias</SelectItem>
              <SelectItem value="central">Padaria Central</SelectItem>
              <SelectItem value="dourado">Pão Dourado</SelectItem>
              <SelectItem value="delicias">Delícias do Forno</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Exportar PDF
          </Button>
        </div>

        {/* Raffles Table */}
        <Card>
          <CardHeader>
            <CardTitle>Histórico de Sorteios</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data do Sorteio</TableHead>
                  <TableHead>Número Sorteado</TableHead>
                  <TableHead>Ganhador</TableHead>
                  <TableHead>CPF</TableHead>
                  <TableHead>Padaria</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {raffles.map((raffle, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{raffle.date}</TableCell>
                    <TableCell>
                      <Badge className="bg-secondary text-secondary-foreground">
                        {raffle.number}
                      </Badge>
                    </TableCell>
                    <TableCell>{raffle.winner}</TableCell>
                    <TableCell>{raffle.cpf}</TableCell>
                    <TableCell>{raffle.bakery}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm">
                        Ver detalhes
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
  );
}