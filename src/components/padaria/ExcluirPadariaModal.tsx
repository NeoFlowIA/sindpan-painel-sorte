import React, { useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useDeletePadaria } from "@/hooks/usePadarias";
import { formatCNPJ } from "@/utils/formatters";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface ExcluirPadariaModalProps {
  children: React.ReactNode;
  padaria: {
    cnpj: string;
    nome: string;
  };
}

export function ExcluirPadariaModal({ children, padaria }: ExcluirPadariaModalProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const deletePadaria = useDeletePadaria();

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      
      await deletePadaria.mutateAsync({
        cnpj: padaria.cnpj
      });
      
      toast.success("Padaria excluída com sucesso!", {
        description: `${padaria.nome} foi removida do sistema.`,
      });
    } catch (error: any) {
      console.error('Error deleting padaria:', error);
      toast.error("Erro ao excluir padaria", {
        description: error.message || "Tente novamente ou contate o suporte.",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        {children}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            <p>
              Tem certeza que deseja excluir a padaria <strong>{padaria.nome}</strong>?
            </p>
            <p className="text-sm text-muted-foreground">
              CNPJ: {formatCNPJ(padaria.cnpj)}
            </p>
            <p className="text-sm text-red-600 font-medium">
              ⚠️ Esta ação não pode ser desfeita!
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isDeleting}
            className="bg-red-600 hover:bg-red-700"
          >
            {isDeleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Excluindo...
              </>
            ) : (
              "Excluir Padaria"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
