import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Plus, Eye, EyeOff, MessageCircle, Mail, Shuffle } from "lucide-react";
import { toast } from "sonner";
import { sindpanAuthApi, SindpanApiError } from "@/services/sindpanAuthApi";

const formSchema = z.object({
  // Required fields for API
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
  bakery_name: z.string().min(2, "Nome da padaria deve ter pelo menos 2 caracteres"),
  
  // Additional fields for internal use
  nomeFantasia: z.string().optional(),
  razaoSocial: z.string().optional(),
  cnpj: z.string().optional(),
  endereco: z.string().optional(),
  telefone: z.string().optional(),
  responsavel: z.string().optional(),
  ticketMedio: z.string().optional(),
  senhaAutomatica: z.boolean().default(false),
  enviarWhatsapp: z.boolean().default(false),
  enviarEmail: z.boolean().default(true),
  observacoes: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface CriarPadariaModalProps {
  children: React.ReactNode;
}

export function CriarPadariaModal({ children }: CriarPadariaModalProps) {
  const [open, setOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      // API required fields
      email: "",
      password: "",
      bakery_name: "",
      
      // Additional fields
      nomeFantasia: "",
      razaoSocial: "",
      cnpj: "",
      endereco: "",
      telefone: "",
      responsavel: "",
      ticketMedio: "",
      senhaAutomatica: false,
      enviarWhatsapp: false,
      enviarEmail: true,
      observacoes: "",
    },
  });

  const generatePassword = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$%";
    let password = "";
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  };

  const handleSenhaAutomaticaChange = (checked: boolean) => {
    form.setValue("senhaAutomatica", checked);
    if (checked) {
      const newPassword = generatePassword();
      form.setValue("password", newPassword);
    }
  };

  const onSubmit = async (data: FormData) => {
    try {
      setIsSubmitting(true);
      
      // Use bakery_name if provided, otherwise fall back to nomeFantasia
      const bakeryName = data.bakery_name || data.nomeFantasia || "";
      
      if (!data.email || !data.password || !bakeryName) {
        toast.error("Campos obrigatórios", {
          description: "Email, senha e nome da padaria são obrigatórios.",
        });
        return;
      }

      // Call SINDPAN Auth API to register the bakery
      const response = await sindpanAuthApi.register({
        email: data.email,
        password: data.password,
        bakery_name: bakeryName,
      });
      
      toast.success("Padaria criada com sucesso!", {
        description: `${bakeryName} foi cadastrada no sistema.`,
      });
      
      if (data.enviarEmail) {
        toast.info("Credenciais criadas", {
          description: `Credenciais de acesso criadas para ${data.email}`,
        });
      }
      
      if (data.enviarWhatsapp && data.telefone) {
        toast.info("Notificação pendente", {
          description: `Lembre-se de informar as credenciais via WhatsApp para ${data.telefone}`,
        });
      }
      
      setOpen(false);
      form.reset();
    } catch (error) {
      console.error("Error creating bakery:", error);
      
      let errorMessage = "Tente novamente ou contate o suporte.";
      
      if (error instanceof SindpanApiError) {
        if (error.status === 409) {
          errorMessage = "Este email já está cadastrado no sistema.";
        } else if (error.status === 400) {
          errorMessage = "Dados inválidos. Verifique os campos obrigatórios.";
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
          <DialogTitle className="flex items-center gap-2 text-primary">
            <Plus className="w-5 h-5" />
            Nova Padaria
          </DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* API Required Fields */}
            <div className="space-y-4 p-4 bg-primary/5 rounded-lg border border-primary/20">
              <h3 className="font-medium text-primary">Informações Básicas (Obrigatório)</h3>
              
              <FormField
                control={form.control}
                name="bakery_name"
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
            </div>

            {/* Additional Information */}
            <div className="space-y-4">
              <h3 className="font-medium text-muted-foreground">Informações Complementares (Opcional)</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="nomeFantasia"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome Fantasia</FormLabel>
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
                      <FormLabel>Razão Social</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Padaria Central Ltda" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
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
                name="responsavel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Responsável</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome do responsável" {...field} />
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
                      <Input placeholder="R$ 25,50" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>



            {/* Seção de Senha */}
            <div className="space-y-4 p-4 bg-muted/30 rounded-lg border">
              <h3 className="font-medium text-primary">Credenciais de Acesso</h3>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="senhaAutomatica"
                  checked={form.watch("senhaAutomatica")}
                  onCheckedChange={handleSenhaAutomaticaChange}
                />
                <Label htmlFor="senhaAutomatica" className="text-sm">
                  Gerar senha automaticamente
                </Label>
                {form.watch("senhaAutomatica") && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      const newPassword = generatePassword();
                      form.setValue("password", newPassword);
                    }}
                  >
                    <Shuffle className="w-4 h-4" />
                  </Button>
                )}
              </div>

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Senha *</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type={showPassword ? "text" : "password"}
                          placeholder="Digite a senha"
                          disabled={form.watch("senhaAutomatica")}
                          {...field}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-2 top-0 h-full px-2"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-2">
                <Label className="text-sm font-medium">Enviar credenciais via:</Label>
                <div className="flex flex-col space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="enviarEmail"
                      checked={form.watch("enviarEmail")}
                      onCheckedChange={(checked) => form.setValue("enviarEmail", !!checked)}
                    />
                    <Label htmlFor="enviarEmail" className="text-sm flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      Enviar por email
                    </Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="enviarWhatsapp"
                      checked={form.watch("enviarWhatsapp")}
                      onCheckedChange={(checked) => form.setValue("enviarWhatsapp", !!checked)}
                    />
                    <Label htmlFor="enviarWhatsapp" className="text-sm flex items-center gap-2">
                      <MessageCircle className="w-4 h-4" />
                      Enviar por WhatsApp
                    </Label>
                  </div>
                </div>
              </div>
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
                {isSubmitting ? "Criando..." : "Criar Padaria"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}