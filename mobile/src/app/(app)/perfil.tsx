import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, RefreshControl, StyleSheet, View } from 'react-native';

import { type Gamificacao, NivelCard } from '@/components/nivel-card';
import { Botao, Card, Tela, Texto } from '@/components/ui';
import { Cores, Fontes, Raio } from '@/constants/tema';
import { useAuth } from '@/contexts/auth';
import { useDados } from '@/hooks/use-dados';

type Conquista = { codigo: string; nome: string; descricao: string; icone: string; desbloqueada: boolean };

const EMOJI: Record<string, string> = { trofeu: '🏆', fogo: '🔥', alvo: '🎯', relogio: '⏱', sorriso: '🙂' };

function ItemMenu({ titulo, aoTocar }: { titulo: string; aoTocar: () => void }) {
  return (
    <Pressable accessibilityRole="button" onPress={aoTocar} style={estilos.menuItem}>
      <Texto style={estilos.menuTexto}>{titulo}</Texto>
      <Texto style={estilos.menuSeta}>›</Texto>
    </Pressable>
  );
}

export default function Perfil() {
  const { usuario, sair } = useAuth();
  const status = useDados<Gamificacao>('/gamificacao/status');
  const conquistas = useDados<Conquista[]>('/conquistas');
  const [saindo, setSaindo] = useState(false);

  function confirmarSaida() {
    Alert.alert('Sair da conta?', undefined, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Sair',
        style: 'destructive',
        onPress: async () => {
          setSaindo(true);
          await sair();
        },
      },
    ]);
  }

  const lista = conquistas.dados ?? [];
  const desbloqueadas = lista.filter((c) => c.desbloqueada).length;

  return (
    <Tela
      refreshControl={
        <RefreshControl
          refreshing={status.atualizando}
          onRefresh={() => {
            status.puxarParaAtualizar();
            conquistas.recarregar();
          }}
        />
      }>
      <Texto variante="titulo">Perfil</Texto>

      <Card style={estilos.identidade}>
        <View style={estilos.avatar}>
          <Texto style={estilos.avatarLetra}>{usuario?.nome.charAt(0).toUpperCase()}</Texto>
        </View>
        <Texto variante="secao">{usuario?.nome}</Texto>
        <Texto variante="pequeno">{usuario?.email}</Texto>
        {usuario?.bio ? <Texto style={estilos.bio}>{usuario.bio}</Texto> : null}
      </Card>

      {status.dados && <NivelCard gamificacao={status.dados} />}

      <Card style={{ gap: 0, paddingVertical: 4 }}>
        <ItemMenu titulo="Editar perfil" aoTocar={() => router.push('/editar-perfil')} />
        <ItemMenu titulo="Progresso" aoTocar={() => router.push('/progresso')} />
        <ItemMenu titulo="Configurações" aoTocar={() => router.push('/configuracoes')} />
      </Card>

      <Card>
        <View style={estilos.cabecalhoConquistas}>
          <Texto variante="secao">Conquistas</Texto>
          <Texto variante="pequeno">
            {desbloqueadas} de {lista.length}
          </Texto>
        </View>
        <View style={estilos.grade}>
          {lista.map((c) => (
            <View
              key={c.codigo}
              accessible
              accessibilityLabel={`${c.nome}: ${c.desbloqueada ? 'desbloqueada' : 'bloqueada'}. ${c.descricao}`}
              style={[estilos.conquista, !c.desbloqueada && estilos.bloqueada]}>
              <Texto style={{ fontSize: 26 }}>{c.desbloqueada ? EMOJI[c.icone] ?? '🏆' : '🔒'}</Texto>
              <Texto style={estilos.conquistaNome}>{c.nome}</Texto>
              <Texto variante="pequeno" style={{ textAlign: 'center' }}>
                {c.descricao}
              </Texto>
            </View>
          ))}
        </View>
      </Card>

      <Botao titulo="Sair da conta" variante="perigo" onPress={confirmarSaida} carregando={saindo} />
    </Tela>
  );
}

const estilos = StyleSheet.create({
  identidade: { alignItems: 'center', paddingVertical: 24 },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Cores.primariaEscura,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetra: { color: '#fff', fontSize: 30, fontFamily: Fontes.negrito, lineHeight: 38 },
  bio: { textAlign: 'center', marginTop: 4 },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Cores.borda,
  },
  menuTexto: { fontFamily: Fontes.media, fontSize: 15 },
  menuSeta: { fontSize: 22, color: Cores.textoSecundario },
  cabecalhoConquistas: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  grade: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  conquista: {
    width: '48%',
    flexGrow: 1,
    alignItems: 'center',
    gap: 2,
    padding: 12,
    borderRadius: Raio.md,
    backgroundColor: '#F4F7FF',
  },
  bloqueada: { opacity: 0.6 },
  conquistaNome: { fontFamily: Fontes.seminegrito, fontSize: 13, textAlign: 'center' },
});
