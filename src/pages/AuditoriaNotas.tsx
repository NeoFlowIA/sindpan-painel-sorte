import { useMemo, useState } from "react";
import { CheckCircle2, Clock3, Expand, ReceiptText, XCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  useAprovarAuditoria,
  useAuditoriasPendentes,
  useAuditoriasResolvidas,
  useRegisterAuditoria,
  useReprovarAuditoria,
  type Auditoria,
} from "@/hooks/useAuditoria";

const formatBRL = (centavos: number) => (centavos / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export default function AuditoriaNotas() {
  const [valorDigitado, setValorDigitado] = useState<Record<string, string>>({});
  const { data: pendentesData, isLoading } = useAuditoriasPendentes();
  const { data: resolvidasData } = useAuditoriasResolvidas();
  const registerAuditoria = useRegisterAuditoria();
  const aprovarAuditoria = useAprovarAuditoria();
  const reprovarAuditoria = useReprovarAuditoria();

  const pendentes = pendentesData?.auditoria || [];
  const finalizadas = resolvidasData?.auditoria || [];
  const aprovadasCount = useMemo(() => finalizadas.filter((n) => n.status === "aprovada_manual").length, [finalizadas]);
  const reprovadasCount = useMemo(() => finalizadas.filter((n) => n.status === "reprovada_manual").length, [finalizadas]);

  const aprovarNota = async (nota: Auditoria) => {
    const valorManual = valorDigitado[nota.id]?.trim();
    const valorCentavos = valorManual ? Math.round(Number(valorManual.replace(",", ".")) * 100) : nota.valor_centavos;

    if (
      nota.status !== "em_auditoria" ||
      !nota.cliente_id ||
      !nota.padaria_id ||
      !valorCentavos ||
      !nota.data_hora_nota ||
      !nota.padaria?.cnpj
    ) {
      toast.error("Auditoria incompleta para aprovação.");
      return;
    }

    try {
      const result = await registerAuditoria.mutateAsync({
        cliente: nota.cliente_id,
        padaria: nota.padaria_id,
        valor: valorCentavos,
        data: nota.data_hora_nota,
        cnpj: nota.padaria.cnpj,
        conf: 1.0,
        raw: "Aprovado manualmente via painel de auditoria",
        img: nota.foto_nota || "imagem indisponível",
      });

      await aprovarAuditoria.mutateAsync({ id: nota.id, now: new Date().toISOString() });
      toast.success(`Aprovada. ${result.register_receipt_basic.cupons_emitidos_agora} cupom(ns) gerado(s).`);
    } catch (error) {
      toast.error("Falha ao aprovar auditoria.");
    }
  };

  const reprovarNota = async (id: string) => {
    try {
      await reprovarAuditoria.mutateAsync({ id, now: new Date().toISOString() });
      toast.success("Nota reprovada e removida da fila de pendências.");
    } catch {
      toast.error("Falha ao reprovar auditoria.");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">Auditoria de Notas</h1>
        <p className="text-muted-foreground text-sm md:text-base">Valide notas fiscais enviadas pelas padarias e defina o valor final para processamento.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Pendentes</CardTitle></CardHeader><CardContent className="text-2xl font-bold">{pendentes.length}</CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Aprovadas</CardTitle></CardHeader><CardContent className="text-2xl font-bold">{aprovadasCount}</CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Reprovadas</CardTitle></CardHeader><CardContent className="text-2xl font-bold">{reprovadasCount}</CardContent></Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Fila de Auditoria (Pendentes)</CardTitle>
          <CardDescription>Ao aprovar, a nota sai da lista e segue para processamento de cupons.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? <p className="text-sm text-muted-foreground">Carregando auditorias...</p> : pendentes.length === 0 ? (
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
                  <p className="text-sm"><strong>Padaria:</strong> {nota.padaria?.nome || "-"}</p>
                  <p className="text-sm"><strong>Cliente:</strong> {nota.cliente?.nome || "-"}</p>
                  <p className="text-sm"><strong>Valor capturado:</strong> {nota.valor_centavos ? formatBRL(nota.valor_centavos) : "-"}</p>
                  <p className="text-xs text-muted-foreground">Enviada em {nota.data_hora_nota ? new Date(nota.data_hora_nota).toLocaleString("pt-BR") : "-"}</p>

                  <div className="pt-2 space-y-2">
                    <label className="text-sm font-medium">Valor validado pelo admin (R$)</label>
                    <Input
                      placeholder="Ex: 32,90"
                      value={valorDigitado[nota.id] || ""}
                      onChange={(e) => setValorDigitado((atual) => ({ ...atual, [nota.id]: e.target.value }))}
                    />
                  </div>

                  <div className="flex gap-2 pt-2 flex-wrap">
                    <Button onClick={() => aprovarNota(nota)} disabled={registerAuditoria.isPending || aprovarAuditoria.isPending}>
                      <CheckCircle2 className="w-4 h-4 mr-2" /> Aprovar e gerar cupons
                    </Button>
                    <Button variant="destructive" onClick={() => reprovarNota(nota.id)} disabled={reprovarAuditoria.isPending}>
                      <XCircle className="w-4 h-4 mr-2" /> Reprovar
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <img src={nota.foto_nota || "https://i.imgur.com/tc989yh.jpg"} alt={`Nota fiscal ${nota.id}`} className="w-full h-72 object-cover rounded-md border" />
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="w-full"><Expand className="w-4 h-4 mr-2" /> Ver em tela inteira</Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-6xl w-[95vw]">
                      <DialogHeader><DialogTitle>Nota fiscal {nota.id}</DialogTitle></DialogHeader>
                      <img src={nota.foto_nota || "https://i.imgur.com/tc989yh.jpg"} alt={`Nota fiscal ${nota.id} em tela inteira`} className="w-full max-h-[80vh] object-contain rounded-md border" />
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
                  <p className="font-medium">{nota.id} • {nota.padaria?.nome || "-"}</p>
                  <p className="text-muted-foreground">
                    {nota.status === "aprovada_manual" ? `Aprovada • Valor ${nota.valor_centavos ? formatBRL(nota.valor_centavos) : "-"}` : "Reprovada"}
                  </p>
                </div>
                <Badge variant={nota.status === "aprovada_manual" ? "default" : "destructive"}>{nota.status}</Badge>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
