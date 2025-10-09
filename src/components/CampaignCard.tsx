import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CalendarRange, Pencil } from "lucide-react";
import { format as formatDateFns } from "date-fns";
import { CampaignStatusBadge, getCampaignStatus, parseCampaignDate } from "./CampaignStatusBadge";

export interface Campaign {
  id: string;
  Nome: string;
  data_inicio?: string | null;
  data_fim?: string | null;
  ativo?: boolean | null;
  cupomCount?: number;
}

const formatDate = (value?: string | null) => {
  try {
    if (!value) return "--";

    const parsed = parseCampaignDate(value);
    if (!parsed) {
      return "--";
    }

    return formatDateFns(parsed, "dd/MM/yyyy");
  } catch (error) {
    console.error("Erro ao formatar data da campanha", error);
    return "--";
  }
};

interface CampaignCardProps {
  campaign: Campaign;
  onEdit?: (campaign: Campaign) => void;
  onArchive?: (campaign: Campaign) => void;
}

export const CampaignCard = ({ campaign, onEdit, onArchive }: CampaignCardProps) => {
  const status = getCampaignStatus(campaign.data_inicio, campaign.data_fim);

  return (
    <Card className="border-primary/10 hover:border-primary/40 transition-colors">
      <CardHeader className="flex-row items-start justify-between gap-3">
        <div className="space-y-2">
          <CardTitle className="text-xl font-semibold text-primary flex items-center gap-2">
            <CalendarRange className="w-5 h-5" />
            {campaign.Nome}
          </CardTitle>
          <div className="flex flex-wrap items-center gap-2">
            <CampaignStatusBadge dataInicio={campaign.data_inicio} dataFim={campaign.data_fim} />
            {campaign.ativo === false && status !== "Encerrada" && (
              <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-700">
                Desativada
              </Badge>
            )}
            {campaign.ativo && status === "Ativa" && (
              <Badge className="bg-primary text-primary-foreground">Campanha atual</Badge>
            )}
          </div>
        </div>

        {onEdit && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEdit(campaign)}
            className="gap-2"
          >
            <Pencil className="w-4 h-4" />
            Editar
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div className="space-y-1">
            <p className="text-muted-foreground">Início</p>
            <p className="font-medium">{formatDate(campaign.data_inicio)}</p>
          </div>
          <div className="space-y-1">
            <p className="text-muted-foreground">Término</p>
            <p className="font-medium">{formatDate(campaign.data_fim)}</p>
          </div>
        </div>

        {typeof campaign.cupomCount === "number" && (
          <div className="rounded-md border border-primary/20 bg-primary/5 px-4 py-3 text-sm">
            <p className="text-muted-foreground">Cupons emitidos</p>
            <p className="text-lg font-semibold text-primary">{campaign.cupomCount}</p>
          </div>
        )}
      </CardContent>
      {onArchive && (
        <CardFooter>
          <Button variant="ghost" className="text-destructive" onClick={() => onArchive(campaign)}>
            Arquivar campanha
          </Button>
        </CardFooter>
      )}
    </Card>
  );
};

export default CampaignCard;
