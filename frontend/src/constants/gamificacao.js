// valores exibidos na interface; quem decide o xp de verdade e o servidor
export const XP_POR_PRIORIDADE = {
  baixa: 20,
  media: 50,
  alta: 80,
};

export const PRIORIDADES = [
  { valor: "baixa", nome: "Baixa" },
  { valor: "media", nome: "Média" },
  { valor: "alta", nome: "Alta" },
];

// os 5 humores do prototipo
export const HUMORES = [
  { valor: "otimo", nome: "Ótimo", emoji: "😄" },
  { valor: "bom", nome: "Bom", emoji: "🙂" },
  { valor: "neutro", nome: "Neutro", emoji: "😐" },
  { valor: "ansioso", nome: "Ansioso", emoji: "😟" },
  { valor: "cansado", nome: "Cansado", emoji: "🥱" },
];

export function humorPorValor(valor) {
  return HUMORES.find((humor) => humor.valor === valor);
}

export function nomePrioridade(valor) {
  return PRIORIDADES.find((p) => p.valor === valor)?.nome ?? valor;
}

// "2026-10-20" -> "Hoje", "Amanhã", "Ontem" ou "20/10"
export function textoPrazo(dataIso) {
  if (!dataIso) return "Sem prazo";

  const [ano, mes, dia] = dataIso.split("-").map(Number);
  const prazo = new Date(ano, mes - 1, dia);
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  const dias = Math.round((prazo - hoje) / 86400000);
  if (dias === 0) return "Hoje";
  if (dias === 1) return "Amanhã";
  if (dias === -1) return "Ontem";
  return prazo.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}

export function prazoAtrasado(dataIso) {
  if (!dataIso) return false;
  const [ano, mes, dia] = dataIso.split("-").map(Number);
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  return new Date(ano, mes - 1, dia) < hoje;
}

export function formatarMinutos(minutos) {
  const horas = Math.floor(minutos / 60);
  const resto = minutos % 60;
  if (horas > 0) return resto > 0 ? `${horas}h ${resto}min` : `${horas}h`;
  return `${resto}min`;
}
