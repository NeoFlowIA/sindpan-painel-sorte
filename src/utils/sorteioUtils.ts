// Utilitários para sistema de sorteio
// Implementação completa das regras de sorteio conforme especificações

export interface Cupom {
  id: string;
  numero: number;
  serie: number; // banco usa 1-10. Serie 0 da loteria = 10 no banco
  clienteId: string;
  status: 'ativo' | 'usado_sorteio';
}

export interface ResultadoSorteio {
  cupomId: string;
  numero: number;
  serie: number;
  clienteId: string;
}

/**
 * Função pura para executar sorteio completo
 * Gera 5 ganhadores seguindo as regras especificadas
 */
export function executarSorteio(
  numeroInicial: number,
  serieInicial: number,
  cupons: Cupom[],
  serieUnica?: boolean
): ResultadoSorteio[] {
  const resultados: ResultadoSorteio[] = [];
  const clientesGanhadores = new Set<string>();
  const cuponsUsados = new Set<string>();
  
  // Converter série 0 da loteria para 10 no banco
  const serieInicialBanco = serieInicial === 0 ? 10 : serieInicial;
  
  // Primeiro sorteio: baseado no número e série digitados pelo usuário
  const primeiroCupom = encontrarPrimeiroCupom(
    numeroInicial, 
    serieInicialBanco, 
    cupons, 
    clientesGanhadores, 
    cuponsUsados
  );
  
  if (!primeiroCupom) {
    throw new Error('Nenhum cupom elegível encontrado para o primeiro sorteio');
  }
  
  resultados.push({
    cupomId: primeiroCupom.id,
    numero: primeiroCupom.numero,
    serie: primeiroCupom.serie,
    clienteId: primeiroCupom.clienteId
  });
  
  clientesGanhadores.add(primeiroCupom.clienteId);
  cuponsUsados.add(primeiroCupom.id);
  
  // Sorteios 2 até 5: automáticos, sempre pegando o próximo número mais alto disponível
  let numeroAtual = primeiroCupom.numero;
  
  for (let i = 1; i < 5; i++) {
    const proximoCupom = encontrarProximoCupom(
      numeroAtual,
      cupons,
      clientesGanhadores,
      cuponsUsados,
      serieUnica
    );
    
    if (!proximoCupom) {
      break; // Não há mais cupons disponíveis
    }
    
    resultados.push({
      cupomId: proximoCupom.id,
      numero: proximoCupom.numero,
      serie: proximoCupom.serie,
      clienteId: proximoCupom.clienteId
    });
    
    clientesGanhadores.add(proximoCupom.clienteId);
    cuponsUsados.add(proximoCupom.id);
    numeroAtual = proximoCupom.numero;
  }
  
  return resultados;
}

/**
 * Encontra o primeiro cupom baseado no número e série iniciais
 */
function encontrarPrimeiroCupom(
  numeroInicial: number,
  serieInicial: number,
  cupons: Cupom[],
  clientesGanhadores: Set<string>,
  cuponsUsados: Set<string>
): Cupom | null {
  // 1. Procurar numeroInicial na serieInicial
  let cupom = cupons.find(c => 
    c.numero === numeroInicial && 
    c.serie === serieInicial && 
    c.status === 'ativo' &&
    !clientesGanhadores.has(c.clienteId) &&
    !cuponsUsados.has(c.id)
  );
  
  if (cupom) return cupom;
  
  // 2. Procurar o número mais próximo dentro da mesma série
  const cuponsMesmaSerie = cupons.filter(c => 
    c.serie === serieInicial && 
    c.status === 'ativo' &&
    !clientesGanhadores.has(c.clienteId) &&
    !cuponsUsados.has(c.id)
  );
  
  if (cuponsMesmaSerie.length > 0) {
    cupom = cuponsMesmaSerie.reduce((closest, current) => 
      Math.abs(current.numero - numeroInicial) < Math.abs(closest.numero - numeroInicial) 
        ? current : closest
    );
    return cupom;
  }
  
  // 3. Procurar na próxima série mais alta, obedecendo ciclo circular
  const seriesValidas = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  const indiceInicial = seriesValidas.indexOf(serieInicial);
  
  for (let i = 1; i <= 10; i++) {
    const indiceProxima = (indiceInicial + i) % 10;
    const proximaSerie = seriesValidas[indiceProxima];
    
    const cuponsProximaSerie = cupons.filter(c => 
      c.serie === proximaSerie && 
      c.status === 'ativo' &&
      !clientesGanhadores.has(c.clienteId) &&
      !cuponsUsados.has(c.id)
    );
    
    if (cuponsProximaSerie.length > 0) {
      cupom = cuponsProximaSerie.reduce((closest, current) => 
        Math.abs(current.numero - numeroInicial) < Math.abs(closest.numero - numeroInicial) 
          ? current : closest
      );
      return cupom;
    }
  }
  
  // 4. Procurar o número mais próximo global, independente da série
  const cuponsElegiveis = cupons.filter(c => 
    c.status === 'ativo' &&
    !clientesGanhadores.has(c.clienteId) &&
    !cuponsUsados.has(c.id)
  );
  
  if (cuponsElegiveis.length > 0) {
    cupom = cuponsElegiveis.reduce((closest, current) => 
      Math.abs(current.numero - numeroInicial) < Math.abs(closest.numero - numeroInicial) 
        ? current : closest
    );
    return cupom;
  }
  
  return null;
}

/**
 * Encontra o próximo cupom baseado no número atual
 */
function encontrarProximoCupom(
  numeroAtual: number,
  cupons: Cupom[],
  clientesGanhadores: Set<string>,
  cuponsUsados: Set<string>,
  serieUnica?: boolean
): Cupom | null {
  // 1. Mesma série - próximo número mais alto
  const cuponsMesmaSerie = cupons.filter(c => 
    c.numero > numeroAtual && 
    c.status === 'ativo' &&
    !clientesGanhadores.has(c.clienteId) &&
    !cuponsUsados.has(c.id)
  );
  
  if (cuponsMesmaSerie.length > 0) {
    return cuponsMesmaSerie.reduce((min, current) => 
      current.numero < min.numero ? current : min
    );
  }
  
  if (serieUnica) {
    return null; // Se série única, não procurar em outras séries
  }
  
  // 2. Próxima série (com loop circular) - próximo número mais alto
  const seriesValidas = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  
  for (let i = 1; i <= 10; i++) {
    const proximaSerie = ((cupons[0]?.serie || 1) + i - 1) % 10 + 1;
    
    const cuponsProximaSerie = cupons.filter(c => 
      c.serie === proximaSerie && 
      c.numero > numeroAtual && 
      c.status === 'ativo' &&
      !clientesGanhadores.has(c.clienteId) &&
      !cuponsUsados.has(c.id)
    );
    
    if (cuponsProximaSerie.length > 0) {
      return cuponsProximaSerie.reduce((min, current) => 
        current.numero < min.numero ? current : min
      );
    }
  }
  
  // 3. Buscar número mais próximo acima, independente da série
  const cuponsElegiveis = cupons.filter(c => 
    c.numero > numeroAtual && 
    c.status === 'ativo' &&
    !clientesGanhadores.has(c.clienteId) &&
    !cuponsUsados.has(c.id)
  );
  
  if (cuponsElegiveis.length > 0) {
    return cuponsElegiveis.reduce((min, current) => 
      current.numero < min.numero ? current : min
    );
  }
  
  return null;
}

/**
 * Converte cupons do banco para formato da função de sorteio
 */
export function converterCuponsParaSorteio(cuponsBanco: any[]): Cupom[] {
  return cuponsBanco.map(cupom => ({
    id: cupom.id,
    numero: parseInt(cupom.numero_sorte),
    serie: cupom.serie || 1,
    clienteId: cupom.cliente_id,
    status: cupom.status
  }));
}

/**
 * Marca cupom como usado no sorteio
 * Esta função deve ser implementada no componente usando o hook useMarcarCupomSorteado
 */
export function marcarCupomComoUsado(cupomId: string): Promise<void> {
  // Esta função será implementada no componente que chama a API
  return Promise.resolve();
}

/**
 * Reativa cupom específico
 * Esta função deve ser implementada no componente usando o hook useReativarCupomEspecifico
 */
export function reativarCupom(cupomId: string): Promise<void> {
  // Esta função será implementada no componente que chama a API
  return Promise.resolve();
}

/**
 * Reativa todos os cupons de um cliente
 * Esta função deve ser implementada no componente usando o hook useReativarTodosCuponsCliente
 */
export function reativarTodosCuponsCliente(clienteId: string): Promise<void> {
  // Esta função será implementada no componente que chama a API
  return Promise.resolve();
}
