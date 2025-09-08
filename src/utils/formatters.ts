// Utilitários de formatação para dados das padarias

/**
 * Formatar CPF: 00000000000 -> 000.000.000-00
 */
export const formatCPF = (cpf: string): string => {
  if (!cpf) return '';
  
  // Remove tudo que não é número
  const numbers = cpf.replace(/\D/g, '');
  
  // Se não tem 11 dígitos, retorna como está
  if (numbers.length !== 11) return cpf;
  
  // Aplica a máscara: 000.000.000-00
  return numbers.replace(
    /^(\d{3})(\d{3})(\d{3})(\d{2})$/,
    '$1.$2.$3-$4'
  );
};

/**
 * Formatar CNPJ: 00000000000000 -> 00.000.000/0000-00
 */
export const formatCNPJ = (cnpj: string): string => {
  if (!cnpj) return '';
  
  // Remove tudo que não é número
  const numbers = cnpj.replace(/\D/g, '');
  
  // Se não tem 14 dígitos, retorna como está
  if (numbers.length !== 14) return cnpj;
  
  // Aplica a máscara: 00.000.000/0000-00
  return numbers.replace(
    /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
    '$1.$2.$3/$4-$5'
  );
};

/**
 * Formatar telefone: 00000000000 -> (00)00000-0000
 */
export const formatPhone = (phone: string): string => {
  if (!phone) return '';
  
  // Remove tudo que não é número
  const numbers = phone.replace(/\D/g, '');
  
  // Se tem 11 dígitos (celular): (00)00000-0000
  if (numbers.length === 11) {
    return numbers.replace(
      /^(\d{2})(\d{5})(\d{4})$/,
      '($1)$2-$3'
    );
  }
  
  // Se tem 10 dígitos (fixo): (00)0000-0000
  if (numbers.length === 10) {
    return numbers.replace(
      /^(\d{2})(\d{4})(\d{4})$/,
      '($1)$2-$3'
    );
  }
  
  // Se não tem formato esperado, retorna como está
  return phone;
};

/**
 * Formatar status: 'ativa' -> 'Ativa'
 */
export const formatStatus = (status: string): string => {
  const statusMap: Record<string, string> = {
    'ativa': 'Ativa',
    'pendente': 'Pendente',
    'inativa': 'Inativa',
  };
  
  return statusMap[status] || status;
};

/**
 * Formatar status de pagamento
 */
export const formatStatusPagamento = (statusPagamento: string): string => {
  const statusMap: Record<string, string> = {
    'pago': 'Pago',
    'em_aberto': 'Pendente',
    'atrasado': 'Atrasado',
  };
  
  return statusMap[statusPagamento] || statusPagamento;
};

/**
 * Formatar valor monetário: 25.50 -> R$ 25,50
 */
export const formatCurrency = (value: number): string => {
  if (typeof value !== 'number' || isNaN(value)) return 'R$ 0,00';
  
  return `R$ ${value.toFixed(2).replace('.', ',')}`;
};

/**
 * Aplicar máscara de CNPJ durante a digitação
 */
export const applyCNPJMask = (value: string): string => {
  // Remove tudo que não é número
  const numbers = value.replace(/\D/g, '');
  
  // Aplica a máscara progressivamente
  if (numbers.length <= 2) return numbers;
  if (numbers.length <= 5) return `${numbers.slice(0, 2)}.${numbers.slice(2)}`;
  if (numbers.length <= 8) return `${numbers.slice(0, 2)}.${numbers.slice(2, 5)}.${numbers.slice(5)}`;
  if (numbers.length <= 12) return `${numbers.slice(0, 2)}.${numbers.slice(2, 5)}.${numbers.slice(5, 8)}/${numbers.slice(8)}`;
  return `${numbers.slice(0, 2)}.${numbers.slice(2, 5)}.${numbers.slice(5, 8)}/${numbers.slice(8, 12)}-${numbers.slice(12, 14)}`;
};

/**
 * Aplicar máscara de telefone durante a digitação
 */
export const applyPhoneMask = (value: string): string => {
  // Remove tudo que não é número
  const numbers = value.replace(/\D/g, '');
  
  // Aplica a máscara progressivamente
  if (numbers.length <= 2) return numbers;
  if (numbers.length <= 7) return `(${numbers.slice(0, 2)})${numbers.slice(2)}`;
  return `(${numbers.slice(0, 2)})${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`;
};

/**
 * Remover formatação de CNPJ: 00.000.000/0000-00 -> 00000000000000
 */
export const unformatCNPJ = (cnpj: string): string => {
  return cnpj.replace(/\D/g, '');
};

/**
 * Remover formatação de telefone: (00)00000-0000 -> 00000000000
 */
export const unformatPhone = (phone: string): string => {
  return phone.replace(/\D/g, '');
};

/**
 * Converter status do frontend para backend
 */
export const unformatStatus = (status: string): string => {
  const statusMap: Record<string, string> = {
    'Ativa': 'ativa',
    'Pendente': 'pendente',
    'Inativa': 'inativa',
  };
  
  return statusMap[status] || status.toLowerCase();
};

/**
 * Converter status de pagamento do frontend para backend
 */
export const unformatStatusPagamento = (statusPagamento: string): string => {
  const statusMap: Record<string, string> = {
    'Pago': 'pago',
    'Pendente': 'em_aberto',
    'Atrasado': 'atrasado',
  };
  
  return statusMap[statusPagamento] || statusPagamento.toLowerCase();
};
