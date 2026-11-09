import { Pressable, StyleSheet, View } from 'react-native';

import { Texto } from '@/components/ui';
import { nomePrioridade, type Prioridade, textoPrazo } from '@/constants/gamificacao';
import { Cores, Fontes, Raio } from '@/constants/tema';

export type Tarefa = {
  id: number;
  titulo: string;
  descricao?: string | null;
  prioridade: Prioridade;
  status: 'pendente' | 'concluida';
  data_prazo: string | null;
  xp_recompensa: number;
  xp_concedido?: number;
};

type Props = {
  tarefa: Tarefa;
  aoAlternar: (tarefa: Tarefa) => void;
  aoTocar?: (tarefa: Tarefa) => void;
};

export function TarefaItem({ tarefa, aoAlternar, aoTocar }: Props) {
  const concluida = tarefa.status === 'concluida';
  const xp = concluida && tarefa.xp_concedido !== undefined ? tarefa.xp_concedido : tarefa.xp_recompensa;

  return (
    <Pressable
      style={estilos.item}
      disabled={!aoTocar}
      onPress={aoTocar ? () => aoTocar(tarefa) : undefined}
      accessibilityRole={aoTocar ? 'button' : undefined}
      accessibilityHint={aoTocar ? 'Abre a edição da tarefa' : undefined}>
      <Pressable
        accessibilityRole="checkbox"
        accessibilityState={{ checked: concluida }}
        accessibilityLabel={concluida ? `Reabrir ${tarefa.titulo}` : `Concluir ${tarefa.titulo}`}
        hitSlop={10}
        onPress={() => aoAlternar(tarefa)}
        style={[estilos.check, concluida && estilos.checkFeito]}>
        {concluida && <Texto style={estilos.checkMarca}>✓</Texto>}
      </Pressable>

      <View style={{ flex: 1 }}>
        <Texto style={[estilos.titulo, concluida && estilos.riscado]} numberOfLines={2}>
          {tarefa.titulo}
        </Texto>
        <Texto variante="pequeno">
          {textoPrazo(tarefa.data_prazo)} · {nomePrioridade(tarefa.prioridade)}
        </Texto>
      </View>

      <View style={estilos.badge}>
        <Texto style={estilos.badgeTexto}>+{xp}xp</Texto>
      </View>
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#F6F8FF',
    borderRadius: Raio.md,
    padding: 12,
  },
  check: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Cores.primariaClara,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkFeito: { backgroundColor: Cores.primariaClara },
  checkMarca: { color: '#fff', fontSize: 13, fontFamily: Fontes.negrito, lineHeight: 16 },
  titulo: { fontSize: 14, fontFamily: Fontes.media },
  riscado: { textDecorationLine: 'line-through', color: Cores.textoSecundario },
  badge: { backgroundColor: Cores.badge, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3 },
  badgeTexto: { fontSize: 12, color: Cores.primaria, fontFamily: Fontes.seminegrito },
});
