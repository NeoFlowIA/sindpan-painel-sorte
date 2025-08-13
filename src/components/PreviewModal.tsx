import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Monitor, Play } from "lucide-react";
import { useState } from "react";
import { CinematicPresentation } from "./CinematicPresentation";

interface PreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const mockParticipants = [
  { name: "João Silva Santos", cpf: "***456", bakery: "Padaria Central" },
  { name: "Maria Oliveira", cpf: "***789", bakery: "Pão Dourado" },
  { name: "Carlos Eduardo", cpf: "***123", bakery: "Delícias do Forno" }
];

export function PreviewModal({ isOpen, onClose }: PreviewModalProps) {
  const [showPreview, setShowPreview] = useState(false);

  const startPreview = () => {
    setShowPreview(true);
  };

  const closePreview = () => {
    setShowPreview(false);
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Monitor className="w-5 h-5" />
              Pré-visualização do Modo Apresentação
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <p className="text-muted-foreground">
              Teste o layout e áudio da apresentação antes do sorteio real.
            </p>
            
            <div className="space-y-2">
              <h4 className="font-medium">Características do preview:</h4>
              <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                <li>Animação completa com dados fictícios</li>
                <li>Teste de responsividade em tela cheia</li>
                <li>Verificação de áudio e efeitos</li>
                <li>Controles de teclado funcionais</li>
              </ul>
            </div>
            
            <div className="flex gap-2">
              <Button onClick={startPreview} className="flex-1">
                <Play className="w-4 h-4 mr-2" />
                Iniciar Preview
              </Button>
              <Button variant="outline" onClick={onClose}>
                Cancelar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <CinematicPresentation
        isOpen={showPreview}
        onClose={closePreview}
        participants={mockParticipants}
        onRaffleComplete={(result) => {
          console.log('Preview result:', result);
        }}
      />
    </>
  );
}