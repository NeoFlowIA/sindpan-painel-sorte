import { useEffect, useId, useMemo, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { CalendarPlus } from "lucide-react";
import type { Campaign } from "./CampaignCard";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from "@/components/ui/alert-dialog";

const campaignFormSchema = z
  .object({
    Nome: z
      .string({ required_error: "Informe o nome da campanha." })
      .trim()
      .min(1, "Informe o nome da campanha."),
    data_inicio: z.string({ required_error: "Informe a data de início." }).min(1, "Informe a data de início."),
    data_fim: z.string({ required_error: "Informe a data de término." }).min(1, "Informe a data de término."),
  })
  .superRefine((data, ctx) => {
    const inicio = new Date(`${data.data_inicio}T00:00:00`);
    const fim = new Date(`${data.data_fim}T00:00:00`);

    if (inicio > fim) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "A data de início deve ser anterior ou igual à data de término.",
        path: ["data_fim"],
      });
    }
  });

export type CampaignFormValues = z.infer<typeof campaignFormSchema>;

interface CampaignFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: CampaignFormValues) => Promise<void> | void;
  initialData?: (CampaignFormValues & { id?: string }) | null;
  existingCampaigns?: Campaign[];
  isSubmitting?: boolean;
  onResolveConflicts?: (args: {
    values: CampaignFormValues;
    conflicts: { overlaps: Campaign[]; duplicates: Campaign[] };
  }) => Promise<boolean | void> | boolean | void;
}

const defaultValues: CampaignFormValues = {
  Nome: "",
  data_inicio: "",
  data_fim: "",
};

const toDate = (value?: string | null) => {
  if (!value) return null;

  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
};

export const CampaignFormDialog = ({
  open,
  onOpenChange,
  onSubmit,
  initialData,
  existingCampaigns = [],
  isSubmitting,
  onResolveConflicts,
}: CampaignFormDialogProps) => {
  const form = useForm<CampaignFormValues>({
    resolver: zodResolver(campaignFormSchema),
    defaultValues,
  });

  const nomeInputRef = useRef<HTMLInputElement | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [pendingValues, setPendingValues] = useState<CampaignFormValues | null>(null);
  const [conflictCampaigns, setConflictCampaigns] = useState<{ overlaps: Campaign[]; duplicates: Campaign[] } | null>(
    null
  );

  const inicioHelpId = useId();
  const fimHelpId = useId();

  const title = initialData?.id ? "Editar campanha" : "Criar campanha";
  const submitLabel = initialData?.id ? "Salvar alterações" : "Criar campanha";

  useEffect(() => {
    if (open) {
      form.reset(initialData ? { Nome: initialData.Nome, data_inicio: initialData.data_inicio, data_fim: initialData.data_fim } : defaultValues);
      setTimeout(() => nomeInputRef.current?.focus(), 50);
    } else {
      form.reset(initialData ? { Nome: initialData.Nome, data_inicio: initialData.data_inicio, data_fim: initialData.data_fim } : defaultValues);
      setPendingValues(null);
      setConflictCampaigns(null);
      setConfirming(false);
    }
  }, [open, initialData, form]);

  const sanitizedCampaigns = useMemo(
    () => existingCampaigns.filter((campaign) => !(initialData?.id && campaign.id === initialData.id)),
    [existingCampaigns, initialData?.id]
  );

  const checkConflicts = (values: CampaignFormValues) => {
    const newStart = toDate(values.data_inicio);
    const newEnd = toDate(values.data_fim);

    if (!newStart || !newEnd) {
      return { overlaps: [], duplicates: [] };
    }

    const overlappingByDate = sanitizedCampaigns.filter((campaign) => {
      const existingStart = toDate(campaign.data_inicio);
      const existingEnd = toDate(campaign.data_fim);

      if (!existingStart || !existingEnd) {
        return false;
      }

      return newStart <= existingEnd && newEnd >= existingStart;
    });

    const activeCampaigns = sanitizedCampaigns.filter((campaign) => campaign.ativo);

    const overlapMap = new Map<string, Campaign>();
    overlappingByDate.forEach((campaign) => overlapMap.set(campaign.id, campaign));
    activeCampaigns.forEach((campaign) => overlapMap.set(campaign.id, campaign));

    const overlaps = Array.from(overlapMap.values());

    const targetName = values.Nome.trim().toLowerCase();
    const targetYear = newStart.getFullYear();

    const duplicates = sanitizedCampaigns.filter((campaign) => {
      const campaignStart = toDate(campaign.data_inicio);
      if (!campaignStart) {
        return false;
      }
      const campaignYear = campaignStart.getFullYear();
      return campaign.Nome.trim().toLowerCase() === targetName && campaignYear === targetYear;
    });

    return { overlaps, duplicates };
  };

  const handleSubmit = async (values: CampaignFormValues) => {
    const trimmedValues: CampaignFormValues = {
      ...values,
      Nome: values.Nome.trim(),
    };

    const conflicts = checkConflicts(trimmedValues);

    if (conflicts.overlaps.length > 0 || conflicts.duplicates.length > 0) {
      setPendingValues(trimmedValues);
      setConflictCampaigns(conflicts);
      setConfirming(true);
      return;
    }

    await submitValues(trimmedValues);
  };

  const submitValues = async (values: CampaignFormValues) => {
    try {
      await onSubmit(values);
      onOpenChange(false);
    } catch (error) {
      console.error("Erro ao salvar campanha", error);
    }
  };

  const handleConfirm = async () => {
    if (!pendingValues) return;

    try {
      if (conflictCampaigns && onResolveConflicts) {
        const shouldContinue = await onResolveConflicts({
          values: pendingValues,
          conflicts: conflictCampaigns,
        });

        if (shouldContinue === false) {
          return;
        }
      }

      await submitValues(pendingValues);
      setPendingValues(null);
      setConflictCampaigns(null);
      setConfirming(false);
    } catch (error) {
      console.error("Erro ao resolver conflitos antes de salvar campanha", error);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-primary">
              <CalendarPlus className="w-5 h-5" />
              {title}
            </DialogTitle>
            <DialogDescription>
              Defina o período em que a campanha estará ativa para emissão de cupons.
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="Nome"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome da campanha</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Natal 2025"
                        ref={(element) => {
                          field.ref(element);
                          nomeInputRef.current = element;
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="data_inicio"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data de início</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="date"
                          aria-describedby={inicioHelpId}
                        />
                      </FormControl>
                      <p id={inicioHelpId} className="text-xs text-muted-foreground">
                        Escolha quando a campanha começa.
                      </p>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="data_fim"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data de término</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="date"
                          aria-describedby={fimHelpId}
                        />
                      </FormControl>
                      <p id={fimHelpId} className="text-xs text-muted-foreground">
                        Último dia para emissão de cupons.
                      </p>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Salvando..." : submitLabel}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={confirming}
        onOpenChange={(next) => {
          setConfirming(next);
          if (!next) {
            setPendingValues(null);
            setConflictCampaigns(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar criação da campanha?</AlertDialogTitle>
            <AlertDialogDescription>
              {conflictCampaigns?.overlaps.length
                ? conflictCampaigns.overlaps.some((campaign) => campaign.ativo)
                  ? "Existe uma campanha marcada como ativa no mesmo período. Você pode editar a existente ou confirmar para desativá-la automaticamente antes de criar a nova."
                  : "Existe sobreposição de datas com outra campanha. Confirme apenas se deseja manter ambas registradas."
                : "Já existe uma campanha com este nome neste ano."}
            </AlertDialogDescription>
          </AlertDialogHeader>

          {conflictCampaigns && (
            <div className="space-y-3 rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
              {conflictCampaigns.overlaps.length > 0 && (
                <div>
                  <p className="font-medium">Campanhas com período semelhante:</p>
                  <ul className="list-disc pl-4 mt-1 space-y-1">
                    {conflictCampaigns.overlaps.map((campaign) => (
                      <li key={campaign.id}>{campaign.Nome}</li>
                    ))}
                  </ul>
                </div>
              )}

              {conflictCampaigns.duplicates.length > 0 && (
                <div>
                  <p className="font-medium">Campanhas com o mesmo nome no ano selecionado:</p>
                  <ul className="list-disc pl-4 mt-1 space-y-1">
                    {conflictCampaigns.duplicates.map((campaign) => (
                      <li key={campaign.id}>{campaign.Nome}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setPendingValues(null);
                setConflictCampaigns(null);
              }}
            >
              Voltar
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirm} disabled={isSubmitting}>
              Confirmar mesmo assim
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default CampaignFormDialog;
