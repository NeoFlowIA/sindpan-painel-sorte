import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Store, Plus, Edit, QrCode, Trash2, Search } from "lucide-react";

const bakeries = [
  {
    name: "Padaria Central",
    cnpj: "12.345.678/0001-90",
    address: "Rua Principal, 123, Centro",
    averageTicket: "R$ 25,50",
    status: "ativa",
    payment: "pago"
  },
  {
    name: "Pão Dourado",
    cnpj: "98.765.432/0001-10", 
    address: "Av. Santos Dumont, 456, Aldeota",
    averageTicket: "R$ 32,80",
    status: "ativa",
    payment: "pago"
  },
  {
    name: "Delícias do Forno",
    cnpj: "11.222.333/0001-44",
    address: "Rua das Flores, 789, Meireles", 
    averageTicket: "R$ 18,90",
    status: "pendente",
    payment: "em aberto"
  },
  {
    name: "Pães & Sabores",
    cnpj: "55.666.777/0001-88",
    address: "Rua Barão do Rio Branco, 321, Centro",
    averageTicket: "R$ 28,70",
    status: "ativa", 
    payment: "pago"
  }
];

export default function Padarias() {
  return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-primary">Padarias Participantes</h1>
            <p className="text-muted-foreground">Gerencie as padarias cadastradas na campanha</p>
          </div>
          <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
            <Plus className="w-4 h-4 mr-2" />
            Adicionar padaria
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Padarias</CardTitle>
              <Store className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">23</div>
              <p className="text-xs text-muted-foreground">+2 este mês</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ativas</CardTitle>
              <Badge className="bg-green-100 text-green-800">Status</Badge>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">20</div>
              <p className="text-xs text-muted-foreground">87% do total</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
              <Badge variant="outline" className="text-yellow-600 border-yellow-600">Status</Badge>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">3</div>
              <p className="text-xs text-muted-foreground">Aguardando aprovação</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ticket Médio</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-secondary">R$ 26,40</div>
              <p className="text-xs text-muted-foreground">média geral</p>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="flex gap-4 items-center">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Buscar por nome ou CNPJ..." 
              className="pl-10"
            />
          </div>
        </div>

        {/* Bakeries Table */}
        <Card>
          <CardHeader>
            <CardTitle>Lista de Padarias</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome Fantasia</TableHead>
                  <TableHead>CNPJ</TableHead>
                  <TableHead>Endereço</TableHead>
                  <TableHead>Ticket Médio</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Pagamento</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bakeries.map((bakery, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{bakery.name}</TableCell>
                    <TableCell>{bakery.cnpj}</TableCell>
                    <TableCell>{bakery.address}</TableCell>
                    <TableCell className="font-semibold text-secondary">{bakery.averageTicket}</TableCell>
                    <TableCell>
                      <Badge 
                        variant={bakery.status === "ativa" ? "default" : "outline"}
                        className={bakery.status === "ativa" 
                          ? "bg-green-100 text-green-800 border-green-200" 
                          : "text-yellow-600 border-yellow-600"
                        }
                      >
                        {bakery.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={bakery.payment === "pago" ? "default" : "outline"}
                        className={bakery.payment === "pago" 
                          ? "bg-secondary text-secondary-foreground" 
                          : "text-red-600 border-red-600"
                        }
                      >
                        {bakery.payment}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm">
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <QrCode className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
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