import { useMemo, useState } from "react";
import { CheckCircle2, Clock3, Expand, ReceiptText, XCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { graphqlClient } from "@/lib/graphql-client";
import { GET_PADARIA_BY_CNPJ } from "@/graphql/queries";
import {
  useAprovarAuditoria,
  useAuditoriasPendentes,
  useAuditoriasResolvidas,
  useRegisterAuditoria,
  useReprovarAuditoria,
  type Auditoria,
} from "@/hooks/useAuditoria";

const formatBRL = (centavos: number) => (centavos / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const toDatetimeLocal = (iso?: string | null) => {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 16);
};

const parseValorToCentavos = (valor: string): number | null => {
  const onlyDigitsAndSeparators = valor.replace(/\s/g, "").replace(/[^\d,.-]/g, "");
  if (!onlyDigitsAndSeparators) return null;

  // pt-BR: remove separador de milhar e converte vírgula decimal
  const normalized = onlyDigitsAndSeparators.replace(/\./g, "").replace(",", ".");
  const numberValue = Number(normalized);
  if (!Number.isFinite(numberValue) || numberValue <= 0) return null;

  return Math.round(numberValue * 100);
};

const getNotaImageSrc = (fotoNota?: string | null) => {
  if (!fotoNota) return "https://i.imgur.com/tc989yh.jpg";
  if (fotoNota.startsWith("data:image")) return fotoNota;
  if (fotoNota.startsWith("http://") || fotoNota.startsWith("https://")) return fotoNota;
  return `data:image/jpeg;base64,${fotoNota}`;
};

export default function AuditoriaNotas() {
  const [valorDigitado, setValorDigitado] = useState<Record<string, string>>({});
  const [cnpjDigitado, setCnpjDigitado] = useState<Record<string, string>>({});
  const [dataDigitada, setDataDigitada] = useState<Record<string, string>>({});

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
    const valorCentavos = valorManual ? parseValorToCentavos(valorManual) : nota.valor_centavos;
    let padariaIdFinal = nota.padaria_id || nota.padaria?.id || "";
    const cnpjFinal = (cnpjDigitado[nota.id] ?? nota.padaria?.cnpj ?? "").trim();
    const dataFinalLocal = dataDigitada[nota.id] ?? toDatetimeLocal(nota.data_hora_nota);
    const dataDate = dataFinalLocal ? new Date(dataFinalLocal) : null;
    const dataFinalISO = dataDate && !Number.isNaN(dataDate.getTime()) ? dataDate.toISOString() : "";

    // fallback: resolver padaria pelo CNPJ quando padaria_id não vier na auditoria
    if (!padariaIdFinal && cnpjFinal) {
      try {
        const resp = await graphqlClient.query<{ padarias: Array<{ id: string }> }>(GET_PADARIA_BY_CNPJ, { cnpj: cnpjFinal });
        padariaIdFinal = resp?.padarias?.[0]?.id || "";
      } catch {}
    }

    const missing: string[] = [];
    if (!nota.cliente_id) missing.push("cliente");
    if (!padariaIdFinal) missing.push("padaria (id não encontrado para o CNPJ informado)");
    if (!valorCentavos) missing.push("valor");
    if (!dataFinalISO) missing.push("data/hora");
    if (!cnpjFinal) missing.push("CNPJ");
    if (nota.status !== "em_auditoria") missing.push(`status (${nota.status || "vazio"})`);

    if (missing.length > 0) {
      toast.error(`Não foi possível aprovar. Verifique: ${missing.join(", ")}.`);
      return;
    }

    try {
      const result = await registerAuditoria.mutateAsync({
        cliente: nota.cliente_id,
        padaria: padariaIdFinal,
        valor: valorCentavos,
        data: dataFinalISO,
        cnpj: cnpjFinal,
        conf: 1.0,
        raw: "Aprovado manualmente via painel de auditoria",
        img: nota.foto_nota || "imagem indisponível",
      });

      const registerPayload = Array.isArray((result as any)?.register_receipt_basic)
        ? (result as any).register_receipt_basic[0]
        : (result as any)?.register_receipt_basic;
      const cuponsGerados = Number(registerPayload?.cupons_emitidos_agora ?? 0);

      await aprovarAuditoria.mutateAsync({ id: nota.id, now: new Date().toISOString() });
      toast.success(`Aprovada. ${cuponsGerados} cupom(ns) gerado(s).`);
    } catch {
      toast.error("Falha ao aprovar auditoria.");
    }
  };

  const reprovarNota = async (id: string) => {
    try {
      await reprovarAuditoria.mutateAsync({ id, now: new Date().toISOString() });
      toast.success("Nota reprovada.");
    } catch {
      toast.error("Falha ao reprovar auditoria.");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">Auditoria de Notas</h1>
        <p className="text-muted-foreground text-sm md:text-base">Valide os dados obrigatórios da nota para geração de cupons e números da sorte.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Pendentes</CardTitle></CardHeader><CardContent className="text-2xl font-bold">{pendentes.length}</CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Aprovadas</CardTitle></CardHeader><CardContent className="text-2xl font-bold">{aprovadasCount}</CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Reprovadas</CardTitle></CardHeader><CardContent className="text-2xl font-bold">{reprovadasCount}</CardContent></Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Fila de Auditoria (Pendentes)</CardTitle>
          <CardDescription>Campos obrigatórios para aprovação: valor, data/hora da compra e CNPJ.</CardDescription>
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
                  <p className="text-sm"><strong>Valor extraído:</strong> {nota.valor_centavos ? formatBRL(nota.valor_centavos) : "-"}</p>

                  <div className="pt-2 space-y-2">
                    <label className="text-sm font-medium">Valor validado (R$)</label>
                    <Input placeholder="Ex: 32,90" value={valorDigitado[nota.id] ?? (nota.valor_centavos ? String(nota.valor_centavos / 100).replace('.', ',') : "")} onChange={(e) => setValorDigitado((a) => ({ ...a, [nota.id]: e.target.value }))} />

                    <label className="text-sm font-medium">Data e hora da compra</label>
                    <Input type="datetime-local" value={dataDigitada[nota.id] ?? toDatetimeLocal(nota.data_hora_nota)} onChange={(e) => setDataDigitada((a) => ({ ...a, [nota.id]: e.target.value }))} />

                    <label className="text-sm font-medium">CNPJ validado</label>
                    <Input placeholder="Somente números ou formatado" value={cnpjDigitado[nota.id] ?? (nota.padaria?.cnpj || "")} onChange={(e) => setCnpjDigitado((a) => ({ ...a, [nota.id]: e.target.value }))} />
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
                  <img src={getNotaImageSrc(nota.foto_nota)} alt={`Nota fiscal ${nota.id}`} className="w-full h-72 object-cover rounded-md border" />
                  <Dialog>
                    <DialogTrigger asChild><Button variant="outline" className="w-full"><Expand className="w-4 h-4 mr-2" /> Ver em tela inteira</Button></DialogTrigger>
                    <DialogContent className="max-w-6xl w-[95vw]"><DialogHeader><DialogTitle>Nota fiscal {nota.id}</DialogTitle></DialogHeader><img src={getNotaImageSrc(nota.foto_nota)} alt={`Nota fiscal ${nota.id} em tela inteira`} className="w-full max-h-[80vh] object-contain rounded-md border" /></DialogContent>
                  </Dialog>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
