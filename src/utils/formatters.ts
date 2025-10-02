/**
 * Utilitários para formatação de dados
 */

/**
 * Formata CPF no padrão: 123.456.789-10
 */
export const formatCPF = (cpf: string): string => {
  if (!cpf) return '';
  
  // Remove todos os caracteres não numéricos
  const digits = cpf.replace(/\D/g, '');
  
  // Se não tem 11 dígitos, retorna como está
  if (digits.length !== 11) return cpf;
  
  // Formata: XXX.XXX.XXX-XX
  return digits
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})/, '$1-$2');
};

/**
 * Mascara CPF para proteção de dados: ***.123.456-11
 * Mostra apenas os últimos 6 dígitos
 */
export const maskCPF = (cpf: string): string => {
  if (!cpf) return '';
  
  // Remove todos os caracteres não numéricos
  const digits = cpf.replace(/\D/g, '');
  
  // Se não tem 11 dígitos, retorna como está
  if (digits.length !== 11) return cpf;
  
  // Pega os últimos 6 dígitos
  const lastSix = digits.slice(-6);
  
  // Formata: ***.123.456-11
  return `***.${lastSix.slice(0, 3)}.${lastSix.slice(3, 6)}-${digits.slice(-2)}`;
};

/**
 * Formata telefone/WhatsApp no padrão:
 * - 9 dígitos: (11) 9 1234-5678
 * - 8 dígitos: (11) 1234-5678
 */
export const formatPhone = (phone: string): string => {
  if (!phone) return '';
  
  // Remove todos os caracteres não numéricos
  const digits = phone.replace(/\D/g, '');
  
  // Se tem 11 dígitos (com 9): (XX) 9 XXXX-XXXX
  if (digits.length === 11) {
    return digits
      .replace(/(\d{2})(\d{1})(\d{4})(\d{4})/, '($1) $2 $3-$4');
  }
  
  // Se tem 10 dígitos (sem 9): (XX) XXXX-XXXX
  if (digits.length === 10) {
    return digits
      .replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
  }
  
  // Se tem 9 dígitos (apenas o número): 9 XXXX-XXXX
  if (digits.length === 9) {
    return digits
      .replace(/(\d{1})(\d{4})(\d{4})/, '$1 $2-$3');
  }
  
  // Se tem 8 dígitos (apenas o número): XXXX-XXXX
  if (digits.length === 8) {
    return digits
      .replace(/(\d{4})(\d{4})/, '$1-$2');
  }
  
  // Para outros casos, retorna como está
  return phone;
};

/**
 * Formata WhatsApp no padrão: (11) 9 1234-5678 ou (11) 1234-5678
 */
export const formatWhatsApp = (whatsapp: string): string => {
  return formatPhone(whatsapp);
};

/**
 * Remove formatação de CPF, retornando apenas números
 */
export const unformatCPF = (cpf: string): string => {
  return cpf.replace(/\D/g, '');
};

/**
 * Remove formatação de telefone, retornando apenas números
 */
export const unformatPhone = (phone: string): string => {
  return phone.replace(/\D/g, '');
};

/**
 * Formata CNPJ no padrão: 12.345.678/0001-90
 */
export const formatCNPJ = (cnpj: string): string => {
  if (!cnpj) return '';
  
  // Remove todos os caracteres não numéricos
  const digits = cnpj.replace(/\D/g, '');
  
  // Se não tem 14 dígitos, retorna como está
  if (digits.length !== 14) return cnpj;
  
  // Formata: XX.XXX.XXX/XXXX-XX
  return digits
    .replace(/(\d{2})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1/$2')
    .replace(/(\d{4})(\d{1,2})/, '$1-$2');
};

/**
 * Aplica máscara de CNPJ durante digitação
 */
export const applyCNPJMask = (value: string): string => {
  return formatCNPJ(value);
};

/**
 * Aplica máscara de telefone durante digitação
 */
export const applyPhoneMask = (value: string): string => {
  return formatPhone(value);
};

/**
 * Remove formatação de CNPJ, retornando apenas números
 */
export const unformatCNPJ = (cnpj: string): string => {
  return cnpj.replace(/\D/g, '');
};

/**
 * Formata valor monetário no padrão brasileiro: R$ 1.234,56
 */
export const formatCurrency = (value: number | string): string => {
  if (!value && value !== 0) return 'R$ 0,00';
  
  const numericValue = typeof value === 'string' ? parseFloat(value) : value;
  
  if (isNaN(numericValue)) return 'R$ 0,00';
  
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(numericValue);
};

/**
 * Formata status de padaria
 */
export const formatStatus = (status: string): string => {
  const statusMap: Record<string, string> = {
    'ativo': 'Ativo',
    'inativo': 'Inativo',
    'suspenso': 'Suspenso',
    'pendente': 'Pendente'
  };
  
  return statusMap[status] || status;
};

/**
 * Formata status de pagamento
 */
export const formatStatusPagamento = (status: string): string => {
  const normalizedStatus = status
    .toLowerCase()
    .replace(/\s+/g, '_');

  const statusMap: Record<string, string> = {
    'pago': 'Pago',
    'em_aberto': 'Pendente',
    'pendente': 'Pendente',
    'atrasado': 'Atrasado',
    'vencido': 'Vencido',
    'cancelado': 'Cancelado'
  };

  return statusMap[normalizedStatus] || status;
};
