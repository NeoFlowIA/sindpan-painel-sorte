import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Download, FileText, User, Calendar, Search, ArrowLeft } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import sindpanLogo from "@/assets/sindpan-logo.svg";

// Mock data for raffle history
const raffleHistory = [
  {
    id: 1,
    date: "15/01/2024",
    number: "07349",
    winner: "Maria Silva Santos",
    cpf: "123.456.789-01",
    bakery: "Padaria Central",
    answer: "Na Padaria"
  },
  {
    id: 2,
    date: "08/01/2024", 
    number: "02841",
    winner: "João Pereira Lima",
    cpf: "987.654.321-09",
    bakery: "Pão Dourado",
    answer: "Outro lugar"
  },
  {
    id: 3,
    date: "01/01/2024",
    number: "09673", 
    winner: "Ana Costa Oliveira",
    cpf: "456.789.123-45",
    bakery: "Delícias do Forno",
    answer: "Na padaria"
  },
  {
    id: 4,
    date: "29/12/2023",
    number: "05528",
    winner: "Carlos Eduardo Silva",
    cpf: "321.654.987-12",
    bakery: "Padaria Central",
    answer: null
  }
];

export default function RelatorioSorteios() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBakery, setSelectedBakery] = useState("all");
  const [selectedWinner, setSelectedWinner] = useState<typeof raffleHistory[0] | null>(null);
  const [showWinnerDetails, setShowWinnerDetails] = useState(false);

  const filteredRaffles = raffleHistory.filter(raffle => {
    const matchesSearch = raffle.winner.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         raffle.cpf.includes(searchTerm);
    const matchesBakery = selectedBakery === "all" || raffle.bakery.includes(selectedBakery);
    return matchesSearch && matchesBakery;
  });

  const showWinnerInfo = (winner: typeof raffleHistory[0]) => {
    setSelectedWinner(winner);
    setShowWinnerDetails(true);
  };

  const exportToPDF = () => {
    // Mock export functionality
  };

  const exportToCSV = () => {
    // Mock export functionality
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header with logo */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <img 
                src={sindpanLogo} 
                alt="SINDPAN Logo" 
                className="h-12 w-auto"
              />
              <div>
                <h1 className="text-2xl font-bold text-primary">Relatório de Sorteios</h1>
                <p className="text-muted-foreground">Histórico completo dos sorteios realizados</p>
              </div>
            </div>
            <Button 
              variant="outline" 
              onClick={() => navigate('/sorteios')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar para Sorteios
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8 space-y-6">
        {/* Filters and Search */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="w-5 h-5" />
              Filtros e Busca
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4 items-center">
              <Input 
                placeholder="Buscar por nome ou CPF..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
              <Select value={selectedBakery} onValueChange={setSelectedBakery}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Filtrar por padaria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as padarias</SelectItem>
                  <SelectItem value="Central">Padaria Central</SelectItem>
                  <SelectItem value="Dourado">Pão Dourado</SelectItem>
                  <SelectItem value="Delícias">Delícias do Forno</SelectItem>
                </SelectContent>
              </Select>
              <div className="ml-auto flex gap-2">
                <Button variant="outline" onClick={exportToPDF}>
                  <FileText className="w-4 h-4 mr-2" />
                  Exportar PDF
                </Button>
                <Button variant="outline" onClick={exportToCSV}>
                  <Download className="w-4 h-4 mr-2" />
                  Exportar CSV
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-primary">{raffleHistory.length}</div>
              <p className="text-muted-foreground">Total de Sorteios</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-accent">{new Set(raffleHistory.map(r => r.bakery)).size}</div>
              <p className="text-muted-foreground">Padarias Contempladas</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-secondary">
                {raffleHistory.filter(r => r.answer === "Na Padaria").length}
              </div>
              <p className="text-muted-foreground">Responderam "Na Padaria"</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-orange-500">
                {raffleHistory.filter(r => r.answer === "Outro lugar").length}
              </div>
              <p className="text-muted-foreground">Responderam "Outro lugar"</p>
            </CardContent>
          </Card>
        </div>

        {/* Raffles Table */}
        <Card>
          <CardHeader>
            <CardTitle>Histórico Detalhado ({filteredRaffles.length} registros)</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data do Sorteio</TableHead>
                  <TableHead>Número Sorteado</TableHead>
                  <TableHead>Ganhador</TableHead>
                  <TableHead>Padaria</TableHead>
                  <TableHead>Resposta</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRaffles.map((raffle) => (
                  <TableRow key={raffle.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        {raffle.date}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className="bg-primary text-primary-foreground font-mono">
                        {raffle.number}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">{raffle.winner}</TableCell>
                    <TableCell>{raffle.bakery}</TableCell>
                    <TableCell>
                      <Badge 
                        className={
                          raffle.answer === "Na Padaria" 
                            ? "bg-green-500 text-white" 
                            : raffle.answer === "Outro lugar"
                            ? "bg-yellow-500 text-black"
                            : "bg-gray-300 text-black"
                        }
                      >
                        {raffle.answer || "Não informado"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => showWinnerInfo(raffle)}
                      >
                        <User className="w-4 h-4 mr-1" />
                        Ver detalhes
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Winner Details Modal */}
        <Dialog open={showWinnerDetails} onOpenChange={setShowWinnerDetails}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <User className="w-5 h-5 text-primary" />
                Detalhes Completos do Ganhador
              </DialogTitle>
            </DialogHeader>
            
            {selectedWinner && (
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Nome Completo</label>
                  <p className="text-lg">{selectedWinner.winner}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-muted-foreground">CPF Completo</label>
                  <p className="text-lg font-mono">{selectedWinner.cpf}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Padaria</label>
                  <p className="text-lg">{selectedWinner.bakery}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Data do Sorteio</label>
                  <p className="text-lg">{selectedWinner.date}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-muted-foreground">Número Sorteado</label>
                  <p className="text-lg font-mono text-primary">{selectedWinner.number}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Resposta da pergunta</label>
                  <p className="text-lg">{selectedWinner.answer || "Não informado"}</p>
                </div>
                
                <div className="flex gap-2 pt-4">
                  <Button variant="outline" className="flex-1">
                    Entrar em contato
                  </Button>
                  <Button onClick={() => setShowWinnerDetails(false)}>
                    Fechar
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}