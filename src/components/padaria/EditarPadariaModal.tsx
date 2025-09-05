import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Edit } from "lucide-react";
import { toast } from "sonner";
import { useUpdatePadaria } from "@/hooks/usePadarias";
import { unformatCNPJ, unformatPhone } from "@/utils/formatters";

const formSchema = z.object({
  nomeFantasia: z.string().min(2, "Nome fantasia deve ter pelo menos 2 caracteres"),
  razaoSocial: z.string().min(2, "Razão social deve ter pelo menos 2 caracteres"),
  cnpj: z.string().min(14, "CNPJ deve ter 14 dígitos"),
  endereco: z.string().min(5, "Endereço deve ter pelo menos 5 caracteres"),
  telefone: z.string().min(10, "Telefone deve ter pelo menos 10 dígitos"),
  email: z.string().email("Email inválido"),
  responsavel: z.string().min(2, "Nome do responsável deve ter pelo menos 2 caracteres"),
  ticketMedio: z.string().min(1, "Ticket médio é obrigatório"),
  status: z.enum(["ativa", "pendente", "inativa"]),
  pagamento: z.enum(["pago", "em_aberto", "atrasado"]),
  observacoes: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface Bakery {
  name?: string;
  cnpj: string;
  address?: string;
  averageTicket?: string;
  status: string;
  payment?: string;
  // Novos campos da API Hasura
  nome?: string;
  endereco?: string;
  email?: string;
  telefone?: string;
  ticket_medio?: number;
  status_pagamento?: string;
}

interface EditarPadariaModalProps {
  children: React.ReactNode;
  bakery: Bakery;
  onUpdate?: (updatedBakery: Bakery) => void;
}

export function EditarPadariaModal({ children, bakery, onUpdate }: EditarPadariaModalProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Mutation para atualizar padaria
  const updatePadaria = useUpdatePadaria();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nomeFantasia: "",
      razaoSocial: "",
      cnpj: "",
      endereco: "",
      telefone: "",
      email: "",
      responsavel: "",
      ticketMedio: "",
      status: "ativa",
      pagamento: "em_aberto",
      observacoes: "",
    },
  });

  useEffect(() => {
    if (open && bakery) {
      form.reset({
        nomeFantasia: bakery.nome || bakery.name || "",
        razaoSocial: (bakery.nome || bakery.name || "") + " Ltda", // Mock data
        cnpj: bakery.cnpj,
        endereco: bakery.endereco || bakery.address || "",
        telefone: bakery.telefone || "(85) 99999-9999", // Mock data
        email: bakery.email || "contato@exemplo.com", // Mock data
        responsavel: "João Silva", // Mock data
        ticketMedio: bakery.ticket_medio?.toString() || bakery.averageTicket || "0",
        status: bakery.status as "ativa" | "pendente" | "inativa",
        pagamento: (bakery.status_pagamento || bakery.payment || "em_aberto") as "pago" | "em_aberto" | "atrasado",
        observacoes: "",
      });
    }
  }, [open, bakery, form]);

  const onSubmit = async (data: FormData) => {
    try {
      setIsSubmitting(true);
      
      // Preparar dados para a mutation
      const updateData = {
        nome: data.nomeFantasia,
        endereco: data.endereco,
        email: data.email,
        telefone: unformatPhone(data.telefone),
        ticket_medio: parseFloat(data.ticketMedio.replace(',', '.')),
        status: data.status, // Já está no formato correto
        status_pagamento: data.pagamento, // Já está no formato correto
      };

      // Executar mutation
      await updatePadaria.mutateAsync({
        cnpj: unformatCNPJ(bakery.cnpj),
        changes: updateData
      });
      
      toast.success("Padaria atualizada com sucesso!", {
        description: `${data.nomeFantasia} foi atualizada no sistema.`,
      });

      // Callback para compatibilidade
      if (onUpdate) {
        onUpdate({
          ...bakery,
          nome: data.nomeFantasia,
          endereco: data.endereco,
          email: data.email,
          telefone: data.telefone,
          ticket_medio: parseFloat(data.ticketMedio.replace(',', '.')),
          status: updateData.status,
          status_pagamento: updateData.status_pagamento,
        });
      }
      
      setOpen(false);
    } catch (error: unknown) {
      console.error('Error updating padaria:', error);
      toast.error("Erro ao atualizar padaria", {
        description: error instanceof Error ? error.message : "Tente novamente ou contate o suporte.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-primary">
            <Edit className="w-5 h-5" />
            Editar Padaria
          </DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="nomeFantasia"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome Fantasia *</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Padaria Central" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="razaoSocial"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Razão Social *</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Padaria Central Ltda" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="cnpj"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CNPJ *</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="00.000.000/0000-00" 
                        maxLength={18}
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="telefone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telefone/WhatsApp *</FormLabel>
                    <FormControl>
                      <Input placeholder="(00) 00000-0000" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="endereco"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Endereço Completo *</FormLabel>
                  <FormControl>
                    <Input placeholder="Rua, número, bairro, cidade - UF" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email *</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="contato@padaria.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="responsavel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Responsável *</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome do responsável" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="ticketMedio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ticket Médio *</FormLabel>
                    <FormControl>
                      <Input placeholder="R$ 25,50" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="ativa">Ativa</SelectItem>
                        <SelectItem value="pendente">Pendente</SelectItem>
                        <SelectItem value="inativa">Inativa</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="pagamento"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Pagamento *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Status do pagamento" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="pago">Pago</SelectItem>
                        <SelectItem value="em_aberto">Pendente</SelectItem>
                        <SelectItem value="atrasado">Atrasado</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="observacoes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observações</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Informações adicionais sobre a padaria..."
                      className="resize-none"
                      rows={3}
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setOpen(false)}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {isSubmitting ? "Salvando..." : "Salvar Alterações"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}