import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Store, Plus, Edit, QrCode, Trash2, Search, Loader2 } from "lucide-react";
import { CriarPadariaModal } from "@/components/padaria/CriarPadariaModal";
import { EditarPadariaModal } from "@/components/padaria/EditarPadariaModal";
import { ExcluirPadariaModal } from "@/components/padaria/ExcluirPadariaModal";
import { PaymentDropdown } from "@/components/padaria/PaymentDropdown";
import { usePadarias, usePadariasStats } from "@/hooks/usePadarias";
import { useState } from "react";
import { formatCNPJ, formatPhone, formatStatus, formatStatusPagamento, formatCurrency } from "@/utils/formatters";

// const bakeries = [
//   {
//     name: "Pão Mix",
//     cnpj: "41.363.807/0001-76",
//     address: "Av Dr José Arimatéia Monte e Silva",
//     responsible: "Felix Ponte Frota",
//     phone: "88998640717",
//     averageTicket: "R$ 21,50",
//     status: "ativa",
//     payment: "pago"
//   },
//   {
//     name: "Panificadora Nossa Senhora de Fátima",
//     cnpj: "07.767.551/0001-24",
//     address: "Rua Pe Raul Vieira 704",
//     responsible: "José Carlos Franco Cavalcante",
//     phone: "88999130151",
//     averageTicket: "R$ 50,00",
//     status: "ativa",
//     payment: "pago"
//   },
//   {
//     name: "O Pão Delicatessen",
//     cnpj: "58.837.665/0001-34",
//     address: "Av. Doutor Silas Munguba, 3912",
//     responsible: "Luana Medeiros Nunes",
//     phone: "85997790192",
//     averageTicket: "R$ 25,00",
//     status: "ativa",
//     payment: "pago"
//   },
//   {
//     name: "Panebox Gourmet",
//     cnpj: "16.665.776/0001-60",
//     address: "Rua Monsenhor Otávio de Castro, 582",
//     responsible: "Allena Nunes de Oliveira",
//     phone: "85998425417",
//     averageTicket: "R$ 50,00",
//     status: "ativa",
//     payment: "pago"
//   },
//   {
//     name: "Vó Dazinha Empório",
//     cnpj: "37.543.331/0001-88",
//     address: "Rua Henrique Ellery, 305",
//     responsible: "Maria Ceilia Batista da Cunha",
//     phone: "85987298940",
//     averageTicket: "R$ 50,00",
//     status: "ativa",
//     payment: "pago"
//   },
//   {
//     name: "Padaria Nosso Pão - Cascavel",
//     cnpj: "52.382.690/0001-94",
//     address: "Avenida Prefeito Vitoriano Antunes, 2253 centro Cascavel-CE",
//     responsible: "Francisco José Dantas Sampaio Junior",
//     phone: "85988141156",
//     averageTicket: "R$ 20,00",
//     status: "ativa",
//     payment: "pago"
//   },
//   {
//     name: "Padaria Nosso Pão - Pindoretama",
//     cnpj: "06.017.262/0001-45",
//     address: "Rua Juvenal Gondim, 933 centro Pindoretama-CE",
//     responsible: "Francisco José Dantas Sampaio Júnior",
//     phone: "85988141156",
//     averageTicket: "R$ 20,00",
//     status: "ativa",
//     payment: "pago"
//   },
//   {
//     name: "O Boleiro Bolos",
//     cnpj: "05.614.334/0001-79",
//     address: "Rua Nossa Senhora Das Graças 756",
//     responsible: "Samuel Lima",
//     phone: "85987235043",
//     averageTicket: "R$ 34,50",
//     status: "ativa",
//     payment: "pago"
//   },
//   {
//     name: "Vó Dazinha Padaria e Confeitaria",
//     cnpj: "37.543.331/0002-69",
//     address: "Av Godofredo Maciel 2303",
//     responsible: "Maria Ceilia Batista da Cunha",
//     phone: "85987298940",
//     averageTicket: "R$ 50,00",
//     status: "ativa",
//     payment: "pago"
//   },
//   {
//     name: "Padaria M M",
//     cnpj: "01.755.085/0001-80",
//     address: "Rua Cesário Lange 735",
//     responsible: "Melquiades",
//     phone: "85996319339",
//     averageTicket: "R$ 25,00",
//     status: "ativa",
//     payment: "pago"
//   },
//   {
//     name: "Panificadora Panetutte",
//     cnpj: "41.543.281/0001-06",
//     address: "Rua Soriano Albuquerque 445 bairro Joaquim Távora",
//     responsible: "Lauro Martins de Oliveira Filho",
//     phone: "85999757396",
//     averageTicket: "R$ 25,00",
//     status: "ativa",
//     payment: "pago"
//   },
//   {
//     name: "Padaria Santa Cecília",
//     cnpj: "04.890.933/0001-52",
//     address: "Rua Padre Anchieta, 352 monte castelo",
//     responsible: "Valdenir Merencio da Silva",
//     phone: "85991613891",
//     averageTicket: "R$ 20,00",
//     status: "ativa",
//     payment: "pago"
//   },
//   {
//     name: "Deleite Bolaria",
//     cnpj: "47.270.790/0001-60",
//     address: "Carlos Vasconcelos 834",
//     responsible: "Antonio Neto",
//     phone: "85987124950",
//     averageTicket: "R$ 50,00",
//     status: "ativa",
//     payment: "pago"
//   },
//   {
//     name: "Padaria JW",
//     cnpj: "22.797.079/0001-66",
//     address: "Avenida Contorno Sul São Bento, 210",
//     responsible: "Jaqueline",
//     phone: "85988616429",
//     averageTicket: "R$ 50,00",
//     status: "ativa",
//     payment: "pago"
//   },
//   {
//     name: "Costa Mendes Delicatessen",
//     cnpj: "73.446.890/0001-33",
//     address: "R Professor Costa Mendes - 609 - Bom Futuro",
//     responsible: "Beatriz Silva Matos",
//     phone: "85982118469",
//     averageTicket: "R$ 68,44",
//     status: "ativa",
//     payment: "pago"
//   },
//   {
//     name: "Padaria Costa Mendes Vila União",
//     cnpj: "73.446.890/0002-14",
//     address: "R Raul Cabral - 105, Vila União",
//     responsible: "Beatriz Silva Matos",
//     phone: "85982118469",
//     averageTicket: "R$ 41,00",
//     status: "ativa",
//     payment: "pago"
//   },
//   {
//     name: "Padaria Costa Mendes Aldeota",
//     cnpj: "73.446.890/0003-03",
//     address: "AV Barão de Studart, 777 - Aldeota",
//     responsible: "Beatriz Silva Matos",
//     phone: "85982118469",
//     averageTicket: "R$ 94,23",
//     status: "ativa",
//     payment: "pago"
//   },
//   {
//     name: "Café Viriato",
//     cnpj: "01.807.375/0002-01",
//     address: "Avenida Santos Dumont 3131",
//     responsible: "Haroldo Euclides",
//     phone: "85996240825",
//     averageTicket: "R$ 100,00",
//     status: "ativa",
//     payment: "pago"
//   },
//   {
//     name: "Panificadora Nossa Senhora da Guia",
//     cnpj: "06.338.053/0001-01",
//     address: "Av. Central Norte, 594 - Acaracuzinho, Maracanaú-CE",
//     responsible: "Rojean Fabio Vieira Carneiro",
//     phone: "85989030601",
//     averageTicket: "R$ 21,00",
//     status: "ativa",
//     payment: "pago"
//   },
//   {
//     name: "Padaria Portugália",
//     cnpj: "07.983.311/0001-67",
//     address: "Rua Professor Otávio Lobo, 755 - Cocó",
//     responsible: "Luiz Fernando Marques Rodrigues",
//     phone: "85996457613",
//     averageTicket: "R$ 50,00",
//     status: "ativa",
//     payment: "pago"
//   },
//   {
//     name: "Padaria O Matuto",
//     cnpj: "13.535.994/0001-92",
//     address: "Rua Doutor Manoel Rodrigues Monteiro 600",
//     responsible: "Roberlando Moura e Silva",
//     phone: "85986423462",
//     averageTicket: "R$ 30,00",
//     status: "ativa",
//     payment: "pago"
//   },
//   {
//     name: "Montmarttre",
//     cnpj: "11.832.698/0005-51",
//     address: "Av. Farias Brito 175, lojas 2,3 e 4, Varjota",
//     responsible: "Melissa Macedo Parente",
//     phone: "85988516281",
//     averageTicket: "R$ 65,00",
//     status: "ativa",
//     payment: "pago"
//   },
//   {
//     name: "Panifátima",
//     cnpj: "03.616.846/0002-20",
//     address: "Rua Urucutuba, 1597 - Granja Lisboa",
//     responsible: "Evaldo Costa",
//     phone: "85996315189",
//     averageTicket: "R$ 18,50",
//     status: "ativa",
//     payment: "pago"
//   },
//   {
//     name: "Disk Pão",
//     cnpj: "05.531.382/0001-01",
//     address: "Av Dom Lino, 667",
//     responsible: "Silvia Helena Lima de Sousa",
//     phone: "85991378033",
//     averageTicket: "R$ 22,19",
//     status: "ativa",
//     payment: "pago"
//   },
//   {
//     name: "Nogueira Pães",
//     cnpj: "13.129.988/0001-35",
//     address: "Avenida Alberto Craveiro 2222C Boa Vista Castelão",
//     responsible: "Eliane Santos Nogueira",
//     phone: "85999430062",
//     averageTicket: "R$ 25,00",
//     status: "ativa",
//     payment: "pago"
//   },
//   {
//     name: "Thalita Pães e Cafés",
//     cnpj: "56.388.076/0001-90",
//     address: "Avenida G 291 José Walter Fortaleza CE",
//     responsible: "Karla Sousa Cavalcante",
//     phone: "85987445640",
//     averageTicket: "R$ 28,00",
//     status: "ativa",
//     payment: "pago"
//   },
//   {
//     name: "Panificadora Trigopan",
//     cnpj: "02.567.719/0001-34",
//     address: "Alvaro Fernandes, 350, Montese, Fortaleza, Ceará",
//     responsible: "Raimundo Henrique Gadelha e Silva",
//     phone: "85997860033",
//     averageTicket: "R$ 30,00",
//     status: "ativa",
//     payment: "pago"
//   },
//   {
//     name: "Panificadora Paulo Belo",
//     cnpj: "40.942.389/0001-09",
//     address: "Av Anastacio Braga 2012 Fazendinha Itapipoca CE",
//     responsible: "Maria Viviane Miranda da Silva",
//     phone: "85997090706",
//     averageTicket: "R$ 8,57",
//     status: "ativa",
//     payment: "pago"
//   },
//   {
//     name: "Empório Mais Paes",
//     cnpj: "29.578.034/0001-40",
//     address: "Padre Francisco Pita 844",
//     responsible: "Fernanda Ramira",
//     phone: "31999977081",
//     averageTicket: "R$ 30,00",
//     status: "ativa",
//     payment: "pago"
//   },
//   {
//     name: "Empório de Fátima Delicatessen",
//     cnpj: "11.322.565/0001-01",
//     address: "Av. Deputado Oswaldo Studart, 250",
//     responsible: "Amanda de Souza Vilar",
//     phone: "85998606033",
//     averageTicket: "R$ 65,00",
//     status: "ativa",
//     payment: "pago"
//   },
//   {
//     name: "J Neto e Cia",
//     cnpj: "07.236.524/0004-78",
//     address: "Av. Heráclito Graça, 1520",
//     responsible: "João Batista",
//     phone: "85999580111",
//     averageTicket: "R$ 25,00",
//     status: "ativa",
//     payment: "pago"
//   },
//   {
//     name: "Padaria Ideal",
//     cnpj: "07.236.524/0004-78",
//     address: "Av. Heráclito Graça, 1520",
//     responsible: "João Batista",
//     phone: "85999580111",
//     averageTicket: "R$ 25,00",
//     status: "ativa",
//     payment: "pago"
//   },
//   {
//     name: "Cinco Quinas Pães e Doces",
//     cnpj: "11.829.488/0001-80",
//     address: "Rua Professor Lino Encarnação 477 Parquelândia",
//     responsible: "Alexandro França Martins",
//     phone: "85999207305",
//     averageTicket: "R$ 25,00",
//     status: "ativa",
//     payment: "pago"
//   },
//   {
//     name: "Padaria e Confeitaria Cinco Quinas",
//     cnpj: "47.921.467/0001-38",
//     address: "Rua Coelho da Fonseca 365",
//     responsible: "Alexsandro França Martins",
//     phone: "85999207305",
//     averageTicket: "R$ 15,00",
//     status: "ativa",
//     payment: "pago"
//   },
//   {
//     name: "Vila Alves - Bom Sucesso",
//     cnpj: "07.436.587/0001-25",
//     address: "Rua Júlio Braga, 881, Bom Sucesso",
//     responsible: "William Alves",
//     phone: "85981981983",
//     averageTicket: "R$ 34,04",
//     status: "ativa",
//     payment: "pago"
//   },
//   {
//     name: "Vila Alves - Vila Velha",
//     cnpj: "07.436.587/0002-06",
//     address: "Rua Menezes de Oliveira, 455, Vila Velha Fortaleza CE",
//     responsible: "William Alves",
//     phone: "85981981983",
//     averageTicket: "R$ 26,79",
//     status: "ativa",
//     payment: "pago"
//   },
//   {
//     name: "Doce Trigo",
//     cnpj: "25.300.069/0001-61",
//     address: "Rua 43, n 48, Jereissati 2 Maracanaú-CE",
//     responsible: "Luiz Maciel Barbosa",
//     phone: "85997568753",
//     averageTicket: "R$ 20,00",
//     status: "ativa",
//     payment: "pago"
//   },
//   {
//     name: "Padaria Sr. Pão",
//     cnpj: "02.059.989/0003-4",
//     address: "Av. Lineu Machado 1230 Jóquei Clube",
//     responsible: "Emanuela Tavares Pedrosa",
//     phone: "85988750075",
//     averageTicket: "R$ 15,00",
//     status: "ativa",
//     payment: "pago"
//   },
//   {
//     name: "Padaria Ideal - Abolição",
//     cnpj: "07.236.524/0002-06",
//     address: "Avenida da Abolição, 1920",
//     responsible: "Francisco Neto da Silviera Brandão",
//     phone: "85999630079",
//     averageTicket: "R$ 45,00",
//     status: "ativa",
//     payment: "pago"
//   },
//   {
//     name: "Derly Pane",
//     cnpj: "06.162.915/0001-80",
//     address: "Rua Eurico Medina 337- Henrique Jorge",
//     responsible: "Ferlando Barbosa Machado",
//     phone: "85988421807",
//     averageTicket: "R$ 30,00",
//     status: "ativa",
//     payment: "pago"
//   },
//   {
//     name: "Padaria Romana",
//     cnpj: "08.706.599/0001-95",
//     address: "Av. Treze de Maio, 901. Fátima",
//     responsible: "Marina de Castro Almeida Braga",
//     phone: "85988432650",
//     averageTicket: "R$ 60,00",
//     status: "ativa",
//     payment: "pago"
//   },
//   {
//     name: "Panificadora Pacatuba",
//     cnpj: "05.225.404/0001-05",
//     address: "Rua Raimundo Siqueira 1937. Centro Pacatuba Ceará",
//     responsible: "Jefferson Novais",
//     phone: "85985450778",
//     averageTicket: "R$ 35,00",
//     status: "ativa",
//     payment: "pago"
//   },
//   {
//     name: "Pão Na Massa",
//     cnpj: "02.962.475/0002-75",
//     address: "Rua Doutor Gilberto Studart 1365",
//     responsible: "Everton Arruda Linhares",
//     phone: "85984550058",
//     averageTicket: "R$ 28,60",
//     status: "ativa",
//     payment: "pago"
//   },
//   {
//     name: "Ina Patisserie",
//     cnpj: "23.736.946/0001-16",
//     address: "Rua Padre Matos Serra 266 Fátima",
//     responsible: "Cesarina Mariano Mendes",
//     phone: "85998104322",
//     averageTicket: "R$ 25,00",
//     status: "ativa",
//     payment: "pago"
//   },
//   {
//     name: "Empório Sublime - Tomás Rodrigues",
//     cnpj: "34.696.384/0001-40",
//     address: "R Tomás Rodrigues 1330 Antônio Bezerra Fortaleza - CE",
//     responsible: "Antonio Aristides de Carvalho Neto",
//     phone: "85988217950",
//     averageTicket: "R$ 45,00",
//     status: "pendente",
//     payment: "pendente"
//   },
//   {
//     name: "Empório Sublime - Hugo Vitor",
//     cnpj: "34.696.384/0002-21",
//     address: "Rua Hugo Vitor 375 Antônio Bezerra Fortaleza - CE",
//     responsible: "Antonio Aristides de Carvalho Neto",
//     phone: "85988217950",
//     averageTicket: "R$ 157,87",
//     status: "pendente",
//     payment: "pendente"
//   },
//   {
//     name: "Empório Sublime - Macapá",
//     cnpj: "34.696.384/0003-02",
//     address: "R Macapá 780 Dom Lustosa Fortaleza - CE",
//     responsible: "Antonio Aristides de Carvalho Neto",
//     phone: "85988217950",
//     averageTicket: "R$ 211,53",
//     status: "pendente",
//     payment: "pendente"
//   },
//   {
//     name: "Panificadora Marilia - Urucutuba",
//     cnpj: "17.965.022/0001-99",
//     address: "Avenida Urucutuba 2487",
//     responsible: "Marília Ribeiro",
//     phone: "85998012570",
//     averageTicket: "R$ 30,00",
//     status: "ativa",
//     payment: "pago"
//   },
//   {
//     name: "Panificadora Marilia - Paulo Afonso",
//     cnpj: "46.631.161/0001-84",
//     address: "Avenida Paulo Afonso 5045",
//     responsible: "Marília Ribeiro",
//     phone: "85998012570",
//     averageTicket: "R$ 25,00",
//     status: "ativa",
//     payment: "pago"
//   }
// ];

export default function Padarias() {
  const [searchTerm, setSearchTerm] = useState('');
  
  // Buscar dados das padarias
  const { data: padariasData, isLoading: loadingPadarias, error: errorPadarias } = usePadarias();
  const { data: statsData, isLoading: loadingStats, error: errorStats } = usePadariasStats();

  // Filtrar padarias baseado na busca
  const filteredPadarias = padariasData?.padarias?.filter(padaria =>
    padaria.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    padaria.cnpj.includes(searchTerm)
  ) || [];

  // Calcular estatísticas
  const totalPadarias = statsData?.padarias_aggregate?.aggregate?.count || 0;
  const padariasAtivas = statsData?.padarias_ativas?.aggregate?.count || 0;
  const padariasPendentes = statsData?.padarias_pendentes?.aggregate?.count || 0;
  const ticketMedio = statsData?.ticket_medio?.aggregate?.avg?.ticket_medio || 0;

  if (loadingPadarias || loadingStats) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Carregando padarias...</span>
      </div>
    );
  }

  if (errorPadarias || errorStats) {
    return (
      <div className="bg-red-50 border border-red-200 rounded p-4">
        <h4 className="font-semibold text-red-800 mb-2">❌ Erro ao carregar dados</h4>
        <p className="text-sm text-red-700">
          {errorPadarias?.message || errorStats?.message || 'Erro desconhecido'}
        </p>
      </div>
    );
  }

  return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-primary">Padarias Participantes</h1>
            <p className="text-muted-foreground">Gerencie as padarias cadastradas na campanha</p>
          </div>
          <CriarPadariaModal>
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
              <Plus className="w-4 h-4 mr-2" />
              Adicionar padaria
            </Button>
          </CriarPadariaModal>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Padarias</CardTitle>
              <Store className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{totalPadarias}</div>
              <p className="text-xs text-muted-foreground">participantes confirmadas</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ativas</CardTitle>
              <Badge className="bg-green-100 text-green-800">Status</Badge>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{padariasAtivas}</div>
              <p className="text-xs text-muted-foreground">
                {totalPadarias > 0 ? Math.round((padariasAtivas / totalPadarias) * 100) : 0}% do total
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
              <Badge variant="outline" className="text-yellow-600 border-yellow-600">Status</Badge>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{padariasPendentes}</div>
              <p className="text-xs text-muted-foreground">aguardando confirmação</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ticket Médio</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-secondary">
                {formatCurrency(ticketMedio)}
              </div>
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
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
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
                  <TableHead>Nome</TableHead>
                  <TableHead>CNPJ</TableHead>
                  <TableHead>Endereço</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Telefone</TableHead>
                  <TableHead>Ticket Médio</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Pagamento</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPadarias.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                      {searchTerm ? 'Nenhuma padaria encontrada com esse termo.' : 'Nenhuma padaria cadastrada.'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPadarias.map((padaria, index) => (
                    <TableRow key={`${padaria.cnpj}-${index}`}>
                      <TableCell className="font-medium">{padaria.nome}</TableCell>
                      <TableCell className="font-mono text-sm">{formatCNPJ(padaria.cnpj)}</TableCell>
                      <TableCell className="max-w-xs truncate">{padaria.endereco}</TableCell>
                      <TableCell>{padaria.email || '-'}</TableCell>
                      <TableCell>{formatPhone(padaria.telefone || '')}</TableCell>
                      <TableCell className="font-semibold text-secondary">
                        {formatCurrency(padaria.ticket_medio || 0)}
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={padaria.status === "ativa" ? "default" : "outline"}
                          className={padaria.status === "ativa" 
                            ? "bg-green-100 text-green-800 border-green-200" 
                            : padaria.status === "pendente"
                              ? "text-yellow-600 border-yellow-600"
                              : "text-red-600 border-red-600"
                          }
                        >
                          {formatStatus(padaria.status)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={padaria.status_pagamento === "pago" ? "default" : "outline"}
                          className={padaria.status_pagamento === "pago" 
                            ? "bg-blue-100 text-blue-800 border-blue-200" 
                            : padaria.status_pagamento === "atrasado"
                              ? "text-red-600 border-red-600"
                              : "text-orange-600 border-orange-600"
                          }
                        >
                          {formatStatusPagamento(padaria.status_pagamento || 'em_aberto')}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <EditarPadariaModal 
                            bakery={{
                              ...padaria,
                              name: padaria.nome,
                              address: padaria.endereco,
                              averageTicket: formatCurrency(padaria.ticket_medio || 0),
                              payment: padaria.status_pagamento || 'em_aberto'
                            }}
                          >
                            <Button variant="ghost" size="sm">
                              <Edit className="w-4 h-4" />
                            </Button>
                          </EditarPadariaModal>
                          <Button variant="ghost" size="sm">
                            <QrCode className="w-4 h-4" />
                          </Button>
                          <ExcluirPadariaModal 
                            padaria={{
                              cnpj: padaria.cnpj, // CNPJ sem formatação para a mutation
                              nome: padaria.nome
                            }}
                          >
                            <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </ExcluirPadariaModal>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
  );
}