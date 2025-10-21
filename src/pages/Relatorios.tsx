import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { FileText, Download, Calendar, Filter, Loader2 } from "lucide-react";
import { graphqlClient } from "@/lib/graphql-client";
import { 
  GET_ALL_CLIENTES_WITH_CUPONS,
  GET_HISTORICO_SORTEIOS,
  GET_PADARIAS
} from "@/graphql/queries";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { useState } from "react";
import jsPDF from "jspdf";
import * as XLSX from "xlsx";

export default function Relatorios() {
  const [isExporting, setIsExporting] = useState(false);

  // Buscar estatísticas
  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboardMetrics'],
    queryFn: async () => {
      const data = await graphqlClient.query<{
        cupons_aggregate: { aggregate: { count: number } };
        clientes_aggregate: { aggregate: { count: number } };
        padarias_aggregate: { aggregate: { count: number } };
        sorteios_aggregate: { aggregate: { count: number } };
      }>(`
        query GetQuickStats {
          cupons_aggregate {
            aggregate {
              count
            }
          }
          clientes_aggregate {
            aggregate {
              count
            }
          }
          padarias_aggregate {
            aggregate {
              count
            }
          }
          sorteios_aggregate {
            aggregate {
              count
            }
          }
        }
      `);
      return data;
    }
  });

  // Exportar CSV de Participação
  const generateParticipationCSV = async () => {
    try {
      setIsExporting(true);
      toast.info("Gerando relatório de participação...");

      const data = await graphqlClient.query<{
        clientes: Array<{
          nome: string;
          cpf: string;
          telefone: string;
          email: string;
          cupons: Array<{
            numero_cupom: string;
            numero_sorte: string | null;
            created_at: string;
            sorteio: {
              nome: string;
              data_sorteio: string;
            } | null;
            padaria: {
              nome: string;
            };
          }>;
        }>;
      }>(GET_ALL_CLIENTES_WITH_CUPONS);
      
      if (!data.clientes || data.clientes.length === 0) {
        toast.warning("Nenhum participante encontrado");
        return;
      }

      // Processar dados no front
      const rows: string[] = [];
      data.clientes.forEach(cliente => {
        if (cliente && cliente.cupons && Array.isArray(cliente.cupons)) {
          cliente.cupons.forEach(cupom => {
            if (cupom) {
              rows.push([
                `"${cliente.nome || 'N/A'}"`,
                cliente.cpf || 'N/A',
                cliente.telefone || 'N/A',
                cliente.email || 'N/A',
                cupom.numero_cupom || 'N/A',
                cupom.numero_sorte || "N/A",
                cupom.sorteio?.nome ? `"${cupom.sorteio.nome}"` : "N/A",
                cupom.sorteio?.data_sorteio ? new Date(cupom.sorteio.data_sorteio).toLocaleDateString('pt-BR') : "N/A",
                cupom.padaria?.nome ? `"${cupom.padaria.nome}"` : "N/A",
                cupom.created_at ? new Date(cupom.created_at).toLocaleDateString('pt-BR') : 'N/A'
              ].join(","));
            }
          });
        }
      });

      const headers = [
        "Cliente",
        "CPF",
        "Telefone",
        "Email",
        "Número do Cupom",
        "Número da Sorte",
        "Sorteio",
        "Data do Sorteio",
        "Padaria",
        "Data de Cadastro"
      ];
      
      const csvContent = [headers.join(","), ...rows].join("\n");
      const BOM = "\uFEFF";
      const blob = new Blob([BOM + csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", `relatorio_participacao_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success(`Relatório exportado com ${rows.length} registros!`);
    } catch (error) {
      toast.error("Erro ao gerar relatório");
    } finally {
      setIsExporting(false);
    }
  };

  // Exportar PDF de Sorteios
  const generateLotteryPDF = async () => {
    try {
      setIsExporting(true);
      toast.info("Gerando PDF de sorteios...");

      const data = await graphqlClient.query<{
        sorteios: Array<{
          id: string;
          nome: string;
          descricao: string | null;
          data_sorteio: string;
          status: string;
          numero_sorteado: string | null;
          created_at: string;
        }>;
        ganhadores: Array<{
          id: string;
          cliente: {
            nome: string;
            cpf: string;
            telefone: string;
          };
          cupom: {
            numero_cupom: string;
            padaria: {
              nome: string;
            };
          };
          sorteio: {
            nome: string;
            data_sorteio: string;
          };
        }>;
      }>(GET_HISTORICO_SORTEIOS);
      
      if (!data.sorteios || data.sorteios.length === 0) {
        toast.warning("Nenhum sorteio encontrado");
        return;
      }

      // Criar PDF
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      let yPos = 20;

      // Título
      doc.setFontSize(18);
      doc.setFont("helvetica", "bold");
      doc.text("Histórico de Sorteios", pageWidth / 2, yPos, { align: "center" });
      yPos += 10;

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, pageWidth / 2, yPos, { align: "center" });
      yPos += 15;

      // Processar cada sorteio
      if (data.sorteios && Array.isArray(data.sorteios)) {
        data.sorteios.forEach((sorteio, index) => {
          if (!sorteio) return;

          if (yPos > 270) {
            doc.addPage();
            yPos = 20;
          }

          doc.setFontSize(14);
          doc.setFont("helvetica", "bold");
          doc.text(`${index + 1}. ${sorteio.nome || 'Sorteio sem nome'}`, 15, yPos);
          yPos += 7;

          doc.setFontSize(10);
          doc.setFont("helvetica", "normal");
          doc.text(`Data: ${sorteio.data_sorteio ? new Date(sorteio.data_sorteio).toLocaleDateString('pt-BR') : 'N/A'}`, 20, yPos);
          yPos += 5;
          doc.text(`Status: ${sorteio.status || 'N/A'}`, 20, yPos);
          yPos += 5;
          
          if (sorteio.numero_sorteado) {
            doc.text(`Número Sorteado: ${sorteio.numero_sorteado}`, 20, yPos);
            yPos += 5;
          }

          // Buscar ganhadores deste sorteio
          const ganhadoresSorteio = data.ganhadores && Array.isArray(data.ganhadores) 
            ? data.ganhadores.filter(g => g && g.sorteio && g.sorteio.nome === sorteio.nome) 
            : [];
          
          if (ganhadoresSorteio.length > 0) {
            doc.setFont("helvetica", "bold");
            doc.text("Ganhadores:", 20, yPos);
            yPos += 5;
            doc.setFont("helvetica", "normal");

            ganhadoresSorteio.forEach(ganhador => {
              if (!ganhador || !ganhador.cliente) return;

              if (yPos > 270) {
                doc.addPage();
                yPos = 20;
              }
              doc.text(`  • ${ganhador.cliente.nome || 'N/A'} (CPF: ${ganhador.cliente.cpf || 'N/A'})`, 25, yPos);
              yPos += 5;
              doc.text(`    Tel: ${ganhador.cliente.telefone || 'N/A'} | Cupom: ${ganhador.cupom?.numero_cupom || 'N/A'}`, 25, yPos);
              yPos += 5;
              doc.text(`    Padaria: ${ganhador.cupom?.padaria?.nome || 'N/A'}`, 25, yPos);
              yPos += 7;
            });
          } else {
            doc.text("Sem ganhadores registrados", 20, yPos);
            yPos += 7;
          }

          yPos += 3;
        });
      }

      doc.save(`historico_sorteios_${new Date().toISOString().split('T')[0]}.pdf`);
      toast.success(`PDF gerado com ${data.sorteios.length} sorteios!`);
    } catch (error) {
      toast.error("Erro ao gerar PDF");
    } finally {
      setIsExporting(false);
    }
  };

  // Exportar XLSX de Padarias
  const generateBakeriesXLSX = async () => {
    try {
      setIsExporting(true);
      toast.info("Gerando planilha de padarias...");

      const data = await graphqlClient.query<{
        padarias: Array<{
          id: string;
          nome: string;
          cnpj: string;
          email: string;
          telefone: string;
          endereco: string;
          status: string;
          status_pagamento: string;
          ticket_medio: number | null;
        }>;
      }>(GET_PADARIAS);
      
      if (!data.padarias || data.padarias.length === 0) {
        toast.warning("Nenhuma padaria encontrada");
        return;
      }

      // Processar dados no front
      const worksheetData = [
        ["Nome", "CNPJ", "Email", "Telefone", "Endereço", "Status", "Status Pagamento", "Ticket Médio"],
        ...data.padarias.map(p => [
          p?.nome || 'N/A',
          p?.cnpj || 'N/A',
          p?.email || 'N/A',
          p?.telefone || 'N/A',
          p?.endereco || 'N/A',
          p?.status || 'N/A',
          p?.status_pagamento || 'N/A',
          p?.ticket_medio || 0
        ])
      ];

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet(worksheetData);
      
      // Ajustar largura das colunas
      const colWidths = [
        { wch: 30 }, // Nome
        { wch: 18 }, // CNPJ
        { wch: 30 }, // Email
        { wch: 15 }, // Telefone
        { wch: 40 }, // Endereço
        { wch: 12 }, // Status
        { wch: 18 }, // Status Pagamento
        { wch: 15 }  // Ticket Médio
      ];
      ws['!cols'] = colWidths;

      XLSX.utils.book_append_sheet(wb, ws, "Padarias");
      XLSX.writeFile(wb, `lista_padarias_${new Date().toISOString().split('T')[0]}.xlsx`);

      toast.success(`Planilha exportada com ${data.padarias.length} padarias!`);
    } catch (error) {
      toast.error("Erro ao gerar planilha");
    } finally {
      setIsExporting(false);
    }
  };

  const reportTypes = [
    {
      title: "Relatório de Participação",
      description: "Lista completa de clientes, cupons, número do sorteio, data e padaria",
      format: ".CSV",
      icon: FileText,
      color: "text-secondary",
      action: generateParticipationCSV
    },
    {
      title: "Números Sorteados",
      description: "Histórico completo de todos os sorteios realizados com ganhadores", 
      format: ".PDF",
      icon: FileText,
      color: "text-primary",
      action: generateLotteryPDF
    },
    {
      title: "Lista de Padarias",
      description: "Informações completas das padarias participantes",
      format: ".XLSX", 
      icon: FileText,
      color: "text-accent",
      action: generateBakeriesXLSX
    }
  ];

  return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-primary">Relatórios</h1>
            <p className="text-muted-foreground">Exporte dados da campanha em diferentes formatos</p>
          </div>
        </div>

        {/* Filters Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Filtros para Exportação
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <label className="text-sm font-medium mb-2 block">Data de Início</label>
                <Input type="date" />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Data de Fim</label>
                <Input type="date" />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Padaria</label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Todas as padarias" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as padarias</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm font-medium mb-2 block">Status dos Participantes</label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos os status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os status</SelectItem>
                    <SelectItem value="active">Ativos</SelectItem>
                    <SelectItem value="inactive">Inativos</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Tipo de Sorteio</label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos os sorteios" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os sorteios</SelectItem>
                    <SelectItem value="weekly">Semanais</SelectItem>
                    <SelectItem value="monthly">Mensais</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Report Types */}
        <div className="grid gap-6 md:grid-cols-3">
          {reportTypes.map((report, index) => (
            <Card key={index} className="relative overflow-hidden">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <report.icon className={`w-6 h-6 ${report.color}`} />
                  {report.title}
                </CardTitle>
                <Badge className="absolute top-4 right-4 bg-secondary text-secondary-foreground">
                  {report.format}
                </Badge>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  {report.description}
                </p>
                <Button 
                  className="w-full" 
                  variant="outline"
                  onClick={report.action}
                  disabled={isExporting}
                >
                  {isExporting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Exportando...
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4 mr-2" />
                      Exportar {report.format}
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Estatísticas Rápidas
            </CardTitle>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
                <span className="ml-2">Carregando estatísticas...</span>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-4">
                <div className="text-center p-4 bg-primary/5 rounded-lg">
                  <div className="text-2xl font-bold text-primary">
                    {statsData?.cupons_aggregate?.aggregate?.count || 0}
                  </div>
                  <p className="text-sm text-muted-foreground">Cupons Validados</p>
                </div>
                <div className="text-center p-4 bg-secondary/5 rounded-lg">
                  <div className="text-2xl font-bold text-secondary">
                    {statsData?.clientes_aggregate?.aggregate?.count || 0}
                  </div>
                  <p className="text-sm text-muted-foreground">Participantes Únicos</p>
                </div>
                <div className="text-center p-4 bg-accent/5 rounded-lg">
                  <div className="text-2xl font-bold text-accent">
                    {statsData?.padarias_aggregate?.aggregate?.count || 0}
                  </div>
                  <p className="text-sm text-muted-foreground">Padarias Ativas</p>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {statsData?.sorteios_aggregate?.aggregate?.count || 0}
                  </div>
                  <p className="text-sm text-muted-foreground">Sorteios Realizados</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
  );
}
