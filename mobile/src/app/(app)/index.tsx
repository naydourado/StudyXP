import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, RefreshControl, StyleSheet, View } from 'react-native';

import { type Gamificacao, NivelCard } from '@/components/nivel-card';
import { type Tarefa, TarefaItem } from '@/components/tarefa-item';
import { Botao, Card, MensagemErro, Tela, Texto } from '@/components/ui';
import { formatarMinutos, HUMORES, type HumorValor } from '@/constants/gamificacao';
import { Cores, Fontes } from '@/constants/tema';
import { useDados } from '@/hooks/use-dados';
import { comemorar } from '@/services/feedback';
import { api, mensagemDeErro } from '@/services/api';

type Dashboard = {
  usuario: { nome: string };
  gamificacao: Gamificacao;
  tarefas: Tarefa[];
  semana: { data: string; dia_semana: string; ativo: boolean }[];
  foco_hoje_minutos: number;
  humor_autorizado: boolean;
  ultimo_humor: { humor: HumorValor; criado_em: string } | null;
};

export default function Inicio() {
  const { dados, erro, recarregar, atualizando, puxarParaAtualizar } = useDados<Dashboard>('/dashboard');
  const [erroAcao, setErroAcao] = useState('');

  async function alternarTarefa(tarefa: Tarefa) {
    const acao = tarefa.status === 'concluida' ? 'reabrir' : 'concluir';
    try {
      const resultado = await api<{ xp_ganho: number; novas_conquistas: { codigo: string; nome: string }[] }>(
        `/tarefas/${tarefa.id}/${acao}`,
        { metodo: 'POST' },
      );
      comemorar(resultado);
      recarregar();
    } catch (error) {
      setErroAcao(mensagemDeErro(error));
    }
  }

  async function registrarHumor(humor: HumorValor) {
    try {
      const resultado = await api<{ xp_ganho: number; novas_conquistas: { codigo: string; nome: string }[] }>(
        '/humor',
        { metodo: 'POST', corpo: { humor } },
      );
      comemorar(resultado);
      recarregar();
    } catch (error) {
      setErroAcao(mensagemDeErro(error));
    }
  }

  if (!dados) {
    return (
      <Tela>
        <Texto variante="subtitulo">{erro || 'Carregando...'}</Texto>
        {erro ? <Botao titulo="Tentar de novo" variante="secundario" onPress={recarregar} /> : null}
      </Tela>
    );
  }

  const ofensiva = dados.gamificacao.ofensiva_atual;

  return (
    <Tela refreshControl={<RefreshControl refreshing={atualizando} onRefresh={puxarParaAtualizar} />}>
      <View>
        <Texto variante="titulo">Olá, {dados.usuario.nome.split(' ')[0]}!</Texto>
        <Texto variante="subtitulo">Hora de Estudar.</Texto>
      </View>

      <NivelCard gamificacao={dados.gamificacao} />
      <MensagemErro>{erroAcao}</MensagemErro>

      <Card>
        <View style={estilos.linhaTitulo}>
          <Texto variante="secao">Tarefas de Hoje</Texto>
          <Pressable onPress={() => router.navigate('/tarefas')} hitSlop={8}>
            <Texto style={estilos.verTudo}>Ver tudo →</Texto>
          </Pressable>
        </View>
        {dados.tarefas.length > 0 ? (
          dados.tarefas.map((tarefa) => <TarefaItem key={tarefa.id} tarefa={tarefa} aoAlternar={alternarTarefa} />)
        ) : (
          <Texto variante="pequeno">Nenhuma tarefa por aqui. Que tal criar uma?</Texto>
        )}
      </Card>

      <Card>
        <Texto variante="secao">🔥 Sua sequência</Texto>
        <View style={estilos.ofensiva}>
          <Texto style={estilos.ofensivaNumero}>{ofensiva}</Texto>
          <Texto variante="pequeno">{ofensiva === 1 ? 'dia seguido' : 'dias seguidos'}</Texto>
        </View>
        <View style={estilos.semana}>
          {dados.semana.map((dia) => (
            <View key={dia.data} style={estilos.dia}>
              <View style={[estilos.diaBarra, dia.ativo && estilos.diaAtivo]} />
              <Texto variante="pequeno">{dia.dia_semana.charAt(0).toUpperCase() + dia.dia_semana.slice(1)}</Texto>
            </View>
          ))}
        </View>
      </Card>

      <Card>
        <Texto variante="secao">⏱ Sessão de Foco</Texto>
        <Texto variante="pequeno">
          {dados.foco_hoje_minutos > 0
            ? `Hoje você já focou ${formatarMinutos(dados.foco_hoje_minutos)}. Bora mais um?`
            : 'Bora estudar? Inicie um pomodoro de 25 minutos.'}
        </Texto>
        <Botao titulo="Iniciar foco" onPress={() => router.navigate('/foco')} />
      </Card>

      <Card>
        <Texto variante="secao">Como você está?</Texto>
        <Texto variante="pequeno">Registrar o humor te ajuda a entender seus padrões de estudo.</Texto>
        <View style={estilos.humores}>
          {HUMORES.map((humor) => (
            <Pressable
              key={humor.valor}
              accessibilityRole="button"
              accessibilityLabel={humor.nome}
              style={estilos.humor}
              onPress={() => (dados.humor_autorizado ? registrarHumor(humor.valor) : router.navigate('/humor'))}>
              <Texto style={{ fontSize: 24 }}>{humor.emoji}</Texto>
            </Pressable>
          ))}
        </View>
      </Card>
    </Tela>
  );
}

const estilos = StyleSheet.create({
  linhaTitulo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  verTudo: { color: Cores.primaria, fontSize: 13, fontFamily: Fontes.seminegrito },
  ofensiva: { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
  ofensivaNumero: { fontSize: 34, fontFamily: Fontes.negrito, color: Cores.primariaEscura, lineHeight: 42 },
  semana: { flexDirection: 'row', justifyContent: 'space-between', gap: 4 },
  dia: { flex: 1, alignItems: 'center', gap: 4 },
  diaBarra: { height: 26, alignSelf: 'stretch', borderRadius: 8, backgroundColor: '#D4D8E1' },
  diaAtivo: { backgroundColor: Cores.primariaClara },
  humores: { flexDirection: 'row', justifyContent: 'space-between' },
  humor: {
    width: 54,
    height: 46,
    borderRadius: 10,
    backgroundColor: Cores.badge,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
