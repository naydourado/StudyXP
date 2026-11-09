import { useState } from 'react';
import { Alert, Modal, Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { SeletorData } from '@/components/seletor-data';
import { type Tarefa, TarefaItem } from '@/components/tarefa-item';
import { Botao, Campo, Card, MensagemErro, Tela, Texto } from '@/components/ui';
import { PRIORIDADES, type Prioridade, XP_POR_PRIORIDADE } from '@/constants/gamificacao';
import { Cores, Fontes, Raio } from '@/constants/tema';
import { useDados } from '@/hooks/use-dados';
import { api, mensagemDeErro } from '@/services/api';
import { comemorar } from '@/services/feedback';

type Formulario = { titulo: string; descricao: string; prioridade: Prioridade; data_prazo: string | null };

const VAZIO: Formulario = { titulo: '', descricao: '', prioridade: 'media', data_prazo: null };

function Opcao({ ativa, titulo, detalhe, aoTocar }: { ativa: boolean; titulo: string; detalhe?: string; aoTocar: () => void }) {
  return (
    <Pressable
      accessibilityRole="radio"
      aria-checked={ativa}
      onPress={aoTocar}
      style={[estilos.opcao, ativa && estilos.opcaoAtiva]}>
      <Texto style={[estilos.opcaoTexto, ativa && { color: '#fff' }]}>{titulo}</Texto>
      {detalhe ? <Texto style={[estilos.opcaoDetalhe, ativa && { color: '#E6E9FF' }]}>{detalhe}</Texto> : null}
    </Pressable>
  );
}

export default function Tarefas() {
  const { dados, erro, recarregar, atualizando, puxarParaAtualizar } = useDados<Tarefa[]>('/tarefas?size=100');
  const [erroAcao, setErroAcao] = useState('');

  const [modalAberto, setModalAberto] = useState(false);
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [form, setForm] = useState<Formulario>(VAZIO);
  const [erroForm, setErroForm] = useState('');
  const [salvando, setSalvando] = useState(false);

  function abrir(tarefa?: Tarefa) {
    setEditandoId(tarefa?.id ?? null);
    setForm(
      tarefa
        ? {
            titulo: tarefa.titulo,
            descricao: tarefa.descricao ?? '',
            prioridade: tarefa.prioridade,
            data_prazo: tarefa.data_prazo,
          }
        : VAZIO,
    );
    setErroForm('');
    setModalAberto(true);
  }

  function alterar<K extends keyof Formulario>(campo: K, valor: Formulario[K]) {
    setForm((atual) => ({ ...atual, [campo]: valor }));
  }

  async function salvar() {
    if (!form.titulo.trim()) {
      setErroForm('Informe o título da tarefa.');
      return;
    }
    setSalvando(true);
    const corpo = {
      titulo: form.titulo.trim(),
      descricao: form.descricao.trim() || null,
      prioridade: form.prioridade,
      data_prazo: form.data_prazo,
    };
    try {
      if (editandoId) {
        await api(`/tarefas/${editandoId}`, { metodo: 'PATCH', corpo });
      } else {
        await api('/tarefas', { metodo: 'POST', corpo });
      }
      setModalAberto(false);
      recarregar();
    } catch (error) {
      setErroForm(mensagemDeErro(error, 'Erro ao salvar tarefa.'));
    } finally {
      setSalvando(false);
    }
  }

  function excluir() {
    Alert.alert('Excluir esta tarefa?', undefined, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: async () => {
          try {
            await api(`/tarefas/${editandoId}`, { metodo: 'DELETE' });
            setModalAberto(false);
            recarregar();
          } catch (error) {
            setErroForm(mensagemDeErro(error));
          }
        },
      },
    ]);
  }

  async function alternar(tarefa: Tarefa) {
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

  const pendentes = dados?.filter((t) => t.status === 'pendente') ?? [];
  const concluidas = dados?.filter((t) => t.status === 'concluida') ?? [];

  return (
    <View style={{ flex: 1 }}>
      <Tela refreshControl={<RefreshControl refreshing={atualizando} onRefresh={puxarParaAtualizar} />}>
        <View>
          <Texto variante="titulo">Tarefas</Texto>
          <Texto variante="subtitulo">Toque numa tarefa para editar.</Texto>
        </View>

        <MensagemErro>{erro || erroAcao}</MensagemErro>

        <Card>
          <Texto variante="secao">Pendentes ({pendentes.length})</Texto>
          {pendentes.map((tarefa) => (
            <TarefaItem key={tarefa.id} tarefa={tarefa} aoAlternar={alternar} aoTocar={abrir} />
          ))}
          {dados && pendentes.length === 0 && <Texto variante="pequeno">Nenhuma tarefa pendente.</Texto>}
        </Card>

        <Card>
          <Texto variante="secao">Concluídas ({concluidas.length})</Texto>
          {concluidas.map((tarefa) => (
            <TarefaItem key={tarefa.id} tarefa={tarefa} aoAlternar={alternar} aoTocar={abrir} />
          ))}
          {dados && concluidas.length === 0 && <Texto variante="pequeno">Nenhuma tarefa concluída.</Texto>}
        </Card>
      </Tela>

      <Pressable accessibilityRole="button" accessibilityLabel="Nova tarefa" style={estilos.fab} onPress={() => abrir()}>
        <Texto style={estilos.fabTexto}>+</Texto>
      </Pressable>

      <Modal visible={modalAberto} animationType="slide" transparent onRequestClose={() => setModalAberto(false)}>
        <View style={estilos.fundoModal}>
          <SafeAreaView edges={['bottom']} style={estilos.folha}>
            <ScrollView contentContainerStyle={{ gap: 12 }} keyboardShouldPersistTaps="handled">
              <Texto variante="secao">{editandoId ? 'Editar Tarefa' : 'Nova Tarefa'}</Texto>

              <Campo
                rotulo="Título"
                placeholder="Ex: Estudar React"
                value={form.titulo}
                onChangeText={(v) => alterar('titulo', v)}
                maxLength={150}
              />
              <Campo
                rotulo="Descrição"
                placeholder="Opcional"
                value={form.descricao}
                onChangeText={(v) => alterar('descricao', v)}
                maxLength={1000}
                multiline
                style={{ minHeight: 70, paddingTop: 10, textAlignVertical: 'top' }}
              />

              <Texto variante="rotulo">Prioridade</Texto>
              <View style={estilos.opcoes} accessibilityRole="radiogroup">
                {PRIORIDADES.map((p) => (
                  <Opcao
                    key={p.valor}
                    ativa={form.prioridade === p.valor}
                    titulo={p.nome}
                    detalhe={`${XP_POR_PRIORIDADE[p.valor]} XP`}
                    aoTocar={() => alterar('prioridade', p.valor)}
                  />
                ))}
              </View>

              <Texto variante="rotulo">Prazo</Texto>
              <SeletorData valor={form.data_prazo} aoMudar={(v) => alterar('data_prazo', v)} />

              <MensagemErro>{erroForm}</MensagemErro>

              <View style={estilos.acoes}>
                <Botao titulo="Cancelar" variante="secundario" style={{ flex: 1 }} onPress={() => setModalAberto(false)} />
                <Botao titulo={editandoId ? 'Salvar' : 'Criar tarefa'} style={{ flex: 1 }} onPress={salvar} carregando={salvando} />
              </View>
              {editandoId && <Botao titulo="Excluir tarefa" variante="perigo" onPress={excluir} />}
            </ScrollView>
          </SafeAreaView>
        </View>
      </Modal>
    </View>
  );
}

const estilos = StyleSheet.create({
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 24,
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: Cores.primaria,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  fabTexto: { color: '#fff', fontSize: 30, lineHeight: 34, fontFamily: Fontes.media },
  fundoModal: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(17, 24, 39, 0.45)' },
  folha: {
    maxHeight: '90%',
    backgroundColor: Cores.card,
    borderTopLeftRadius: Raio.lg,
    borderTopRightRadius: Raio.lg,
    padding: 20,
  },
  opcoes: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  opcao: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: Raio.sm,
    backgroundColor: Cores.campo,
    alignItems: 'center',
  },
  opcaoAtiva: { backgroundColor: Cores.primaria },
  opcaoTexto: { fontSize: 13, fontFamily: Fontes.seminegrito, color: Cores.texto },
  opcaoDetalhe: { fontSize: 11, color: Cores.textoSecundario },
  acoes: { flexDirection: 'row', gap: 12, marginTop: 4 },
});
