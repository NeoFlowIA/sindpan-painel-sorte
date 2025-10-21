import { Badge } from "@/components/ui/badge";
import { endOfDay, isValid, parseISO, startOfDay } from "date-fns";

export type CampaignStatus = "Agendada" | "Ativa" | "Encerrada";

export interface CampaignStatusBadgeProps {
  dataInicio?: string | null;
  dataFim?: string | null;
  className?: string;
}

export const parseCampaignDate = (value?: string | null) => {
  if (!value) return null;

  const parsed = parseISO(value);
  return isValid(parsed) ? parsed : null;
};

export const getCampaignStatus = (
  dataInicio?: string | null,
  dataFim?: string | null,
  referenceDate = new Date()
): CampaignStatus => {
  const start = parseCampaignDate(dataInicio);
  const end = parseCampaignDate(dataFim);

  if (!start || !end) {
    return "Agendada";
  }

  const periodStart = startOfDay(start);
  const periodEnd = endOfDay(end);

  if (referenceDate < periodStart) {
    return "Agendada";
  }

  if (referenceDate > periodEnd) {
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
