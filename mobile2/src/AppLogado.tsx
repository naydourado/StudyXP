// parte do app de quem esta logado: cabecalho no topo, pagina no meio e navbar embaixo
import { Ionicons } from '@expo/vector-icons';
import { ComponentProps, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { Cores, Fontes } from './cores';
import TarefasTela from './TarefasTela';

type NomeIcone = ComponentProps<typeof Ionicons>['name'];
type Pagina = 'inicio' | 'tarefas' | 'foco' | 'humor' | 'perfil';

// as mesmas paginas do app completo; nesta versao so Tarefas funciona
const PAGINAS: { id: Pagina; nome: string; icone: NomeIcone; iconeAtivo: NomeIcone }[] = [
  { id: 'inicio', nome: 'Início', icone: 'home-outline', iconeAtivo: 'home' },
  { id: 'tarefas', nome: 'Tarefas', icone: 'checkmark-circle-outline', iconeAtivo: 'checkmark-circle' },
  { id: 'foco', nome: 'Foco', icone: 'timer-outline', iconeAtivo: 'timer' },
  { id: 'humor', nome: 'Humor', icone: 'happy-outline', iconeAtivo: 'happy' },
  { id: 'perfil', nome: 'Perfil', icone: 'person-outline', iconeAtivo: 'person' },
];

type Props = { nome: string; aoSair: () => void };

export default function AppLogado({ nome, aoSair }: Props) {
  const [pagina, setPagina] = useState<Pagina>('tarefas');
  const atual = PAGINAS.find((p) => p.id === pagina)!;

  return (
    <View style={estilos.tela}>
      {/* cabecalho: logo e botao de sair */}
      <View style={estilos.topo}>
        <Image source={require('../assets/logo-studyxp.webp')} style={estilos.logo} resizeMode="contain" />
        <Text style={estilos.marca}>StudyXP</Text>
        <Pressable
          onPress={aoSair}
          style={({ pressed }) => [estilos.botaoIcone, pressed && estilos.pressionado]}
          accessibilityRole="button"
          accessibilityLabel="Sair"
          hitSlop={8}
        >
          <Ionicons name="log-out-outline" size={24} color={Cores.primaria} />
        </Pressable>
      </View>

      {/* pagina escolhida na navbar */}
      <View style={estilos.conteudo}>
        {pagina === 'tarefas' ? (
          <TarefasTela nome={nome} aoSair={aoSair} />
        ) : (
          <View style={estilos.construcao}>
            <Ionicons name="construct-outline" size={48} color={Cores.primaria} />
            <Text style={estilos.tituloConstrucao}>{atual.nome}</Text>
            <Text style={estilos.textoConstrucao}>Em construção</Text>
          </View>
        )}
      </View>

      {/* navbar */}
      <View style={estilos.navbar}>
        {PAGINAS.map((p) => {
          const ativa = p.id === pagina;
          return (
            <Pressable
              key={p.id}
              style={estilos.aba}
              onPress={() => setPagina(p.id)}
              accessibilityRole="tab"
              accessibilityState={{ selected: ativa }}
              accessibilityLabel={p.nome}
            >
              <View style={[estilos.iconeAba, ativa && estilos.iconeAbaAtivo]}>
                <Ionicons
                  name={ativa ? p.iconeAtivo : p.icone}
                  size={22}
                  color={ativa ? Cores.primaria : Cores.textoFraco}
                />
              </View>
              <Text style={[estilos.nomeAba, ativa && estilos.nomeAbaAtivo]}>{p.nome}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const estilos = StyleSheet.create({
  tela: { flex: 1 },
  topo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: Cores.card,
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 18,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  logo: { width: 40, height: 40 },
  marca: { flex: 1, fontSize: 20, fontFamily: Fontes.negrito, color: Cores.primaria },
  botaoIcone: { padding: 8, borderRadius: 12, backgroundColor: Cores.campo },
  pressionado: { opacity: 0.6 },
  conteudo: { flex: 1 },
  construcao: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8, padding: 24 },
  tituloConstrucao: { fontSize: 22, fontFamily: Fontes.negrito, color: Cores.texto },
  textoConstrucao: {
    fontSize: 15,
    fontFamily: Fontes.seminegrito,
    color: Cores.primaria,
    backgroundColor: Cores.card,
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 999,
    overflow: 'hidden',
  },
  navbar: {
    flexDirection: 'row',
    backgroundColor: Cores.card,
    paddingTop: 8,
    paddingBottom: 6,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
  },
  aba: { flex: 1, alignItems: 'center', gap: 2 },
  iconeAba: { paddingVertical: 4, paddingHorizontal: 16, borderRadius: 999 },
  iconeAbaAtivo: { backgroundColor: Cores.campo },
  nomeAba: { fontSize: 12, fontFamily: Fontes.media, color: Cores.textoFraco },
  nomeAbaAtivo: { color: Cores.primaria, fontFamily: Fontes.seminegrito },
});
