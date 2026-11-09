// graficos simples em svg (linha e barras) para a tela de progresso
import type { PropsWithChildren } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, G, Line, Path, Rect, Text as SvgText } from 'react-native-svg';

import { Cores } from '@/constants/tema';

export type Ponto = { rotulo: string; valor: number };

type Props = { dados: Ponto[]; altura?: number; largura?: number; descricao: string };

const MARGEM = { topo: 16, base: 24, esquerda: 32, direita: 12 };

function escala(dados: Ponto[]) {
  const maximo = Math.max(1, ...dados.map((d) => d.valor));
  // arredonda o topo do eixo para um numero "redondo"
  const passo = maximo <= 4 ? 1 : Math.ceil(maximo / 4);
  return { topo: passo * 4, passo };
}

function Eixos({ dados, largura, altura, passo }: { dados: Ponto[]; largura: number; altura: number; passo: number }) {
  const util = altura - MARGEM.topo - MARGEM.base;
  const larguraUtil = largura - MARGEM.esquerda - MARGEM.direita;
  return (
    <>
      {[0, 1, 2, 3, 4].map((i) => {
        const y = MARGEM.topo + util - (util * i) / 4;
        return (
          <G key={`g${i}`}>
            <Line x1={MARGEM.esquerda} x2={largura - MARGEM.direita} y1={y} y2={y} stroke={Cores.borda} strokeWidth={1} />
            <SvgText x={MARGEM.esquerda - 6} y={y + 4} fontSize={10} fill={Cores.textoSecundario} textAnchor="end">
              {String(passo * i)}
            </SvgText>
          </G>
        );
      })}
      {dados.map((d, i) => (
        <SvgText
          key={d.rotulo + i}
          x={MARGEM.esquerda + (larguraUtil * (i + 0.5)) / dados.length}
          y={altura - 6}
          fontSize={10}
          fill={Cores.textoSecundario}
          textAnchor="middle">
          {d.rotulo}
        </SvgText>
      ))}
    </>
  );
}

export function GraficoLinha({ dados, altura = 180, largura = 320, descricao }: Props) {
  const { topo, passo } = escala(dados);
  const util = altura - MARGEM.topo - MARGEM.base;
  const larguraUtil = largura - MARGEM.esquerda - MARGEM.direita;
  const pontos = dados.map((d, i) => ({
    x: MARGEM.esquerda + (larguraUtil * (i + 0.5)) / dados.length,
    y: MARGEM.topo + util - (util * Math.max(0, d.valor)) / topo,
  }));
  const caminho = pontos.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');

  return (
    <View accessible accessibilityRole="image" accessibilityLabel={descricao} style={estilos.caixa}>
      <Svg width="100%" height={altura} viewBox={`0 0 ${largura} ${altura}`}>
        <Eixos dados={dados} largura={largura} altura={altura} passo={passo} />
        <Path d={caminho} stroke={Cores.primariaClara} strokeWidth={2.5} fill="none" />
        {pontos.map((p, i) => (
          <Circle key={i} cx={p.x} cy={p.y} r={4} fill={Cores.primariaClara} />
        ))}
      </Svg>
    </View>
  );
}

export function GraficoBarras({ dados, altura = 180, largura = 320, descricao }: Props) {
  const { topo, passo } = escala(dados);
  const util = altura - MARGEM.topo - MARGEM.base;
  const larguraUtil = largura - MARGEM.esquerda - MARGEM.direita;
  const larguraBarra = Math.min(28, (larguraUtil / dados.length) * 0.6);

  return (
    <View accessible accessibilityRole="image" accessibilityLabel={descricao} style={estilos.caixa}>
      <Svg width="100%" height={altura} viewBox={`0 0 ${largura} ${altura}`}>
        <Eixos dados={dados} largura={largura} altura={altura} passo={passo} />
        {dados.map((d, i) => {
          const h = (util * Math.max(0, d.valor)) / topo;
          const x = MARGEM.esquerda + (larguraUtil * (i + 0.5)) / dados.length - larguraBarra / 2;
          return (
            <Rect key={i} x={x} y={MARGEM.topo + util - h} width={larguraBarra} height={h} rx={5} fill={Cores.primariaClara} />
          );
        })}
      </Svg>
    </View>
  );
}

// anel de progresso do temporizador de foco
export function AnelProgresso({ progresso, tamanho = 220, children }: PropsWithChildren<{ progresso: number; tamanho?: number }>) {
  const espessura = 14;
  const raio = (tamanho - espessura) / 2;
  const circunferencia = 2 * Math.PI * raio;
  const preenchido = circunferencia * Math.min(1, Math.max(0, progresso));

  return (
    <View style={{ width: tamanho, height: tamanho, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={tamanho} height={tamanho} style={StyleSheet.absoluteFill}>
        <Circle cx={tamanho / 2} cy={tamanho / 2} r={raio} stroke="#EEF2FF" strokeWidth={espessura} fill="none" />
        <Circle
          cx={tamanho / 2}
          cy={tamanho / 2}
          r={raio}
          stroke={Cores.primariaClara}
          strokeWidth={espessura}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${preenchido} ${circunferencia}`}
          transform={`rotate(-90 ${tamanho / 2} ${tamanho / 2})`}
        />
      </Svg>
      {children}
    </View>
  );
}

const estilos = StyleSheet.create({
  caixa: { width: '100%' },
});
