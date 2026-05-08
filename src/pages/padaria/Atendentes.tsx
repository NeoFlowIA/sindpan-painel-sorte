import { useState } from "react";
import { Plus, Pencil, Trash2, Users } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import {
  useAtendentes,
  useCreateAtendente,
  useDeleteAtendente,
  useUpdateAtendente,
} from "@/hooks/useAtendentes";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function PadariaAtendentes() {
  const { user } = useAuth();
  const padariaId = user?.padarias_id || user?.padarias?.id || "";

  const [novoNome, setNovoNome] = useState("");
  const [modalAberto, setModalAberto] = useState(false);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [nomeEdicao, setNomeEdicao] = useState("");

  const { data, isLoading } = useAtendentes(padariaId);
  const createAtendente = useCreateAtendente();
  const updateAtendente = useUpdateAtendente();
  const deleteAtendente = useDeleteAtendente();

  const atendentes = data?.atendentes || [];

  const handleAdicionar = async () => {
    const nome = novoNome.trim();
    if (!nome || !padariaId) return;

    try {
      await createAtendente.mutateAsync({
        atendente: { nome, padaria_id: padariaId },
      });
      setNovoNome("");
      setModalAberto(false);
      toast.success("Atendente cadastrado com sucesso");
    } catch (error) {
      toast.error("Erro ao cadastrar atendente");
    }
  };

  const iniciarEdicao = (id: string, nome: string) => {
    setEditandoId(id);
    setNomeEdicao(nome);
  };

  const salvarEdicao = async (id: string) => {
    const nome = nomeEdicao.trim();
    if (!nome) return;

    try {
      await updateAtendente.mutateAsync({
        id,
        changes: { nome },
      });
      setEditandoId(null);
      setNomeEdicao("");
      toast.success("Atendente atualizado");
    } catch (error) {
      toast.error("Erro ao atualizar atendente");
    }
  };

  const deletar = async (id: string) => {
    try {
      await deleteAtendente.mutateAsync({ id });
      if (editandoId === id) {
        setEditandoId(null);
        setNomeEdicao("");
      }
      toast.success("Atendente removido");
    } catch (error) {
      toast.error("Erro ao excluir atendente");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:justify-between sm:items-center">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-primary">Atendentes</h1>
          <p className="text-sm text-muted-foreground">Cadastre e gerencie os atendentes da sua padaria.</p>
        </div>

        <Dialog open={modalAberto} onOpenChange={setModalAberto}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Cadastrar atendente
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Novo atendente</DialogTitle>
              <DialogDescription>Preencha o nome para adicionar um atendente.</DialogDescription>
            </DialogHeader>
            <div className="space-y-2">
              <Label htmlFor="nome-atendente">Nome do atendente</Label>
              <Input
                id="nome-atendente"
                value={novoNome}
                onChange={(event) => setNovoNome(event.target.value)}
                placeholder="Ex: Maria Souza"
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setModalAberto(false)}>Cancelar</Button>
              <Button onClick={handleAdicionar} disabled={createAtendente.isPending || !padariaId}>
                Cadastrar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Lista de atendentes</CardTitle>
            <CardDescription>Total cadastrados: {atendentes.length}</CardDescription>
          </div>
          <Users className="w-5 h-5 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Carregando atendentes...</p>
          ) : atendentes.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum atendente cadastrado ainda.</p>
          ) : (
            <div className="space-y-3">
              {atendentes.map((atendente) => (
                <div key={atendente.id} className="border rounded-lg p-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  {editandoId === atendente.id ? (
                    <Input value={nomeEdicao} onChange={(event) => setNomeEdicao(event.target.value)} className="w-full sm:max-w-md" />
                  ) : (
                    <p className="font-medium">{atendente.nome}</p>
                  )}

                  <div className="flex items-center gap-2">
                    {editandoId === atendente.id ? (
                      <>
                        <Button size="sm" onClick={() => salvarEdicao(atendente.id)} disabled={updateAtendente.isPending}>
                          Salvar
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => { setEditandoId(null); setNomeEdicao(""); }}>
                          Cancelar
                        </Button>
                      </>
                    ) : (
                      <Button size="sm" variant="outline" onClick={() => iniciarEdicao(atendente.id, atendente.nome)}>
                        <Pencil className="w-4 h-4 mr-2" />
                        Editar
                      </Button>
                    )}

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button size="sm" variant="destructive" disabled={deleteAtendente.isPending}>
                          <Trash2 className="w-4 h-4 mr-2" />
                          Excluir
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Excluir atendente?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Esta ação não pode ser desfeita. O atendente será removido da lista.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={() => deletar(atendente.id)}>Excluir</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
