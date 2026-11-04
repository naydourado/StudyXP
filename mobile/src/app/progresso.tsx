import { RefreshControl, StyleSheet, View } from 'react-native';

import { GraficoBarras, GraficoLinha } from '@/components/graficos';
import { type Gamificacao, NivelCard } from '@/components/nivel-card';
import { Botao, Card, Tela, Texto } from '@/components/ui';
import { Cores, Fontes } from '@/constants/tema';
import { useDados } from '@/hooks/use-dados';

type DiaSerie = { data: string; dia_semana: string; xp: number; tarefas_concluidas: number; minutos_foco: number };
type Progresso = {
  totais: { xp_total: number; minutos_foco: number; tarefas_concluidas: number };
  gamificacao: Gamificacao;
  serie: DiaSerie[];
};

function Total({ valor, rotulo, emoji }: { valor: string; rotulo: string; emoji: string }) {
  return (
    <Card style={estilos.total}>
      <Texto style={{ fontSize: 22 }}>{emoji}</Texto>
      <Texto style={estilos.totalValor}>{valor}</Texto>
      <Texto variante="pequeno">{rotulo}</Texto>
    </Card>
  );
}

export default function TelaProgresso() {
  const { dados, erro, recarregar, atualizando, puxarParaAtualizar } = useDados<Progresso>('/progresso?periodo=semana');

  if (!dados) {
    return (
      <Tela>
        <Texto variante="subtitulo">{erro || 'Carregando...'}</Texto>
        {erro ? <Botao titulo="Tentar de novo" variante="secundario" onPress={recarregar} /> : null}
      </Tela>
    );
  }

  const rotulo = (d: DiaSerie) => d.dia_semana.charAt(0).toUpperCase() + d.dia_semana.slice(1);
  const xpSemana = dados.serie.map((d) => ({ rotulo: rotulo(d), valor: d.xp }));
  const tarefasSemana = dados.serie.map((d) => ({ rotulo: rotulo(d), valor: d.tarefas_concluidas }));
  const resumoXp = xpSemana.map((p) => `${p.rotulo} ${p.valor}`).join(', ');
  const resumoTarefas = tarefasSemana.map((p) => `${p.rotulo} ${p.valor}`).join(', ');

  return (
    <Tela
      edges={['left', 'right']}
      refreshControl={<RefreshControl refreshing={atualizando} onRefresh={puxarParaAtualizar} />}>
      <NivelCard gamificacao={dados.gamificacao} />

      <View style={estilos.totais}>
        <Total emoji="🏆" valor={dados.totais.xp_total.toLocaleString('pt-BR')} rotulo="XP total" />
        <Total emoji="⏱" valor={`${Math.floor(dados.totais.minutos_foco / 60)}h`} rotulo="Horas focadas" />
        <Total emoji="✅" valor={String(dados.totais.tarefas_concluidas)} rotulo="Tarefas" />
      </View>

      <Card>
        <Texto variante="secao">XP da semana</Texto>
        <GraficoLinha dados={xpSemana} descricao={`XP por dia: ${resumoXp}`} />
      </Card>

      <Card>
        <Texto variante="secao">Tarefas por dia</Texto>
        <GraficoBarras dados={tarefasSemana} descricao={`Tarefas concluídas por dia: ${resumoTarefas}`} />
      </Card>
    </Tela>
  );
}

const estilos = StyleSheet.create({
  totais: { flexDirection: 'row', gap: 8 },
  total: { flex: 1, alignItems: 'center', gap: 2, paddingVertical: 14 },
  totalValor: { fontSize: 20, fontFamily: Fontes.negrito, color: Cores.primariaEscura },
});
