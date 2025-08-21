import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface PaymentDropdownProps {
  currentStatus: string;
  bakeryName: string;
  onStatusChange?: (newStatus: string) => void;
}

export function PaymentDropdown({ currentStatus, bakeryName, onStatusChange }: PaymentDropdownProps) {
  const [status, setStatus] = useState(currentStatus);
  const [isUpdating, setIsUpdating] = useState(false);

  const handleStatusChange = async (newStatus: string) => {
    if (newStatus === status) return;
    
    try {
      setIsUpdating(true);
      
      // Simular delay de API
      await new Promise(resolve => setTimeout(resolve, 800));
      
      setStatus(newStatus);
      
      toast.success("Status atualizado!", {
        description: `${bakeryName} - Pagamento: ${newStatus}`,
      });

      if (onStatusChange) {
        onStatusChange(newStatus);
      }
    } catch (error) {
      toast.error("Erro ao atualizar status", {
        description: "Tente novamente.",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const getStatusBadge = (statusValue: string) => {
    switch (statusValue) {
      case "pago":
        return (
          <Badge variant="concluido" className="cursor-pointer">
            pago
          </Badge>
        );
      case "pendente":
        return (
          <Badge variant="agendado" className="cursor-pointer">
            pendente
          </Badge>
        );
      case "cancelado":
        return (
          <Badge variant="nao-informado" className="cursor-pointer">
            cancelado
          </Badge>
        );
      case "em aberto":
        return (
          <Badge variant="agendado" className="cursor-pointer">
            pendente
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="cursor-pointer">
            {statusValue}
          </Badge>
        );
    }
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
        <SelectItem value="pago">
          <Badge variant="concluido">pago</Badge>
        </SelectItem>
        <SelectItem value="pendente">
          <Badge variant="agendado">pendente</Badge>
        </SelectItem>
        <SelectItem value="cancelado">
          <Badge variant="nao-informado">cancelado</Badge>
        </SelectItem>
      </SelectContent>
    </Select>
  );
}