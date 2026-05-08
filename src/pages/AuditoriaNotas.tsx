import { useMemo, useState } from "react";
import { CheckCircle2, Clock3, Expand, ReceiptText, XCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

type StatusAuditoria = "pendente" | "aprovada" | "reprovada";

type NotaAuditoria = {
  id: string;
  padaria: string;
  cliente: string;
  valorIA: number;
  imagemUrl: string;
  enviadaEm: string;
  status: StatusAuditoria;
  valorAprovado?: number;
  cuponsGerados?: number;
};

const NOTAS_INICIAIS: NotaAuditoria[] = [
  {
    id: "AUD-001",
    padaria: "Padaria Bom Pão",
    cliente: "Maria Souza",
    valorIA: 28.9,
    imagemUrl: "https://i.imgur.com/tc989yh.jpg",
    enviadaEm: "2026-05-08T09:45:00Z",
    status: "pendente",
  },
  {
    id: "AUD-002",
    padaria: "Padaria Massa Fina",
    cliente: "João Silva",
    valorIA: 14.5,
    imagemUrl: "https://i.imgur.com/tc989yh.jpg",
    enviadaEm: "2026-05-08T10:15:00Z",
    status: "pendente",
  },
];

const TICKET_MEDIO_REFERENCIA = 10;

const formatBRL = (value: number) =>
  value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export default function AuditoriaNotas() {
  const [notas, setNotas] = useState<NotaAuditoria[]>(NOTAS_INICIAIS);
  const [valorDigitado, setValorDigitado] = useState<Record<string, string>>({});

  const pendentes = useMemo(() => notas.filter((n) => n.status === "pendente"), [notas]);
  const finalizadas = useMemo(() => notas.filter((n) => n.status !== "pendente"), [notas]);

  const aprovarNota = (id: string) => {
    const valor = Number((valorDigitado[id] || "").replace(",", "."));
    if (!valor || valor <= 0) {
      toast.error("Informe um valor válido para aprovação");
      return;
    }

    const cupons = Math.floor(valor / TICKET_MEDIO_REFERENCIA);

    setNotas((atual) =>
      atual.map((nota) =>
        nota.id === id
          ? {
              ...nota,
              status: "aprovada",
              valorAprovado: valor,
              cuponsGerados: cupons,
            }
          : nota,
      ),
    );

    toast.success(`Nota aprovada e ${cupons} cupom(ns) gerado(s).`);
  };

  const reprovarNota = (id: string) => {
    setNotas((atual) =>
      atual.map((nota) =>
        nota.id === id
          ? {
              ...nota,
              status: "reprovada",
            }
          : nota,
      ),
    );
    toast.success("Nota reprovada e removida da fila de pendências.");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">Auditoria de Notas</h1>
        <p className="text-muted-foreground text-sm md:text-base">
          Valide notas fiscais enviadas pelas padarias e defina o valor final para processamento.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Pendentes</CardTitle></CardHeader><CardContent className="text-2xl font-bold">{pendentes.length}</CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Aprovadas</CardTitle></CardHeader><CardContent className="text-2xl font-bold">{notas.filter(n => n.status === "aprovada").length}</CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Reprovadas</CardTitle></CardHeader><CardContent className="text-2xl font-bold">{notas.filter(n => n.status === "reprovada").length}</CardContent></Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Fila de Auditoria (Pendentes)</CardTitle>
          <CardDescription>Ao aprovar, a nota sai da lista e segue para processamento de cupons.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {pendentes.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma nota pendente.</p>
          ) : (
            pendentes.map((nota) => (
              <div key={nota.id} className="border rounded-lg p-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <ReceiptText className="w-4 h-4" />
                    <p className="font-semibold">{nota.id}</p>
                    <Badge variant="secondary"><Clock3 className="w-3 h-3 mr-1" />Pendente</Badge>
                  </div>
                  <p className="text-sm"><strong>Padaria:</strong> {nota.padaria}</p>
                  <p className="text-sm"><strong>Cliente:</strong> {nota.cliente}</p>
                  <p className="text-sm"><strong>Valor lido pela IA:</strong> {formatBRL(nota.valorIA)}</p>
                  <p className="text-xs text-muted-foreground">Enviada em {new Date(nota.enviadaEm).toLocaleString("pt-BR")}</p>

                  <div className="pt-2 space-y-2">
                    <label className="text-sm font-medium">Valor validado pelo admin</label>
                    <Input
                      placeholder="Ex: 32,90"
                      value={valorDigitado[nota.id] || ""}
                      onChange={(e) => setValorDigitado((atual) => ({ ...atual, [nota.id]: e.target.value }))}
                    />
                    <p className="text-xs text-muted-foreground">Referência atual: 1 cupom a cada R$ {TICKET_MEDIO_REFERENCIA},00.</p>
                  </div>

                  <div className="flex gap-2 pt-2 flex-wrap">
                    <Button onClick={() => aprovarNota(nota.id)}>
                      <CheckCircle2 className="w-4 h-4 mr-2" /> Aprovar e gerar cupons
                    </Button>
                    <Button variant="destructive" onClick={() => reprovarNota(nota.id)}>
                      <XCircle className="w-4 h-4 mr-2" /> Reprovar
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <img src={nota.imagemUrl} alt={`Nota fiscal ${nota.id}`} className="w-full h-72 object-cover rounded-md border" />
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="w-full">
                        <Expand className="w-4 h-4 mr-2" /> Ver em tela inteira
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-6xl w-[95vw]">
                      <DialogHeader>
                        <DialogTitle>Nota fiscal {nota.id}</DialogTitle>
                      </DialogHeader>
                      <img src={nota.imagemUrl} alt={`Nota fiscal ${nota.id} em tela inteira`} className="w-full max-h-[80vh] object-contain rounded-md border" />
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Histórico</CardTitle>
          <CardDescription>Notas que já saíram da fila de auditoria.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {finalizadas.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sem histórico ainda.</p>
          ) : (
            finalizadas.map((nota) => (
              <div key={nota.id} className="border rounded-md p-3 text-sm flex items-center justify-between gap-3">
                <div>
                  <p className="font-medium">{nota.id} • {nota.padaria}</p>
                  <p className="text-muted-foreground">
                    {nota.status === "aprovada" ? `Aprovada em ${formatBRL(nota.valorAprovado || 0)} • ${nota.cuponsGerados || 0} cupom(ns)` : "Reprovada"}
                  </p>
                </div>
                <Badge variant={nota.status === "aprovada" ? "default" : "destructive"}>{nota.status}</Badge>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
