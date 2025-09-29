import { useEffect, useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { formatStatusPagamento } from "@/utils";

interface PaymentDropdownProps {
  currentStatus: string;
  onStatusChange?: (newStatus: PaymentStatus) => Promise<void> | void;
}

export type PaymentStatus = "pago" | "em_aberto" | "atrasado";

const PAYMENT_STATUS_OPTIONS: Record<PaymentStatus, { label: string; className: string; variant: "default" | "outline" }> = {
  pago: {
    label: formatStatusPagamento("pago"),
    className: "border border-blue-200 bg-blue-100 text-blue-800",
    variant: "default"
  },
  em_aberto: {
    label: formatStatusPagamento("em_aberto"),
    className: "border border-orange-200 bg-orange-50 text-orange-600",
    variant: "outline"
  },
  atrasado: {
    label: formatStatusPagamento("atrasado"),
    className: "border border-red-200 bg-red-50 text-red-600",
    variant: "outline"
  }
};

const normalizeStatus = (value: string): PaymentStatus => {
  const normalized = value
    .toLowerCase()
    .replace(/\s+/g, "_");

  if (normalized === "pago") {
    return "pago";
  }

  if (normalized === "atrasado" || normalized === "cancelado" || normalized === "vencido") {
    return "atrasado";
  }

  return "em_aberto";
};

export function PaymentDropdown({ currentStatus, onStatusChange }: PaymentDropdownProps) {
  const [status, setStatus] = useState<PaymentStatus>(() => normalizeStatus(currentStatus));
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    setStatus((previous) => {
      const normalized = normalizeStatus(currentStatus);
      return previous === normalized ? previous : normalized;
    });
  }, [currentStatus]);

  const handleStatusChange = async (newStatus: string) => {
    const normalizedStatus = normalizeStatus(newStatus);

    if (normalizedStatus === status) return;

    try {
      setIsUpdating(true);

      if (onStatusChange) {
        await onStatusChange(normalizedStatus);
      }

      setStatus(normalizedStatus);
    } catch (error) {
      console.error(`Failed to update payment status to ${normalizedStatus}`, error);
    } finally {
      setIsUpdating(false);
    }
  };

  const getStatusBadge = (statusValue: string) => {
    const normalizedStatus = normalizeStatus(statusValue);
    const { label, className, variant } = PAYMENT_STATUS_OPTIONS[normalizedStatus];

    return (
      <Badge
        variant={variant}
        className={`cursor-pointer ${className}`.trim()}
      >
        {label}
      </Badge>
    );
  };

  return (
    <Select
      value={status}
      onValueChange={handleStatusChange}
      disabled={isUpdating}
    >
      <SelectTrigger className="w-full border-none p-0 h-auto bg-transparent focus:ring-0 focus:ring-offset-0">
        <SelectValue asChild>
          {getStatusBadge(status)}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {Object.entries(PAYMENT_STATUS_OPTIONS).map(([value, option]) => (
          <SelectItem key={value} value={value}>
            <Badge variant={option.variant} className={option.className}>
              {option.label}
            </Badge>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
