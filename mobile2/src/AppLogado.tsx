// parte do app de quem esta logado: cabecalho no topo, pagina no meio e navbar embaixo
import { Ionicons } from '@expo/vector-icons';
import { ComponentProps, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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
  // altura da barra de navegacao do celular (gestos / botoes do android)
  const { bottom } = useSafeAreaInsets();

  return (
    <View style={estilos.tela}>
      {/* cabecalho: logo e botao de sair */}
      <View style={estilos.topo}>
        <Image source={require('../assets/logo-studyxp.webp')} style={estilos.logo} resizeMode="contain" />
        <View style={{ flex: 1 }} />
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
            <Text style={estilos.textoConstrucao}>Em construção</Text>
          </View>
        )}
      </View>

      {/* navbar */}
      <View style={[estilos.navbar, { marginBottom: bottom + 10 }]}>
        {PAGINAS.map((p) => {
          const ativa = p.id === pagina;
          return (
            <Pressable
              key={p.id}
              style={({ pressed }) => [estilos.aba, pressed && estilos.pressionado]}
              hitSlop={6}
              onPress={() => setPagina(p.id)}
              accessibilityRole="tab"
              accessibilityState={{ selected: ativa }}
              accessibilityLabel={p.nome}
            >
              <View style={[estilos.iconeAba, ativa && estilos.iconeAbaAtivo]}>
                <Ionicons name={ativa ? p.iconeAtivo : p.icone} size={24} color={ativa ? Cores.primaria : '#FFFFFF'} />
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
  botaoIcone: { padding: 8, borderRadius: 12, backgroundColor: Cores.campo },
  pressionado: { opacity: 0.6 },
  conteudo: { flex: 1 },
  construcao: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  textoConstrucao: { fontSize: 18, fontFamily: Fontes.media, color: Cores.textoFraco },
  // navbar roxa (cor do tema) para contrastar com o fundo azul claro
  navbar: {
    flexDirection: 'row',
    backgroundColor: Cores.primaria,
    marginHorizontal: 12,
    marginBottom: 10,
    paddingVertical: 8,
    borderRadius: 22,
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
  },
  aba: { flex: 1, alignItems: 'center', gap: 3 },
  iconeAba: { paddingVertical: 5, paddingHorizontal: 14, borderRadius: 999 },
  iconeAbaAtivo: { backgroundColor: '#FFFFFF' },
  nomeAba: { fontSize: 12, fontFamily: Fontes.media, color: '#FFFFFF' },
  nomeAbaAtivo: { fontFamily: Fontes.negrito },
});
