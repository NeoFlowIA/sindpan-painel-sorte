import { useMemo } from "react";
import { CampaignCard, type Campaign } from "./CampaignCard";
import { Skeleton } from "@/components/ui/skeleton";
import { parseCampaignDate } from "./CampaignStatusBadge";

interface CampaignListProps {
  campaigns: Campaign[];
  isLoading?: boolean;
  onEdit?: (campaign: Campaign) => void;
}

export const CampaignList = ({ campaigns, isLoading, onEdit }: CampaignListProps) => {
  const hasCampaigns = campaigns.length > 0;

  const orderedCampaigns = useMemo(
    () =>
      [...campaigns].sort((a, b) => {
        const startA = parseCampaignDate(a.data_inicio)?.getTime() ?? 0;
        const startB = parseCampaignDate(b.data_inicio)?.getTime() ?? 0;
        return startB - startA;
      }),
    [campaigns]
  );

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <Skeleton key={index} className="h-48" />
        ))}
      </div>
    );
  }

  if (!hasCampaigns) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-primary/30 bg-primary/5 py-16 text-center">
        <p className="text-lg font-medium text-primary">Nenhuma campanha cadastrada.</p>
        <p className="text-sm text-muted-foreground">Clique em Criar campanha.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {orderedCampaigns.map((campaign) => (
        <CampaignCard key={campaign.id} campaign={campaign} onEdit={onEdit} />
      ))}
    </div>
  );
};

export default CampaignList;
