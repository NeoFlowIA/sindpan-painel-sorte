import { Badge } from "@/components/ui/badge";

export type CampaignStatus = "Agendada" | "Ativa" | "Encerrada";

export interface CampaignStatusBadgeProps {
  dataInicio: string;
  dataFim: string;
  className?: string;
}

const parseCampaignDate = (value: string) => new Date(`${value}T00:00:00`);

export const getCampaignStatus = (dataInicio: string, dataFim: string, referenceDate = new Date()): CampaignStatus => {
  const start = parseCampaignDate(dataInicio);
  const end = parseCampaignDate(dataFim);

  if (referenceDate < start) {
    return "Agendada";
  }

  if (referenceDate > end) {
    return "Encerrada";
  }

  return "Ativa";
};

const statusStyles: Record<CampaignStatus, string> = {
  Agendada: "bg-blue-100 text-blue-800 border-blue-200",
  Ativa: "bg-green-100 text-green-800 border-green-200",
  Encerrada: "bg-amber-100 text-amber-900 border-amber-200",
};

export const CampaignStatusBadge = ({ dataInicio, dataFim, className }: CampaignStatusBadgeProps) => {
  const status = getCampaignStatus(dataInicio, dataFim);

  return (
    <Badge variant="outline" className={`${statusStyles[status]} ${className ?? ""}`.trim()}>
      {status}
    </Badge>
  );
};

export default CampaignStatusBadge;
