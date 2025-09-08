export interface Cliente {
  id: number;
  cpf: string;
  nome: string;
  whatsapp: string;
  dataCadastro: string;
  totalCupons: number;
  saldoAcumulado: number;
}

const STORAGE_KEY = "clientes";

const initialClientes: Cliente[] = [
  {
    id: 1,
    cpf: "123.456.789-00",
    nome: "Ana Souza",
    whatsapp: "(+55) (85) 98888-1111",
    dataCadastro: "07/08/2025",
    totalCupons: 12,
    saldoAcumulado: 15.5,
  },
  {
    id: 2,
    cpf: "987.654.321-99",
    nome: "Carlos Silva",
    whatsapp: "(+55) (85) 97777-2222",
    dataCadastro: "05/08/2025",
    totalCupons: 8,
    saldoAcumulado: 8.3,
  },
  {
    id: 3,
    cpf: "456.789.123-55",
    nome: "Maria Santos",
    whatsapp: "(+55) (85) 96666-3333",
    dataCadastro: "03/08/2025",
    totalCupons: 15,
    saldoAcumulado: 0,
  },
];

function saveClientes(clientes: Cliente[]) {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(clientes));
    window.dispatchEvent(new Event("clientesUpdated"));
  }
}

export function getClientes(): Cliente[] {
  if (typeof window === "undefined") return initialClientes;
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored) return JSON.parse(stored) as Cliente[];
  saveClientes(initialClientes);
  return initialClientes;
}

export function addCliente(data: Omit<Cliente, "id" | "dataCadastro" | "totalCupons" | "saldoAcumulado">): Cliente {
  const clientes = getClientes();
  const novoCliente: Cliente = {
    id: Date.now(),
    dataCadastro: new Date().toLocaleDateString("pt-BR"),
    totalCupons: 0,
    saldoAcumulado: 0,
    ...data,
  };
  clientes.push(novoCliente);
  saveClientes(clientes);
  return novoCliente;
}

export function updateCliente(cpf: string, update: Partial<Cliente>): Cliente | undefined {
  const clientes = getClientes();
  const index = clientes.findIndex((c) => c.cpf === cpf);
  if (index === -1) return undefined;
  clientes[index] = { ...clientes[index], ...update };
  saveClientes(clientes);
  return clientes[index];
}
