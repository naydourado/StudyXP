// tela de tarefas: lista (GET), cria (POST) e conclui (POST) tarefas no banco
import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { api, ErroApi } from './api';
import { Cores } from './cores';

type Prioridade = 'baixa' | 'media' | 'alta';

// campos da tarefa que vem da API (ela manda mais, mas so usamos estes)
type Tarefa = {
  id: number;
  titulo: string;
  prioridade: Prioridade;
  status: 'pendente' | 'concluida';
  xp_recompensa: number;
  xp_concedido: number;
};

// o XP de cada prioridade e definido pelo servidor (20, 50 e 80)
const PRIORIDADES: { valor: Prioridade; nome: string }[] = [
  { valor: 'baixa', nome: 'Baixa' },
  { valor: 'media', nome: 'Média' },
  { valor: 'alta', nome: 'Alta' },
];

type Props = { nome: string; aoSair: () => void };

export default function TarefasTela({ nome, aoSair }: Props) {
  const [tarefas, setTarefas] = useState<Tarefa[]>([]);
  const [titulo, setTitulo] = useState('');
  const [prioridade, setPrioridade] = useState<Prioridade>('media');
  const [mensagem, setMensagem] = useState('');
  const [carregando, setCarregando] = useState(true);

  // 401 = o token venceu: volta para o login. Outros erros: mostra a mensagem
  function tratarErro(e: unknown) {
    if (e instanceof ErroApi && e.status === 401) aoSair();
    else setMensagem(e instanceof Error ? e.message : 'Algo deu errado.');
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

  // envia a nova tarefa para o banco e recarrega a lista
  async function adicionar() {
    if (!titulo.trim()) return;
    try {
      await api('/tarefas', 'POST', { titulo: titulo.trim(), prioridade });
      setTitulo('');
      setMensagem('Tarefa criada!');
      await carregar();
    } catch (e) {
      tratarErro(e);
    }
  }

  // conclui no banco; a API responde com o XP ganho
  async function concluir(tarefa: Tarefa) {
    try {
      const resposta = await api<{ xp_ganho: number }>(`/tarefas/${tarefa.id}/concluir`, 'POST');
      setMensagem(`+${resposta.xp_ganho} XP! "${tarefa.titulo}" concluída.`);
      await carregar();
    } catch (e) {
      tratarErro(e);
    }
  }

  return (
    <View style={estilos.tela}>
      <View style={estilos.topo}>
        <Text style={estilos.ola}>Olá, {nome}!</Text>
        <Pressable onPress={aoSair}>
          <Text style={estilos.sair}>Sair</Text>
        </Pressable>
      </View>

      <View style={estilos.card}>
        <TextInput style={estilos.campo} placeholder="Nova tarefa" value={titulo} onChangeText={setTitulo} />
        <View style={estilos.linha}>
          {PRIORIDADES.map((p) => (
            <Pressable
              key={p.valor}
              style={[estilos.chip, prioridade === p.valor && estilos.chipAtivo]}
              onPress={() => setPrioridade(p.valor)}
            >
              <Text style={prioridade === p.valor ? estilos.textoBotao : estilos.textoChip}>{p.nome}</Text>
            </Pressable>
          ))}
        </View>
        <Pressable style={estilos.botao} onPress={adicionar}>
          <Text style={estilos.textoBotao}>Adicionar</Text>
        </Pressable>
      </View>

      {mensagem ? <Text style={estilos.mensagem}>{mensagem}</Text> : null}

      {carregando ? (
        <ActivityIndicator color={Cores.primaria} style={{ marginTop: 24 }} />
      ) : (
        <FlatList
          data={tarefas}
          keyExtractor={(t) => String(t.id)}
          contentContainerStyle={{ gap: 10, paddingBottom: 24 }}
          ListEmptyComponent={<Text style={estilos.detalhe}>Nenhuma tarefa ainda.</Text>}
          renderItem={({ item }) => (
            <View style={estilos.tarefa}>
              <View style={{ flex: 1 }}>
                <Text style={[estilos.tituloTarefa, item.status === 'concluida' && estilos.riscado]}>
                  {item.titulo}
                </Text>
                <Text style={estilos.detalhe}>
                  {item.prioridade} · {item.status === 'concluida' ? `ganhou ${item.xp_concedido}` : item.xp_recompensa} XP
                </Text>
              </View>
              {item.status === 'pendente' ? (
                <Pressable style={estilos.botaoPequeno} onPress={() => concluir(item)}>
                  <Text style={estilos.textoBotao}>Concluir</Text>
                </Pressable>
              ) : (
                <Text style={estilos.feito}>✓</Text>
              )}
            </View>
          )}
        />
      )}
    </View>
  );
}

const estilos = StyleSheet.create({
  tela: { flex: 1, padding: 16, gap: 12 },
  topo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  ola: { fontSize: 22, fontWeight: 'bold', color: Cores.texto },
  sair: { color: Cores.primaria, fontWeight: 'bold', fontSize: 16 },
  card: { backgroundColor: Cores.card, borderRadius: 18, padding: 16, gap: 10 },
  campo: { backgroundColor: Cores.campo, borderRadius: 10, padding: 12, fontSize: 16 },
  linha: { flexDirection: 'row', gap: 8 },
  chip: { flex: 1, borderRadius: 10, padding: 10, alignItems: 'center', backgroundColor: Cores.campo },
  chipAtivo: { backgroundColor: Cores.primaria },
  textoChip: { color: Cores.texto },
  botao: { backgroundColor: Cores.primaria, borderRadius: 10, padding: 12, alignItems: 'center' },
  textoBotao: { color: '#fff', fontWeight: 'bold' },
  mensagem: { color: Cores.sucesso, fontWeight: 'bold', textAlign: 'center' },
  tarefa: { backgroundColor: Cores.card, borderRadius: 14, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 10 },
  tituloTarefa: { fontSize: 16, color: Cores.texto },
  riscado: { textDecorationLine: 'line-through', color: Cores.textoFraco },
  detalhe: { color: Cores.textoFraco, marginTop: 2 },
  botaoPequeno: { backgroundColor: Cores.sucesso, borderRadius: 10, paddingVertical: 8, paddingHorizontal: 12 },
  feito: { color: Cores.sucesso, fontSize: 22, fontWeight: 'bold' },
});
