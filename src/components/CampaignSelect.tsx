import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Campaign } from "./CampaignCard";
import { CampaignStatusBadge, getCampaignStatus, parseCampaignDate } from "./CampaignStatusBadge";
import { format as formatDateFns } from "date-fns";

interface CampaignSelectProps {
  campaigns: Campaign[];
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  ariaLabel?: string;
}

const formatDate = (value?: string | null) => {
  const parsed = parseCampaignDate(value);
  return parsed ? formatDateFns(parsed, "dd/MM/yyyy") : "--";
};

export const CampaignSelect = ({
  campaigns,
  value,
  onChange,
  placeholder = "Selecione uma campanha",
  disabled,
  ariaLabel,
}: CampaignSelectProps) => {
  return (
    <Select value={value} onValueChange={onChange} disabled={disabled} aria-label={ariaLabel}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {campaigns.map((campaign) => {
          const status = getCampaignStatus(campaign.data_inicio, campaign.data_fim);

          return (
            <SelectItem key={campaign.id} value={campaign.id} className="py-2">
              <div className="flex flex-col gap-1">
                <span className="font-medium text-sm">{campaign.Nome}</span>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <CampaignStatusBadge dataInicio={campaign.data_inicio} dataFim={campaign.data_fim} />
                  <span>{`${formatDate(campaign.data_inicio)} • ${formatDate(campaign.data_fim)}`}</span>
                </div>
                {status === "Encerrada" && (
                  <span className="text-[11px] text-amber-600">Campanha encerrada — sorteios ainda podem ocorrer.</span>
                )}
              </div>
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
};

export default CampaignSelect;
