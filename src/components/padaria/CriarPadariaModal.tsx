import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { useCreatePadaria } from "@/hooks/usePadarias";
import { unformatCNPJ, unformatPhone, applyCNPJMask, applyPhoneMask } from "@/utils/formatters";

const formSchema = z.object({
  nome: z.string().min(2, "Nome da padaria deve ter pelo menos 2 caracteres"),
  cnpj: z.string().min(14, "CNPJ deve ter 14 dígitos"),
  endereco: z.string().min(5, "Endereço deve ter pelo menos 5 caracteres"),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  telefone: z.string().optional(),
  ticketMedio: z.string().optional(),
  status: z.enum(["ativa", "pendente", "inativa"]).default("ativa"),
  statusPagamento: z.enum(["pago", "em_aberto", "atrasado"]).default("em_aberto"),
  observacoes: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface CriarPadariaModalProps {
  children: React.ReactNode;
}

export function CriarPadariaModal({ children }: CriarPadariaModalProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const createPadaria = useCreatePadaria();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nome: "",
      cnpj: "",
      endereco: "",
      email: "",
      telefone: "",
      ticketMedio: "",
      status: "ativa",
      statusPagamento: "em_aberto",
      observacoes: "",
    },
  });

  const onSubmit = async (data: FormData) => {
    try {
      setIsSubmitting(true);
      
      if (!data.nome || !data.cnpj || !data.endereco) {
        toast.error("Campos obrigatórios", {
          description: "Nome, CNPJ e endereço são obrigatórios.",
        });
        return;
      }

      // Criar apenas na tabela padarias
      await createPadaria.mutateAsync({
        padaria: {
          cnpj: unformatCNPJ(data.cnpj),
          nome: data.nome,
          email: data.email || null,
          endereco: data.endereco,
          telefone: data.telefone ? unformatPhone(data.telefone) : null,
          status: data.status,
          status_pagamento: data.statusPagamento,
          ticket_medio: data.ticketMedio ? parseFloat(data.ticketMedio.replace(',', '.')) : 0,
        }
      });
      
      toast.success("Padaria criada com sucesso!", {
        description: `${data.nome} foi cadastrada no sistema.`,
      });
      
      toast.info("Próximo passo", {
        description: "A padaria poderá criar sua conta de acesso através do portal de cadastro.",
      });
      
      setOpen(false);
      form.reset();
    } catch (error: any) {
      console.error("Error creating bakery:", error);
      
      let errorMessage = "Tente novamente ou contate o suporte.";
      
      if (error.message) {
        if (error.message.includes('duplicate') || error.message.includes('already exists')) {
          errorMessage = "Este CNPJ já está cadastrado no sistema.";
        } else {
          errorMessage = error.message;
        }
      }
      
      toast.error("Erro ao criar padaria", {
        description: errorMessage,
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
          <DialogTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Adicionar Nova Padaria
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Informações Básicas */}
            <div className="space-y-4 p-4 bg-primary/5 rounded-lg border border-primary/20">
              <h3 className="font-medium text-primary">Informações Básicas</h3>
              
              <FormField
                control={form.control}
                name="nome"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome da Padaria *</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Padaria Pão Quente" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

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
                          value={field.value}
                          onChange={(e) => {
                            const maskedValue = applyCNPJMask(e.target.value);
                            field.onChange(maskedValue);
                          }}
                          maxLength={18}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="contato@padaria.com" {...field} />
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
                    <FormLabel>Endereço *</FormLabel>
                    <FormControl>
                      <Input placeholder="Rua, número, bairro, cidade" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="telefone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Telefone</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="(85) 99999-9999" 
                          value={field.value}
                          onChange={(e) => {
                            const maskedValue = applyPhoneMask(e.target.value);
                            field.onChange(maskedValue);
                          }}
                          maxLength={14}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="ticketMedio"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ticket Médio</FormLabel>
                      <FormControl>
                        <Input placeholder="25,00" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Status e Configurações */}
            <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-medium text-gray-700">Status e Configurações</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
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
                  name="statusPagamento"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status de Pagamento</FormLabel>
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
                        rows={3}
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-2 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setOpen(false)}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Criando..." : "Criar Padaria"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}