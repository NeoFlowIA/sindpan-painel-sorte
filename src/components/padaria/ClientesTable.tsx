import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search } from "lucide-react";
import { NovoClienteModal } from "./NovoClienteModal";
import { getClientes, Cliente } from "@/utils/clientesStorage";

export function ClientesTable() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    const load = () => setClientes(getClientes());
    load();
    if (typeof window !== "undefined") {
      window.addEventListener("clientesUpdated", load);
    }
    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("clientesUpdated", load);
      }
    };
  }, []);

  const filteredClientes = clientes.filter(
    (cliente) =>
      cliente.cpf.includes(searchTerm) ||
      cliente.whatsapp.includes(searchTerm) ||
      cliente.nome.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const totalPages = Math.ceil(filteredClientes.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentClientes = filteredClientes.slice(startIndex, startIndex + itemsPerPage);

  const handleClienteAdded = () => {
    setIsModalOpen(false);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-foreground">Clientes Cadastrados</CardTitle>
            <CardDescription>Gerencie os clientes da sua padaria</CardDescription>
          </div>
          <Button onClick={() => setIsModalOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Novo Cliente
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Search */}
        <div className="flex items-center gap-2 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por CPF, WhatsApp ou nome..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left p-3 font-medium text-muted-foreground">CPF</th>
                <th className="text-left p-3 font-medium text-muted-foreground">Nome</th>
                <th className="text-left p-3 font-medium text-muted-foreground">WhatsApp</th>
                <th className="text-center p-3 font-medium text-muted-foreground">Cupons</th>
                <th className="text-center p-3 font-medium text-muted-foreground">Cadastro</th>
              </tr>
            </thead>
            <tbody>
              {currentClientes.map((cliente) => (
                <tr
                  key={cliente.id}
                  className="border-b border-border/50 hover:bg-muted/50 transition-colors duration-200"
                >
                  <td className="p-3 font-mono text-sm">{cliente.cpf}</td>
                  <td className="p-3 font-medium">{cliente.nome}</td>
                  <td className="p-3 text-muted-foreground">{cliente.whatsapp}</td>
                  <td className="p-3 text-center">
                    <span className="bg-primary/10 text-primary px-2 py-1 rounded-full text-sm font-medium">
                      {cliente.totalCupons}
                    </span>
                  </td>
                  <td className="p-3 text-center text-muted-foreground">{cliente.dataCadastro}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4">
            <p className="text-sm text-muted-foreground">
              Mostrando {startIndex + 1} a {Math.min(startIndex + itemsPerPage, filteredClientes.length)} de {filteredClientes.length} clientes
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(currentPage - 1)}
              >
                Anterior
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(currentPage + 1)}
              >
                Próximo
              </Button>
            </div>
          </div>
        )}
      </CardContent>

      <NovoClienteModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        onClienteAdded={handleClienteAdded}
      />
    </Card>
  );
}
