import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CalendarRange, Pencil, Ban, Trash2, CheckCircle } from "lucide-react";
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
  onDeactivate?: (campaign: Campaign) => void;
  onActivate?: (campaign: Campaign) => void;
  onDelete?: (campaign: Campaign) => void;
}

export const CampaignCard = ({ campaign, onEdit, onArchive, onDeactivate, onActivate, onDelete }: CampaignCardProps) => {
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
            {/* Se campanha está desativada, mostrar apenas badge Desativada */}
            {campaign.ativo === false ? (
              <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-700">
                Desativada
              </Badge>
            ) : (
              <>
                {/* Se está ativa, mostrar status baseado nas datas */}
                <CampaignStatusBadge dataInicio={campaign.data_inicio} dataFim={campaign.data_fim} />
                {status === "Ativa" && (
                  <Badge className="bg-primary text-primary-foreground">Campanha atual</Badge>
                )}
              </>
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
      {(onArchive || onDeactivate || onActivate || onDelete) && (
        <CardFooter className="flex gap-2">
          {onArchive && (
            <Button variant="ghost" className="text-muted-foreground" onClick={() => onArchive(campaign)}>
              Arquivar campanha
            </Button>
          )}
          {onActivate && !campaign.ativo && (
            <Button variant="outline" className="gap-2 text-green-600 hover:text-green-700 hover:bg-green-50" onClick={() => onActivate(campaign)}>
              <CheckCircle className="w-4 h-4" />
              Ativar
            </Button>
          )}
          {onDeactivate && campaign.ativo && (
            <Button variant="outline" className="gap-2 text-amber-600 hover:text-amber-700 hover:bg-amber-50" onClick={() => onDeactivate(campaign)}>
              <Ban className="w-4 h-4" />
              Desativar
            </Button>
          )}
          {onDelete && (
            <Button variant="outline" className="gap-2 text-destructive hover:bg-destructive hover:text-destructive-foreground" onClick={() => onDelete(campaign)}>
              <Trash2 className="w-4 h-4" />
              Excluir
            </Button>
          )}
        </CardFooter>
      )}
    </Card>
  );
};

export default CampaignCard;
