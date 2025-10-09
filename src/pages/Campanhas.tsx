import { useState } from "react";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { CampaignList } from "@/components/CampaignList";
import { CampaignFormDialog, type CampaignFormValues } from "@/components/CampaignFormDialog";
import type { Campaign } from "@/components/CampaignCard";
import { useGraphQLMutation, useGraphQLQuery } from "@/hooks/useGraphQL";
import { CREATE_CAMPANHA, LIST_CAMPANHAS, UPDATE_CAMPANHA } from "@/graphql/queries";
import { toast } from "sonner";

interface ListCampanhasResponse {
  campanha: Campaign[];
}

export default function Campanhas() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);

  const { data, isLoading } = useGraphQLQuery<ListCampanhasResponse>(['campanhas'], LIST_CAMPANHAS);
  const campaigns = data?.campanha ?? [];

  const {
    mutateAsync: createCampanha,
    isPending: isCreating,
  } = useGraphQLMutation(CREATE_CAMPANHA, {
    invalidateQueries: [['campanhas']],
    onSuccess: () => {
      toast.success('Campanha criada com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao criar campanha', { description: error.message });
    }
  });

  const {
    mutateAsync: updateCampanha,
    isPending: isUpdating,
  } = useGraphQLMutation(UPDATE_CAMPANHA, {
    invalidateQueries: [['campanhas']],
    onSuccess: () => {
      toast.success('Campanha atualizada com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao atualizar campanha', { description: error.message });
    }
  });

  const isSubmitting = isCreating || isUpdating;

  const handleCreateClick = () => {
    setEditingCampaign(null);
    setDialogOpen(true);
  };

  const handleEdit = (campaign: Campaign) => {
    setEditingCampaign(campaign);
    setDialogOpen(true);
  };

  const handleSubmit = async (values: CampaignFormValues) => {
    if (editingCampaign) {
      await updateCampanha({
        id: editingCampaign.id,
        set: {
          Nome: values.Nome,
          data_inicio: values.data_inicio,
          data_fim: values.data_fim,
        }
      });
    } else {
      await createCampanha({
        obj: {
          Nome: values.Nome,
          data_inicio: values.data_inicio,
          data_fim: values.data_fim,
        }
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-primary">Campanhas</h1>
          <p className="text-muted-foreground">Gerencie os períodos de emissão de cupons.</p>
        </div>
        <Button onClick={handleCreateClick} className="gap-2">
          <PlusCircle className="w-4 h-4" />
          Criar campanha
        </Button>
      </div>

      <CampaignList campaigns={campaigns} isLoading={isLoading} onEdit={handleEdit} />

      <CampaignFormDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) {
            setEditingCampaign(null);
          }
        }}
        onSubmit={handleSubmit}
        existingCampaigns={campaigns}
        initialData={editingCampaign ? { ...editingCampaign } : null}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}
