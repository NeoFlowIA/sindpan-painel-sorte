import { useState } from "react";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { CampaignList } from "@/components/CampaignList";
import { CampaignFormDialog, type CampaignFormValues } from "@/components/CampaignFormDialog";
import type { Campaign } from "@/components/CampaignCard";
import { useGraphQLMutation, useGraphQLQuery } from "@/hooks/useGraphQL";
import { CREATE_CAMPANHA, DEACTIVATE_CAMPANHAS, DEACTIVATE_CAMPANHA, ACTIVATE_CAMPANHA, DELETE_CAMPANHA, LIST_CAMPANHAS, UPDATE_CAMPANHA } from "@/graphql/queries";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ListCampanhasResponse {
  campanha: Campaign[];
}

export default function Campanhas() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);
  const [deactivateDialogOpen, setDeactivateDialogOpen] = useState(false);
  const [activateDialogOpen, setActivateDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [campaignToDeactivate, setCampaignToDeactivate] = useState<Campaign | null>(null);
  const [campaignToActivate, setCampaignToActivate] = useState<Campaign | null>(null);
  const [campaignToDelete, setCampaignToDelete] = useState<Campaign | null>(null);

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
    mutateAsync: deactivateCampaigns,
    isPending: isDeactivating,
  } = useGraphQLMutation(DEACTIVATE_CAMPANHAS, {
    invalidateQueries: [['campanhas']],
    onSuccess: () => {
      toast.success('Campanha anterior desativada.');
    },
    onError: (error) => {
      toast.error('Não foi possível desativar a campanha anterior', { description: error.message });
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

  const {
    mutateAsync: deactivateCampanha,
    isPending: isDeactivatingSingle,
  } = useGraphQLMutation(DEACTIVATE_CAMPANHA, {
    invalidateQueries: [['campanhas'], ['campanha-ativa']],
    onSuccess: () => {
      toast.success('Campanha desativada com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao desativar campanha', { description: error.message });
    }
  });

  const {
    mutateAsync: activateCampanha,
    isPending: isActivatingSingle,
  } = useGraphQLMutation(ACTIVATE_CAMPANHA, {
    invalidateQueries: [['campanhas'], ['campanha-ativa']],
    onSuccess: () => {
      toast.success('Campanha ativada com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao ativar campanha', { description: error.message });
    }
  });

  const {
    mutateAsync: deleteCampanha,
    isPending: isDeleting,
  } = useGraphQLMutation(DELETE_CAMPANHA, {
    invalidateQueries: [['campanhas'], ['campanha-ativa']],
    onSuccess: () => {
      toast.success('Campanha excluída com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao excluir campanha', { description: error.message });
    }
  });

  const isSubmitting = isCreating || isUpdating || isDeactivating || isDeactivatingSingle || isActivatingSingle || isDeleting;

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
          ativo: true,
        }
      });
    }
  };

  const handleDeactivate = (campaign: Campaign) => {
    setCampaignToDeactivate(campaign);
    setDeactivateDialogOpen(true);
  };

  const confirmDeactivate = async () => {
    if (!campaignToDeactivate) return;
    await deactivateCampanha({ id: parseInt(campaignToDeactivate.id) });
    setDeactivateDialogOpen(false);
    setCampaignToDeactivate(null);
  };

  const handleActivate = (campaign: Campaign) => {
    setCampaignToActivate(campaign);
    setActivateDialogOpen(true);
  };

  const confirmActivate = async () => {
    if (!campaignToActivate) return;
    
    // Primeiro, desativar todas as campanhas ativas
    const activeCampaignIds = campaigns
      .filter((c) => c.ativo && c.id !== campaignToActivate.id)
      .map((c) => parseInt(c.id));
    
    if (activeCampaignIds.length > 0) {
      await deactivateCampaigns({ ids: activeCampaignIds });
    }
    
    // Depois, ativar a campanha selecionada
    await activateCampanha({ id: parseInt(campaignToActivate.id) });
    setActivateDialogOpen(false);
    setCampaignToActivate(null);
  };

  const handleDelete = (campaign: Campaign) => {
    setCampaignToDelete(campaign);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!campaignToDelete) return;
    await deleteCampanha({ id: parseInt(campaignToDelete.id) });
    setDeleteDialogOpen(false);
    setCampaignToDelete(null);
  };

  const handleResolveConflicts = async ({
    conflicts,
  }: {
    values: CampaignFormValues;
    conflicts: { overlaps: Campaign[]; duplicates: Campaign[] };
  }) => {
    const activeCampaignIds = conflicts.overlaps
      .filter((campaign) => campaign.ativo)
      .map((campaign) => campaign.id);

    if (activeCampaignIds.length === 0) {
      return true;
    }

    await deactivateCampaigns({ ids: activeCampaignIds });
    return true;
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

      <CampaignList 
        campaigns={campaigns} 
        isLoading={isLoading} 
        onEdit={handleEdit}
        onDeactivate={handleDeactivate}
        onActivate={handleActivate}
        onDelete={handleDelete}
      />

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
        initialData={
          editingCampaign
            ? {
                id: editingCampaign.id,
                Nome: editingCampaign.Nome,
                data_inicio: editingCampaign.data_inicio ?? "",
                data_fim: editingCampaign.data_fim ?? "",
              }
            : null
        }
        isSubmitting={isSubmitting}
        onResolveConflicts={handleResolveConflicts}
      />

      {/* Dialog de confirmação para desativar */}
      <AlertDialog open={deactivateDialogOpen} onOpenChange={setDeactivateDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Desativar campanha?</AlertDialogTitle>
            <AlertDialogDescription>
              A campanha "{campaignToDeactivate?.Nome}" será desativada e não permitirá mais a emissão de novos cupons.
              Os cupons já emitidos continuarão válidos para sorteios.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeactivate} disabled={isSubmitting}>
              {isDeactivatingSingle ? 'Desativando...' : 'Desativar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog de confirmação para ativar */}
      <AlertDialog open={activateDialogOpen} onOpenChange={setActivateDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Ativar campanha?</AlertDialogTitle>
            <AlertDialogDescription>
              A campanha "{campaignToActivate?.Nome}" será ativada e permitirá a emissão de novos cupons dentro do período definido.
              <strong className="block mt-2 text-amber-600">
                ⚠️ ATENÇÃO: Outras campanhas ativas serão desativadas automaticamente, pois apenas uma campanha pode estar ativa por vez!
              </strong>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmActivate} disabled={isSubmitting}>
              {isSubmitting ? 'Ativando...' : 'Ativar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog de confirmação para excluir */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir campanha permanentemente?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. A campanha "{campaignToDelete?.Nome}" será excluída permanentemente do sistema.
              <strong className="block mt-2 text-destructive">
                ⚠️ ATENÇÃO: Todos os cupons vinculados a esta campanha também serão afetados!
              </strong>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete} 
              disabled={isSubmitting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Excluindo...' : 'Excluir permanentemente'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
