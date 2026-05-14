import { useGraphQLMutation, useGraphQLQuery } from "./useGraphQL";
import {
  APROVAR_AUDITORIA,
  BUSCAR_AUDITORIA_PARA_APROVAR,
  GET_AUDITORIAS_PENDENTES,
  GET_AUDITORIAS_RESOLVIDAS,
  REGISTER_AUDITORIA,
  REPROVAR_AUDITORIA,
} from "@/graphql/queries";

export type Auditoria = {
  id: string;
  cliente_id: string | null;
  padaria_id: string | null;
  foto_nota: string | null;
  valor_centavos: number | null;
  data_hora_nota: string | null;
  status: string;
  tentativas?: number | null;
  updated_at?: string | null;
  padaria?: { id: string; nome: string; cnpj: string | null } | null;
  cliente?: { id: string; nome: string; whatsapp?: string | null; cpf?: string | null } | null;
};

export const useAuditoriasPendentes = () =>
  useGraphQLQuery<{ auditoria: Auditoria[] }>(["auditoria-pendentes"], GET_AUDITORIAS_PENDENTES, undefined, { staleTime: 30_000 });

export const useAuditoriasResolvidas = () =>
  useGraphQLQuery<{ auditoria: Auditoria[] }>(["auditoria-resolvidas"], GET_AUDITORIAS_RESOLVIDAS, undefined, { staleTime: 30_000 });

export const useBuscarAuditoriaParaAprovar = (id: string | null) =>
  useGraphQLQuery<{ auditoria_by_pk: Auditoria | null }>(["auditoria-by-id", id || ""], BUSCAR_AUDITORIA_PARA_APROVAR, { id }, { enabled: !!id });

export const useRegisterAuditoria = () =>
  useGraphQLMutation<
    { register_receipt_basic: { receipt_id: string; saldo_atual_centavos: number; cupons_emitidos_agora: number } },
    { cliente: string; padaria: string; valor: number; data: string; cnpj: string; conf: number; raw: string; img: string }
  >(REGISTER_AUDITORIA);

export const useAprovarAuditoria = () =>
  useGraphQLMutation<{ update_auditoria_by_pk: { id: string; status: string; updated_at: string } }, { id: string; now: string }>(APROVAR_AUDITORIA, {
    invalidateQueries: [["auditoria-pendentes"], ["auditoria-resolvidas"], ["auditoria-by-id"]],
  });

export const useReprovarAuditoria = () =>
  useGraphQLMutation<{ update_auditoria_by_pk: { id: string; status: string; updated_at: string } }, { id: string; now: string }>(REPROVAR_AUDITORIA, {
    invalidateQueries: [["auditoria-pendentes"], ["auditoria-resolvidas"], ["auditoria-by-id"]],
  });
