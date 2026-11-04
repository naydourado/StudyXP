import { StyleSheet, View } from 'react-native';

import { Card, Texto } from '@/components/ui';
import { Cores, Fontes } from '@/constants/tema';

export type Gamificacao = {
  xp_total: number;
  nivel: number;
  xp_no_nivel: number;
  xp_para_proximo: number;
  percentual: number;
  ofensiva_atual: number;
  ofensiva_recorde: number;
};

// card de nivel/xp; os numeros vem prontos do servidor
export function NivelCard({ gamificacao }: { gamificacao: Gamificacao }) {
  return (
    <Card>
      <View style={estilos.linha}>
        <Texto style={estilos.nivel}>Nível {gamificacao.nivel}</Texto>
        <Texto variante="pequeno">
          {gamificacao.xp_no_nivel} / {gamificacao.xp_para_proximo} XP
        </Texto>
      </View>
      <View
        style={estilos.barra}
        accessibilityRole="progressbar"
        accessibilityLabel="Progresso até o próximo nível"
        accessibilityValue={{ min: 0, max: 100, now: Math.round(gamificacao.percentual) }}>
        <View style={[estilos.preenchimento, { width: `${gamificacao.percentual}%` }]} />
      </View>
    </Card>
  );
}

const estilos = StyleSheet.create({
  linha: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  nivel: { fontSize: 17, fontFamily: Fontes.negrito },
  barra: { height: 12, borderRadius: 999, backgroundColor: Cores.barraVazia, overflow: 'hidden' },
  preenchimento: { height: '100%', borderRadius: 999, backgroundColor: Cores.primariaClara },
});
