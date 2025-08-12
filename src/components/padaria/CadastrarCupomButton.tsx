import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { CupomModal } from "./CupomModal";

interface CadastrarCupomButtonProps {
  onCupomCadastrado: () => void;
}

export function CadastrarCupomButton({ onCupomCadastrado }: CadastrarCupomButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleCupomCadastrado = () => {
    setIsModalOpen(false);
    onCupomCadastrado();
  };

  return (
    <>
      <Button 
        onClick={() => setIsModalOpen(true)}
        className="transition-all duration-200 hover:scale-105 hover:shadow-sm"
      >
        <Plus className="w-4 h-4 mr-2" />
        Cadastrar Cupom
      </Button>

      <CupomModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        onCupomCadastrado={handleCupomCadastrado}
      />
    </>
  );
}