import { useGraphQLMutation, useGraphQLQuery } from "./useGraphQL";
import {
  CREATE_ATENDENTE,
  DELETE_ATENDENTE,
  GET_ATENDENTES_BY_PADARIA,
  UPDATE_ATENDENTE,
} from "@/graphql/queries";

export interface Atendente {
  id: string;
  nome: string;
  padaria_id: string;
  created_at?: string;
  updated_at?: string;
}

export const useAtendentes = (padariaId: string) => {
  return useGraphQLQuery<{ atendentes: Atendente[] }>(
    ["atendentes", padariaId],
    GET_ATENDENTES_BY_PADARIA,
    { padaria_id: padariaId },
    { enabled: !!padariaId, staleTime: 60 * 1000 }
  );
};

export const useCreateAtendente = () => {
  return useGraphQLMutation<
    { insert_atendentes_one: Atendente },
    { atendente: { nome: string; padaria_id: string } }
  >(CREATE_ATENDENTE, {
    invalidateQueries: [["atendentes"]],
  });
};

export const useUpdateAtendente = () => {
  return useGraphQLMutation<
    { update_atendentes_by_pk: Atendente },
    { id: string; changes: { nome: string } }
  >(UPDATE_ATENDENTE, {
    invalidateQueries: [["atendentes"]],
  });
};

export const useDeleteAtendente = () => {
  return useGraphQLMutation<
    { delete_atendentes_by_pk: { id: string } },
    { id: string }
  >(DELETE_ATENDENTE, {
    invalidateQueries: [["atendentes"]],
  });
};
