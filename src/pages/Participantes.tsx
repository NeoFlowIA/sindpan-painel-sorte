import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Users, Download, Search } from "lucide-react";

const participants = [
  {
    name: "Maria Silva Santos",
    cpf: "***456",
    bakery: "Padaria Central",
    coupons: 12,
    lastSubmission: "15/01/2024"
  },
  {
    name: "João Pereira Lima", 
    cpf: "***789",
    bakery: "Pão Dourado",
    coupons: 8,
    lastSubmission: "14/01/2024"
  },
  {
    name: "Ana Costa Oliveira",
    cpf: "***123", 
    bakery: "Delícias do Forno",
    coupons: 15,
    lastSubmission: "13/01/2024"
  },
  {
    name: "Carlos Eduardo Santos",
    cpf: "***234",
    bakery: "Padaria Central", 
    coupons: 6,
    lastSubmission: "12/01/2024"
  },
  {
    name: "Fernanda Oliveira Silva",
    cpf: "***567",
    bakery: "Pão Dourado",
    coupons: 9,
    lastSubmission: "11/01/2024"
  }
];

export default function Participantes() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-primary">Participantes</h1>
            <p className="text-muted-foreground">Gerencie todos os participantes da campanha</p>
          </div>
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Exportar lista (.CSV)
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Participantes</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">247</div>
              <p className="text-xs text-muted-foreground">+12 desde ontem</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Cupons Validados</CardTitle>
              <Badge className="bg-secondary text-secondary-foreground">Total</Badge>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-secondary">1,834</div>
              <p className="text-xs text-muted-foreground">+89 hoje</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Média por Participante</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-accent">7.4</div>
              <p className="text-xs text-muted-foreground">cupons por pessoa</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex gap-4 items-center">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Buscar por nome ou CPF..." 
              className="pl-10"
            />
          </div>
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
        </div>

        {/* Participants Table */}
        <Card>
          <CardHeader>
            <CardTitle>Lista de Participantes</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome Completo</TableHead>
                  <TableHead>CPF</TableHead>
                  <TableHead>Padaria Vinculada</TableHead>
                  <TableHead>Cupons Enviados</TableHead>
                  <TableHead>Última Submissão</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {participants.map((participant, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{participant.name}</TableCell>
                    <TableCell>{participant.cpf}</TableCell>
                    <TableCell>{participant.bakery}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-secondary border-secondary">
                        {participant.coupons}
                      </Badge>
                    </TableCell>
                    <TableCell>{participant.lastSubmission}</TableCell>
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
    </DashboardLayout>
  );
}