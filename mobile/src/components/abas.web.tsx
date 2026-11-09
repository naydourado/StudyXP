// versao web das abas (apenas para conferir o layout no navegador durante o desenvolvimento)
import { TabList, TabSlot, TabTrigger, type TabTriggerSlotProps, Tabs } from 'expo-router/ui';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Cores, Fontes } from '@/constants/tema';

function BotaoAba({ children, isFocused, onPress, onLongPress }: TabTriggerSlotProps) {
  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityState={{ selected: !!isFocused }}
      onPress={onPress}
      onLongPress={onLongPress}
      style={[estilos.botao, isFocused && estilos.ativo]}>
      <Text style={[estilos.texto, isFocused && estilos.textoAtivo]}>{children}</Text>
    </Pressable>
  );
}

export default function Abas() {
  return (
    <Tabs>
      <TabSlot style={{ flex: 1 }} />
      <TabList asChild>
        <View style={estilos.barra}>
          <TabTrigger name="index" href="/" asChild>
            <BotaoAba>Início</BotaoAba>
          </TabTrigger>
          <TabTrigger name="tarefas" href="/tarefas" asChild>
            <BotaoAba>Tarefas</BotaoAba>
          </TabTrigger>
          <TabTrigger name="foco" href="/foco" asChild>
            <BotaoAba>Foco</BotaoAba>
          </TabTrigger>
          <TabTrigger name="humor" href="/humor" asChild>
            <BotaoAba>Humor</BotaoAba>
          </TabTrigger>
          <TabTrigger name="perfil" href="/perfil" asChild>
            <BotaoAba>Perfil</BotaoAba>
          </TabTrigger>
        </View>
      </TabList>
    </Tabs>
  );
}

const estilos = StyleSheet.create({
  barra: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: Cores.card,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: Cores.borda,
  },
  botao: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 12 },
  ativo: { backgroundColor: Cores.badge },
  texto: { fontFamily: Fontes.media, color: Cores.textoSecundario, fontSize: 13 },
  textoAtivo: { color: Cores.primaria },
});
