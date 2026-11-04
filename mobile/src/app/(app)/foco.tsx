// temporizador de foco (pomodoro) - mesmo fluxo do web:
// a sessao e aberta no servidor, o tempo e calculado pelo horario de termino
// (continua certo com o app em segundo plano) e uma notificacao local avisa o fim
import * as Haptics from 'expo-haptics';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Platform, Pressable, StyleSheet, View } from 'react-native';

import { AnelProgresso } from '@/components/graficos';
import { type Gamificacao, NivelCard } from '@/components/nivel-card';
import { Botao, Card, MensagemErro, Tela, Texto } from '@/components/ui';
import { formatarMinutos, formatarRelogio } from '@/constants/gamificacao';
import { Cores, Fontes, Raio } from '@/constants/tema';
import { useDados } from '@/hooks/use-dados';
import { api, mensagemDeErro } from '@/services/api';
import { comemorar } from '@/services/feedback';
import { agendarAviso, cancelarAviso } from '@/services/notificacoes';

const PREDEFINICOES = [
  { nome: 'Pomodoro', minutos: 25, tipo: 'foco' },
  { nome: 'Pausa curta', minutos: 5, tipo: 'pausa_curta' },
  { nome: 'Pausa longa', minutos: 15, tipo: 'pausa_longa' },
  { nome: 'Estudo profundo', minutos: 50, tipo: 'foco' },
] as const;

type Predefinicao = (typeof PREDEFINICOES)[number];
type Estado = 'parado' | 'rodando' | 'pausado';
type Sessao = { id: number; status: string; minutos_validos: number };
type ResultadoFoco = {
  sessao: Sessao;
  xp_ganho: number;
  gamificacao: Gamificacao;
  novas_conquistas: { codigo: string; nome: string }[];
};

export default function Foco() {
  const resumo = useDados<{ minutos_foco: number; sessoes_concluidas: number }>('/foco/resumo-hoje');
  const status = useDados<Gamificacao>('/gamificacao/status');

  const [predefinicao, setPredefinicao] = useState<Predefinicao>(PREDEFINICOES[0]);
  const [estado, setEstado] = useState<Estado>('parado');
  const [restanteMs, setRestanteMs] = useState(PREDEFINICOES[0].minutos * 60000);
  const [mensagem, setMensagem] = useState('');
  const [erro, setErro] = useState('');

  const fimEm = useRef<number | null>(null);
  const sessaoId = useRef<number | null>(null);
  const avisoId = useRef<string | null>(null);
  const finalizando = useRef(false);

  const { recarregar: recarregarResumo } = resumo;
  const { recarregar: recarregarStatus } = status;

  const finalizar = useCallback(async () => {
    if (finalizando.current || !sessaoId.current) return;
    finalizando.current = true;
    await cancelarAviso(avisoId.current);
    avisoId.current = null;

    try {
      const resultado = await api<ResultadoFoco>(`/foco/sessoes/${sessaoId.current}/finalizar`, { metodo: 'POST' });
      comemorar(resultado);
      setMensagem(
        resultado.sessao.status === 'concluida'
          ? `Sessão concluída! +${resultado.xp_ganho} XP`
          : `Sessão encerrada com ${resultado.sessao.minutos_validos} min de foco.`,
      );
      recarregarResumo();
      recarregarStatus();
    } catch (error) {
      setErro(mensagemDeErro(error, 'Erro ao registrar a sessão.'));
    } finally {
      sessaoId.current = null;
      fimEm.current = null;
      finalizando.current = false;
      setEstado('parado');
      setRestanteMs(predefinicao.minutos * 60000);
    }
  }, [predefinicao, recarregarResumo, recarregarStatus]);

  useEffect(() => {
    if (estado !== 'rodando') return undefined;

    const intervalo = setInterval(() => {
      const restante = Math.max(0, (fimEm.current ?? Date.now()) - Date.now());
      setRestanteMs(restante);
      if (restante === 0) {
        clearInterval(intervalo);
        if (Platform.OS !== 'web') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
        }
        finalizar();
      }
    }, 500);

    return () => clearInterval(intervalo);
  }, [estado, finalizar]);

  async function iniciar() {
    setMensagem('');
    setErro('');

    if (!sessaoId.current) {
      try {
        const sessao = await api<Sessao>('/foco/sessoes', {
          metodo: 'POST',
          corpo: { tipo: predefinicao.tipo, duracao_planejada: predefinicao.minutos },
        });
        sessaoId.current = sessao.id;
      } catch (error) {
        setErro(mensagemDeErro(error, 'Não foi possível iniciar a sessão.'));
        return;
      }
    }

    fimEm.current = Date.now() + restanteMs;
    setEstado('rodando');
    const pausa = predefinicao.tipo !== 'foco';
    avisoId.current = await agendarAviso(
      restanteMs / 1000,
      pausa ? 'Fim da pausa' : 'Sessão de foco concluída!',
      pausa ? 'Bora voltar aos estudos?' : 'Abra o StudyXP para registrar seu XP.',
    );
  }

  async function pausar() {
    setRestanteMs(Math.max(0, (fimEm.current ?? Date.now()) - Date.now()));
    setEstado('pausado');
    await cancelarAviso(avisoId.current);
    avisoId.current = null;
  }

  async function resetar(nova: Predefinicao = predefinicao) {
    await cancelarAviso(avisoId.current);
    avisoId.current = null;
    if (sessaoId.current) {
      const id = sessaoId.current;
      sessaoId.current = null;
      api(`/foco/sessoes/${id}/cancelar`, { metodo: 'POST' }).catch(() => {});
    }
    fimEm.current = null;
    setEstado('parado');
    setRestanteMs(nova.minutos * 60000);
    setMensagem('');
  }

  function trocar(opcao: Predefinicao) {
    if (estado === 'parado') {
      setPredefinicao(opcao);
      resetar(opcao);
      return;
    }
    Alert.alert('Trocar o tempo?', 'A sessão atual será cancelada.', [
      { text: 'Continuar sessão', style: 'cancel' },
      {
        text: 'Trocar',
        style: 'destructive',
        onPress: () => {
          setPredefinicao(opcao);
          resetar(opcao);
        },
      },
    ]);
  }

  const totalMs = predefinicao.minutos * 60000;
  const rotulo = { parado: 'Pronto', rodando: 'Focando', pausado: 'Pausado' }[estado];

  return (
    <Tela>
      <View>
        <Texto variante="titulo">Foco</Texto>
        <Texto variante="subtitulo">Use o método Pomodoro para estudar com mais concentração.</Texto>
      </View>

      {status.dados && <NivelCard gamificacao={status.dados} />}

      <Card style={estilos.timerCard}>
        <AnelProgresso progresso={(totalMs - restanteMs) / totalMs}>
          <Texto style={estilos.relogio} accessibilityLabel={`Tempo restante ${formatarRelogio(restanteMs)}`}>
            {formatarRelogio(restanteMs)}
          </Texto>
          <Texto variante="pequeno">{rotulo}</Texto>
        </AnelProgresso>

        <View style={estilos.acoes}>
          {estado === 'rodando' ? (
            <Botao titulo="Pausar" onPress={pausar} style={{ flex: 1 }} />
          ) : (
            <Botao titulo={estado === 'pausado' ? 'Continuar' : 'Iniciar'} onPress={iniciar} style={{ flex: 1 }} />
          )}
          <Botao titulo="Resetar" variante="secundario" onPress={() => resetar()} style={{ flex: 1 }} />
        </View>
        {estado !== 'parado' && (
          <Botao titulo="Encerrar e salvar os minutos" variante="secundario" onPress={finalizar} />
        )}

        {mensagem ? <Texto style={estilos.mensagem}>{mensagem}</Texto> : null}
        <MensagemErro>{erro}</MensagemErro>
      </Card>

      <Card>
        <Texto variante="secao">Predefinições</Texto>
        {PREDEFINICOES.map((opcao) => {
          const ativa = opcao.nome === predefinicao.nome;
          return (
            <Pressable
              key={opcao.nome}
              accessibilityRole="radio"
              aria-checked={ativa}
              onPress={() => trocar(opcao)}
              style={[estilos.preset, ativa && estilos.presetAtivo]}>
              <Texto style={[estilos.presetTexto, ativa && { color: '#fff' }]}>{opcao.nome}</Texto>
              <Texto style={[estilos.presetTexto, ativa && { color: '#fff' }]}>{opcao.minutos} min</Texto>
            </Pressable>
          );
        })}
        <View style={estilos.hoje}>
          <Texto variante="pequeno">Hoje</Texto>
          <Texto style={estilos.hojeValor}>{formatarMinutos(resumo.dados?.minutos_foco ?? 0)}</Texto>
          <Texto variante="pequeno">em sessões de foco</Texto>
        </View>
      </Card>
    </Tela>
  );
}

const estilos = StyleSheet.create({
  timerCard: { alignItems: 'center', gap: 16, paddingVertical: 24 },
  relogio: { fontSize: 48, fontFamily: Fontes.negrito, lineHeight: 56 },
  acoes: { flexDirection: 'row', gap: 12, alignSelf: 'stretch' },
  mensagem: { color: Cores.primaria, fontFamily: Fontes.seminegrito, textAlign: 'center' },
  preset: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: Raio.sm,
    backgroundColor: Cores.campo,
  },
  presetAtivo: { backgroundColor: Cores.primaria },
  presetTexto: { fontFamily: Fontes.seminegrito, fontSize: 14 },
  hoje: { marginTop: 8, padding: 14, borderRadius: Raio.md, backgroundColor: '#F4F7FF' },
  hojeValor: { fontSize: 24, fontFamily: Fontes.negrito },
});
