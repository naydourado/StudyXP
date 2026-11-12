// tela de tarefas: lista (GET), cria (POST), edita (PATCH), exclui (DELETE) e conclui (POST)
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { api, ErroApi } from './api';
import { Cores, Fontes } from './cores';

type Prioridade = 'baixa' | 'media' | 'alta';

// campos da tarefa que vem da API (ela manda mais, mas so usamos estes)
type Tarefa = {
  id: number;
  titulo: string;
  descricao: string | null;
  prioridade: Prioridade;
  status: 'pendente' | 'concluida';
  xp_recompensa: number;
  xp_concedido: number;
};

// o XP de cada prioridade e definido pelo servidor; aqui so mostramos
const PRIORIDADES: { valor: Prioridade; nome: string; xp: number }[] = [
  { valor: 'baixa', nome: 'Baixa', xp: 20 },
  { valor: 'media', nome: 'Média', xp: 50 },
  { valor: 'alta', nome: 'Alta', xp: 80 },
];

const NOME_PRIORIDADE: Record<Prioridade, string> = { baixa: 'Baixa', media: 'Média', alta: 'Alta' };

type Props = { nome: string; aoSair: () => void };

export default function TarefasTela({ nome, aoSair }: Props) {
  const [tarefas, setTarefas] = useState<Tarefa[]>([]);
  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [prioridade, setPrioridade] = useState<Prioridade>('media');
  // tarefa sendo editada; null = o formulario cria uma nova
  const [editando, setEditando] = useState<Tarefa | null>(null);
  const [mensagem, setMensagem] = useState('');
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  // para rolar de volta ao formulario quando clica no lapis
  const lista = useRef<FlatList<Tarefa>>(null);

  // 401 = o token venceu: volta para o login. Outros erros: mostra a mensagem
  function tratarErro(e: unknown) {
    if (e instanceof ErroApi && e.status === 401) aoSair();
    else {
      setMensagem('');
      setErro(e instanceof Error ? e.message : 'Algo deu errado.');
    }
  }

  function avisar(texto: string) {
    setErro('');
    setMensagem(texto);
  }

  // busca as tarefas no banco
  async function carregar() {
    try {
      setTarefas(await api<Tarefa[]>('/tarefas'));
    } catch (e) {
      tratarErro(e);
    } finally {
      setCarregando(false);
    }
  }

  // ao abrir a tela, carrega a lista
  useEffect(() => {
    carregar();
  }, []);

  function limparFormulario() {
    setTitulo('');
    setDescricao('');
    setPrioridade('media');
    setEditando(null);
  }

  // lapis: joga a tarefa no formulario para editar
  function comecarEdicao(tarefa: Tarefa) {
    setEditando(tarefa);
    setTitulo(tarefa.titulo);
    setDescricao(tarefa.descricao ?? '');
    setPrioridade(tarefa.prioridade);
    setErro('');
    setMensagem('');
    lista.current?.scrollToOffset({ offset: 0, animated: true });
  }

  // cria (POST) ou salva a edicao (PATCH) e recarrega a lista
  async function salvar() {
    if (!titulo.trim()) {
      setMensagem('');
      setErro('Dê um título para a tarefa.');
      return;
    }
    const corpo = { titulo: titulo.trim(), descricao: descricao.trim() || null, prioridade };
    setSalvando(true);
    try {
      if (editando) {
        await api(`/tarefas/${editando.id}`, 'PATCH', corpo);
        avisar('Tarefa atualizada!');
      } else {
        await api('/tarefas', 'POST', corpo);
        avisar('Tarefa criada!');
      }
      limparFormulario();
      await carregar();
    } catch (e) {
      tratarErro(e);
    } finally {
      setSalvando(false);
    }
  }

  // certinho: conclui a tarefa; clicando de novo, reabre (para cliques por engano).
  // a API devolve o XP ganho (ou estornado, negativo, ao reabrir)
  async function alternarConclusao(tarefa: Tarefa) {
    const reabrir = tarefa.status === 'concluida';
    try {
      const resposta = await api<{ xp_ganho: number }>(
        `/tarefas/${tarefa.id}/${reabrir ? 'reabrir' : 'concluir'}`,
        'POST',
      );
      avisar(
        reabrir
          ? `"${tarefa.titulo}" voltou para pendente (${resposta.xp_ganho} XP).`
          : `+${resposta.xp_ganho} XP! "${tarefa.titulo}" concluída.`,
      );
      await carregar();
    } catch (e) {
      tratarErro(e);
    }
  }

  // lixeira: pede confirmacao e exclui no banco
  function excluir(tarefa: Tarefa) {
    Alert.alert('Excluir tarefa', `Excluir "${tarefa.titulo}"? Não dá para desfazer.`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: async () => {
          try {
            await api(`/tarefas/${tarefa.id}`, 'DELETE');
            if (editando?.id === tarefa.id) limparFormulario();
            avisar('Tarefa excluída.');
            await carregar();
          } catch (e) {
            tratarErro(e);
          }
        },
      },
    ]);
  }

  // saudacao + formulario: vao no topo da lista e rolam junto com as tarefas
  const topoDaLista = (
    <View style={estilos.topoLista}>
      {/* saudacao, entre o cabecalho e o formulario */}
      <View>
        <Text style={estilos.ola} numberOfLines={1}>
          Olá, {nome}! 👋
        </Text>
        <Text style={estilos.subtitulo}>Bora ganhar XP hoje?</Text>
      </View>

      {/* formulario: cria ou edita */}
      <View style={estilos.card}>
        <Text style={estilos.tituloCard}>{editando ? 'Editar tarefa' : 'Nova tarefa'}</Text>

        <Text style={estilos.rotulo}>Título</Text>
        <TextInput
          style={estilos.campo}
          placeholder="Ex.: Revisar capítulo 3"
          placeholderTextColor={Cores.textoFraco}
          value={titulo}
          onChangeText={setTitulo}
          maxLength={120}
          returnKeyType="next"
        />

        <Text style={estilos.rotulo}>Descrição (opcional)</Text>
        <TextInput
          style={[estilos.campo, estilos.campoGrande]}
          placeholder="Detalhes da tarefa"
          placeholderTextColor={Cores.textoFraco}
          value={descricao}
          onChangeText={setDescricao}
          multiline
          maxLength={500}
          textAlignVertical="top"
        />

        <Text style={estilos.rotulo}>Prioridade</Text>
        <View style={estilos.linha}>
          {PRIORIDADES.map((p) => {
            const ativo = prioridade === p.valor;
            return (
              <Pressable
                key={p.valor}
                style={[estilos.chip, ativo && estilos.chipAtivo]}
                onPress={() => setPrioridade(p.valor)}
                accessibilityRole="radio"
                accessibilityState={{ selected: ativo }}
              >
                <Text style={[estilos.textoChip, ativo && estilos.textoBranco]}>{p.nome}</Text>
                <Text style={[estilos.xpChip, ativo && estilos.textoBranco]}>{p.xp} XP</Text>
              </Pressable>
            );
          })}
        </View>

        {erro ? <Text style={estilos.erro}>{erro}</Text> : null}

        <View style={estilos.linha}>
          {editando ? (
            <Pressable style={[estilos.botao, estilos.botaoSecundario]} onPress={limparFormulario}>
              <Text style={estilos.textoSecundario}>Cancelar</Text>
            </Pressable>
          ) : null}
          <Pressable
            style={({ pressed }) => [estilos.botao, (pressed || salvando) && estilos.pressionado]}
            onPress={salvar}
            disabled={salvando}
          >
            {salvando ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name={editando ? 'save-outline' : 'add'} size={20} color="#fff" />
                <Text style={estilos.textoBranco}>{editando ? 'Salvar' : 'Adicionar'}</Text>
              </>
            )}
          </Pressable>
        </View>
      </View>

      {mensagem ? <Text style={estilos.mensagem}>{mensagem}</Text> : null}
    </View>
  );

  // a tela inteira rola: saudacao, formulario e lista de tarefas
  return (
    <FlatList
      ref={lista}
      style={estilos.tela}
      data={carregando ? [] : tarefas}
      keyExtractor={(t) => String(t.id)}
      contentContainerStyle={estilos.conteudoLista}
      keyboardShouldPersistTaps="handled"
      ListHeaderComponent={topoDaLista}
      ListEmptyComponent={
        carregando ? (
          <ActivityIndicator color={Cores.primaria} style={{ marginTop: 24 }} />
        ) : (
          <Text style={estilos.vazio}>Nenhuma tarefa ainda.</Text>
        )
      }
      renderItem={({ item }) => {
        const concluida = item.status === 'concluida';
        return (
          <View style={[estilos.tarefa, editando?.id === item.id && estilos.tarefaEditando]}>
            <View style={{ flex: 1 }}>
              <Text style={[estilos.tituloTarefa, concluida && estilos.riscado]}>{item.titulo}</Text>
              {item.descricao ? (
                <Text style={estilos.descricao} numberOfLines={2}>
                  {item.descricao}
                </Text>
              ) : null}
              <Text style={estilos.detalhe}>
                {NOME_PRIORIDADE[item.prioridade]} ·{' '}
                {concluida ? `ganhou ${item.xp_concedido}` : item.xp_recompensa} XP
              </Text>
            </View>

            <View style={estilos.acoes}>
              {/* certinho: vazio = pendente; verde cheio = concluida (toque de novo reabre) */}
              <Pressable
                style={({ pressed }) => [
                  estilos.acao,
                  concluida ? estilos.acaoConcluida : estilos.acaoConcluir,
                  pressed && estilos.pressionado,
                ]}
                onPress={() => alternarConclusao(item)}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: concluida }}
                accessibilityLabel={concluida ? `Reabrir ${item.titulo}` : `Concluir ${item.titulo}`}
              >
                <Ionicons name="checkmark" size={20} color={concluida ? '#fff' : Cores.sucesso} />
              </Pressable>
              {!concluida ? (
                <Pressable
                  style={({ pressed }) => [estilos.acao, estilos.acaoEditar, pressed && estilos.pressionado]}
                  onPress={() => comecarEdicao(item)}
                  accessibilityRole="button"
                  accessibilityLabel={`Editar ${item.titulo}`}
                >
                  <Ionicons name="pencil" size={18} color={Cores.primaria} />
                </Pressable>
              ) : null}
              <Pressable
                style={({ pressed }) => [estilos.acao, estilos.acaoExcluir, pressed && estilos.pressionado]}
                onPress={() => excluir(item)}
                accessibilityRole="button"
                accessibilityLabel={`Excluir ${item.titulo}`}
              >
                <Ionicons name="trash-outline" size={18} color={Cores.erro} />
              </Pressable>
            </View>
          </View>
        );
      }}
    />
  );
}

const estilos = StyleSheet.create({
  tela: { flex: 1 },
  conteudoLista: { padding: 16, paddingBottom: 24, gap: 10 },
  topoLista: { gap: 12, marginBottom: 2 },
  ola: { fontSize: 24, fontFamily: Fontes.negrito, color: Cores.primaria },
  subtitulo: { fontSize: 14, fontFamily: Fontes.regular, color: Cores.textoFraco, marginTop: -2 },
  pressionado: { opacity: 0.6 },
  card: { backgroundColor: Cores.card, borderRadius: 18, padding: 16, gap: 8 },
  tituloCard: { fontSize: 17, fontWeight: 'bold', color: Cores.texto, marginBottom: 2 },
  rotulo: { fontSize: 13, fontWeight: '600', color: Cores.textoFraco, marginTop: 4 },
  campo: { backgroundColor: Cores.campo, borderRadius: 10, padding: 12, fontSize: 16, color: Cores.texto },
  campoGrande: { minHeight: 70 },
  linha: { flexDirection: 'row', gap: 8 },
  chip: { flex: 1, borderRadius: 10, paddingVertical: 8, alignItems: 'center', backgroundColor: Cores.campo },
  chipAtivo: { backgroundColor: Cores.primaria },
  textoChip: { color: Cores.texto, fontWeight: '600' },
  xpChip: { color: Cores.textoFraco, fontSize: 12, marginTop: 2 },
  textoBranco: { color: '#fff', fontWeight: 'bold' },
  botao: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Cores.primaria,
    borderRadius: 10,
    padding: 12,
    marginTop: 6,
  },
  botaoSecundario: { backgroundColor: Cores.campo },
  textoSecundario: { color: Cores.primaria, fontWeight: 'bold' },
  erro: { color: Cores.erro, fontWeight: '600' },
  mensagem: { color: Cores.sucesso, fontWeight: 'bold', textAlign: 'center' },
  vazio: { color: Cores.textoFraco, textAlign: 'center', marginTop: 16 },
  tarefa: {
    backgroundColor: Cores.card,
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  tarefaEditando: { borderColor: Cores.primaria },
  tituloTarefa: { fontSize: 16, fontWeight: '600', color: Cores.texto },
  riscado: { textDecorationLine: 'line-through', color: Cores.textoFraco },
  descricao: { color: Cores.texto, marginTop: 2 },
  detalhe: { color: Cores.textoFraco, marginTop: 4, fontSize: 13 },
  acoes: { flexDirection: 'row', gap: 6 },
  acao: { width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  acaoConcluir: { backgroundColor: '#E7F6EC', borderWidth: 2, borderColor: Cores.sucesso },
  acaoConcluida: { backgroundColor: Cores.sucesso, borderWidth: 2, borderColor: Cores.sucesso },
  acaoEditar: { backgroundColor: Cores.campo },
  acaoExcluir: { backgroundColor: '#FDECEC' },
});
