// componentes basicos com o visual do prototipo
import type { PropsWithChildren, ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  type PressableProps,
  ScrollView,
  type ScrollViewProps,
  StyleSheet,
  Text,
  TextInput,
  type TextInputProps,
  type TextProps,
  View,
  type ViewProps,
} from 'react-native';
import { type Edge, SafeAreaView } from 'react-native-safe-area-context';

import { Cores, Espaco, Fontes, Raio } from '@/constants/tema';

type VarianteTexto = 'titulo' | 'subtitulo' | 'secao' | 'corpo' | 'pequeno' | 'rotulo';

export function Texto({ variante = 'corpo', style, ...props }: TextProps & { variante?: VarianteTexto }) {
  return <Text style={[estilos.texto, estilos[variante], style]} {...props} />;
}

// tela com fundo azul claro e rolagem; telas com cabecalho usam edges sem 'top'
export function Tela({
  children,
  contentContainerStyle,
  edges = ['top', 'left', 'right'],
  ...props
}: PropsWithChildren<ScrollViewProps & { edges?: Edge[] }>) {
  return (
    <SafeAreaView style={estilos.tela} edges={edges}>
      <ScrollView
        contentContainerStyle={[estilos.conteudo, contentContainerStyle]}
        keyboardShouldPersistTaps="handled"
        {...props}>
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

export function Card({ style, ...props }: ViewProps) {
  return <View style={[estilos.card, style]} {...props} />;
}

type BotaoProps = PressableProps & {
  titulo: string;
  variante?: 'primario' | 'secundario' | 'perigo';
  carregando?: boolean;
  icone?: ReactNode;
};

export function Botao({ titulo, variante = 'primario', carregando, icone, disabled, style, ...props }: BotaoProps) {
  const desabilitado = disabled || carregando;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!desabilitado, busy: !!carregando }}
      disabled={desabilitado}
      style={(estado) => [
        estilos.botao,
        estilos[`botao_${variante}`],
        estado.pressed && { opacity: 0.85 },
        desabilitado && { opacity: 0.6 },
        typeof style === 'function' ? style(estado) : style,
      ]}
      {...props}>
      {carregando ? (
        <ActivityIndicator color={variante === 'primario' ? '#fff' : Cores.primaria} />
      ) : (
        <>
          {icone}
          <Text style={[estilos.botaoTexto, estilos[`botaoTexto_${variante}`]]}>{titulo}</Text>
        </>
      )}
    </Pressable>
  );
}

export function Campo({ rotulo, style, ...props }: TextInputProps & { rotulo: string }) {
  return (
    <View style={estilos.campoGrupo}>
      <Texto variante="rotulo">{rotulo}</Texto>
      <TextInput
        accessibilityLabel={rotulo}
        placeholderTextColor={Cores.textoFraco}
        style={[estilos.campo, style]}
        {...props}
      />
    </View>
  );
}

export function Caixa({ marcada, aoAlternar, children }: PropsWithChildren<{ marcada: boolean; aoAlternar: () => void }>) {
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked: marcada }}
      onPress={aoAlternar}
      style={estilos.caixaLinha}
      hitSlop={6}>
      <View style={[estilos.caixa, marcada && estilos.caixaMarcada]}>
        {marcada && <Text style={estilos.caixaCheck}>✓</Text>}
      </View>
      <View style={{ flex: 1 }}>{children}</View>
    </Pressable>
  );
}

// texto curto explicando por que um dado e pedido (aviso em camadas - lgpd art. 9)
export function Ajuda({ children }: PropsWithChildren) {
  return (
    <View style={estilos.ajuda}>
      <Texto variante="pequeno" style={{ color: Cores.textoSecundario }}>
        {children}
      </Texto>
    </View>
  );
}

export function MensagemErro({ children }: PropsWithChildren) {
  if (!children) return null;
  return (
    <Texto variante="pequeno" style={{ color: Cores.erro }} accessibilityRole="alert">
      {children}
    </Texto>
  );
}

const estilos = StyleSheet.create({
  texto: { color: Cores.texto, fontFamily: Fontes.regular },
  titulo: { fontSize: 28, fontFamily: Fontes.negrito, lineHeight: 36 },
  subtitulo: { fontSize: 14, color: Cores.textoSecundario },
  secao: { fontSize: 17, fontFamily: Fontes.seminegrito },
  corpo: { fontSize: 15, lineHeight: 22 },
  pequeno: { fontSize: 12, color: Cores.textoSecundario, lineHeight: 18 },
  rotulo: { fontSize: 14, fontFamily: Fontes.seminegrito },

  tela: { flex: 1, backgroundColor: Cores.fundo },
  conteudo: { padding: Espaco.md, paddingBottom: 120, gap: Espaco.md },

  card: { backgroundColor: Cores.card, borderRadius: Raio.lg, padding: Espaco.md, gap: Espaco.sm },

  botao: {
    minHeight: 48,
    borderRadius: Raio.sm,
    paddingHorizontal: Espaco.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Espaco.sm,
  },
  botao_primario: { backgroundColor: Cores.primaria },
  botao_secundario: { backgroundColor: Cores.badge },
  botao_perigo: { backgroundColor: '#FFF1F1', borderWidth: 1, borderColor: '#FCA5A5' },
  botaoTexto: { fontSize: 15, fontFamily: Fontes.seminegrito },
  botaoTexto_primario: { color: '#FFFFFF' },
  botaoTexto_secundario: { color: Cores.primaria },
  botaoTexto_perigo: { color: Cores.erro },

  campoGrupo: { gap: 6 },
  campo: {
    minHeight: 46,
    borderRadius: Raio.sm,
    backgroundColor: Cores.campo,
    paddingHorizontal: 14,
    fontSize: 15,
    fontFamily: Fontes.regular,
    color: Cores.texto,
  },

  ajuda: { backgroundColor: '#F4F7FF', borderRadius: Raio.sm, paddingVertical: 8, paddingHorizontal: 10 },
  caixaLinha: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  caixa: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: Cores.primaria,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  caixaMarcada: { backgroundColor: Cores.primaria },
  caixaCheck: { color: '#FFFFFF', fontSize: 14, fontFamily: Fontes.negrito, lineHeight: 16 },
});
