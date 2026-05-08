import { FormEvent, useMemo, useState } from "react";
import { Plus, Pencil, Trash2, Users } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

type Atendente = {
  id: string;
  nome: string;
};

export function PadariaAtendentes() {
  const [atendentes, setAtendentes] = useState<Atendente[]>([]);
  const [novoNome, setNovoNome] = useState("");
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [nomeEdicao, setNomeEdicao] = useState("");

  const totalAtendentes = useMemo(() => atendentes.length, [atendentes]);

  const handleAdicionar = (event: FormEvent) => {
    event.preventDefault();
    const nome = novoNome.trim();
    if (!nome) return;

    setAtendentes((atual) => [
      ...atual,
      { id: crypto.randomUUID(), nome },
    ]);
    setNovoNome("");
  };

  const iniciarEdicao = (atendente: Atendente) => {
    setEditandoId(atendente.id);
    setNomeEdicao(atendente.nome);
  };

  const salvarEdicao = (id: string) => {
    const nome = nomeEdicao.trim();
    if (!nome) return;

    setAtendentes((atual) =>
      atual.map((atendente) =>
        atendente.id === id ? { ...atendente, nome } : atendente,
      ),
    );
    setEditandoId(null);
    setNomeEdicao("");
  };

  const deletarAtendente = (id: string) => {
    setAtendentes((atual) => atual.filter((atendente) => atendente.id !== id));
    if (editandoId === id) {
      setEditandoId(null);
      setNomeEdicao("");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl sm:text-3xl font-bold text-primary">Atendentes</h1>
        <p className="text-sm text-muted-foreground">
          Cadastre e gerencie os atendentes da sua padaria.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Novo atendente</CardTitle>
          <CardDescription>Preencha o nome para adicionar um atendente.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAdicionar} className="flex flex-col sm:flex-row gap-3">
            <div className="w-full space-y-2">
              <Label htmlFor="nome-atendente">Nome do atendente</Label>
              <Input
                id="nome-atendente"
                value={novoNome}
                onChange={(event) => setNovoNome(event.target.value)}
                placeholder="Ex: Maria Souza"
              />
            </div>
            <Button type="submit" className="sm:mt-7">
              <Plus className="w-4 h-4 mr-2" />
              Cadastrar
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Lista de atendentes</CardTitle>
            <CardDescription>Total cadastrados: {totalAtendentes}</CardDescription>
          </div>
          <Users className="w-5 h-5 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {atendentes.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum atendente cadastrado ainda.</p>
          ) : (
            <div className="space-y-3">
              {atendentes.map((atendente) => (
                <div
                  key={atendente.id}
                  className="border rounded-lg p-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  {editandoId === atendente.id ? (
                    <Input
                      value={nomeEdicao}
                      onChange={(event) => setNomeEdicao(event.target.value)}
                      className="w-full sm:max-w-md"
                    />
                  ) : (
                    <p className="font-medium">{atendente.nome}</p>
                  )}

                  <div className="flex items-center gap-2">
                    {editandoId === atendente.id ? (
                      <>
                        <Button size="sm" onClick={() => salvarEdicao(atendente.id)}>
                          Salvar
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setEditandoId(null);
                            setNomeEdicao("");
                          }}
                        >
                          Cancelar
                        </Button>
                      </>
                    ) : (
                      <Button size="sm" variant="outline" onClick={() => iniciarEdicao(atendente)}>
                        <Pencil className="w-4 h-4 mr-2" />
                        Editar
                      </Button>
                    )}

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button size="sm" variant="destructive">
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
                          <AlertDialogAction onClick={() => deletarAtendente(atendente.id)}>
                            Excluir
                          </AlertDialogAction>
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
