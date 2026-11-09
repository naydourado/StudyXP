// mostra a politica de privacidade ou os termos de uso dentro do app
// texto vindo de docs/legal/conteudo.json (fonte unica); edite la e rode: node scripts/sincronizar-legal.mjs
import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Card, Tela, Texto } from '@/components/ui';
import { Cores, Fontes, Raio } from '@/constants/tema';
import conteudo from '@/legal/conteudo.json';

type Bloco =
  | { tipo: 'paragrafo'; texto: string }
  | { tipo: 'lista'; itens: string[] }
  | { tipo: 'tabela'; cabecalho: string[]; linhas: string[][] };

type Documento = { titulo: string; resumo: string[]; secoes: { titulo: string; blocos: Bloco[] }[] };

function preencher(texto: string) {
  return texto.replaceAll('{controlador}', conteudo.controlador).replaceAll('{contato}', conteudo.contato);
}

// no celular a tabela vira uma lista de cartoes ("coluna: valor"), mais facil de ler que rolar para o lado
function Tabela({ cabecalho, linhas }: { cabecalho: string[]; linhas: string[][] }) {
  return (
    <View style={{ gap: 8 }}>
      {linhas.map((linha) => (
        <View key={linha[0]} style={estilos.linhaTabela}>
          <Texto style={estilos.linhaTitulo}>{preencher(linha[0])}</Texto>
          {linha.slice(1).map((celula, i) => (
            <Texto key={i} variante="pequeno">
              <Texto variante="pequeno" style={estilos.rotulo}>
                {cabecalho[i + 1]}:{' '}
              </Texto>
              {preencher(celula)}
            </Texto>
          ))}
        </View>
      ))}
    </View>
  );
}

function Conteudo({ bloco }: { bloco: Bloco }) {
  if (bloco.tipo === 'lista') {
    return (
      <View style={{ gap: 4 }}>
        {bloco.itens.map((item) => (
          <Texto key={item} variante="pequeno">
            • {preencher(item)}
          </Texto>
        ))}
      </View>
    );
  }
  if (bloco.tipo === 'tabela') return <Tabela cabecalho={bloco.cabecalho} linhas={bloco.linhas} />;
  return <Texto style={estilos.paragrafo}>{preencher(bloco.texto)}</Texto>;
}

export function DocumentoLegal({ tipo }: { tipo: 'privacidade' | 'termos' }) {
  const documento = conteudo[tipo] as Documento;
  const outro = tipo === 'privacidade' ? 'termos' : 'privacidade';

  return (
    <Tela edges={['left', 'right']}>
      <Texto variante="pequeno">
        Versão {conteudo.versao} · Vigente desde {conteudo.vigente_desde}
      </Texto>

      <View style={estilos.resumo}>
        <Texto variante="secao" accessibilityRole="header">
          Resumo
        </Texto>
        {documento.resumo.map((item) => (
          <Texto key={item} variante="pequeno">
            • {preencher(item)}
          </Texto>
        ))}
      </View>

      {documento.secoes.map((secao) => (
        <Card key={secao.titulo}>
          <Texto variante="secao" accessibilityRole="header">
            {secao.titulo}
          </Texto>
          {secao.blocos.map((bloco, i) => (
            <Conteudo key={i} bloco={bloco} />
          ))}
        </Card>
      ))}

      <Texto
        accessibilityRole="link"
        style={estilos.link}
        onPress={() => router.replace(outro === 'termos' ? '/termos' : '/privacidade')}>
        Ler também: {conteudo[outro].titulo}
      </Texto>
    </Tela>
  );
}

const estilos = StyleSheet.create({
  resumo: { gap: 6, padding: 16, borderRadius: Raio.lg, backgroundColor: '#F4F7FF' },
  paragrafo: { fontSize: 14, lineHeight: 21 },
  linhaTabela: { gap: 2, padding: 10, borderRadius: Raio.sm, backgroundColor: '#F6F8FF' },
  linhaTitulo: { fontFamily: Fontes.seminegrito, fontSize: 13 },
  rotulo: { fontFamily: Fontes.seminegrito, color: Cores.texto },
  link: { color: Cores.primaria, fontFamily: Fontes.seminegrito, textAlign: 'center', paddingVertical: 8 },
});
