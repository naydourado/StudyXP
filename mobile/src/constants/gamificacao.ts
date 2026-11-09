// valores exibidos na interface; quem decide o xp de verdade e o servidor (mesmos do web)
export type Prioridade = 'baixa' | 'media' | 'alta';
export type HumorValor = 'otimo' | 'bom' | 'neutro' | 'ansioso' | 'cansado';

export const XP_POR_PRIORIDADE: Record<Prioridade, number> = {
  baixa: 20,
  media: 50,
  alta: 80,
};

export const PRIORIDADES: { valor: Prioridade; nome: string }[] = [
  { valor: 'baixa', nome: 'Baixa' },
  { valor: 'media', nome: 'Média' },
  { valor: 'alta', nome: 'Alta' },
];

export const HUMORES: { valor: HumorValor; nome: string; emoji: string }[] = [
  { valor: 'otimo', nome: 'Ótimo', emoji: '😄' },
  { valor: 'bom', nome: 'Bom', emoji: '🙂' },
  { valor: 'neutro', nome: 'Neutro', emoji: '😐' },
  { valor: 'ansioso', nome: 'Ansioso', emoji: '😟' },
  { valor: 'cansado', nome: 'Cansado', emoji: '🥱' },
];

export function nomePrioridade(valor: Prioridade): string {
  return PRIORIDADES.find((p) => p.valor === valor)?.nome ?? valor;
}

// "2026-10-20" -> "Hoje", "Amanhã", "Ontem" ou "20/10"
export function textoPrazo(dataIso: string | null): string {
  if (!dataIso) return 'Sem prazo';
  const [ano, mes, dia] = dataIso.split('-').map(Number);
  const prazo = new Date(ano, mes - 1, dia);
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const dias = Math.round((prazo.getTime() - hoje.getTime()) / 86400000);
  if (dias === 0) return 'Hoje';
  if (dias === 1) return 'Amanhã';
  if (dias === -1) return 'Ontem';
  return `${String(dia).padStart(2, '0')}/${String(mes).padStart(2, '0')}`;
}

export function formatarMinutos(minutos: number): string {
  const horas = Math.floor(minutos / 60);
  const resto = minutos % 60;
  if (horas > 0) return resto > 0 ? `${horas}h ${resto}min` : `${horas}h`;
  return `${resto}min`;
}

// milissegundos -> "MM:SS" (arredonda para cima, como o relogio do web)
export function formatarRelogio(ms: number): string {
  const totalSegundos = Math.max(0, Math.ceil(ms / 1000));
  const minutos = Math.floor(totalSegundos / 60);
  const segundos = totalSegundos % 60;
  return `${String(minutos).padStart(2, '0')}:${String(segundos).padStart(2, '0')}`;
}

// Date (horario local) -> "AAAA-MM-DD", o formato de data da api
export function paraDataIso(data: Date): string {
  const mes = String(data.getMonth() + 1).padStart(2, '0');
  const dia = String(data.getDate()).padStart(2, '0');
  return `${data.getFullYear()}-${mes}-${dia}`;
}

// "AAAA-MM-DD" -> Date no horario local (sem o deslocamento de fuso do Date.parse)
export function deDataIso(dataIso: string): Date {
  const [ano, mes, dia] = dataIso.split('-').map(Number);
  return new Date(ano, mes - 1, dia);
}

export function dataDaqui(dias: number | null): string | null {
  if (dias === null) return null;
  const data = new Date();
  data.setDate(data.getDate() + dias);
  return paraDataIso(data);
}
