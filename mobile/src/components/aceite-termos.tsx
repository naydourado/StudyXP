// aparece no lugar das abas quando os termos ou a politica mudaram desde o ultimo aceite
import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet } from 'react-native';

import { Botao, Card, MensagemErro, Tela, Texto } from '@/components/ui';
import { Cores, Fontes } from '@/constants/tema';
import { useAuth } from '@/contexts/auth';
import conteudo from '@/legal/conteudo.json';
import { api, mensagemDeErro, type Usuario } from '@/services/api';

export function AceiteTermos() {
  const { atualizarUsuario, sair } = useAuth();
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState('');

  async function aceitar() {
    setEnviando(true);
    setErro('');
    try {
      atualizarUsuario(await api<Usuario>('/me/aceitar-termos', { metodo: 'POST' }));
    } catch (error) {
      setErro(mensagemDeErro(error));
      setEnviando(false);
    }
  }

  return (
    <Tela contentContainerStyle={estilos.centro}>
      <Card style={estilos.card}>
        <Texto variante="titulo" accessibilityRole="header">
          Atualizamos nossos termos
        </Texto>
        <Texto>
          Os Termos de Uso e a Política de Privacidade mudaram (versão {conteudo.versao}). Leia e confirme para continuar
          usando o StudyXP.
        </Texto>
        <Texto accessibilityRole="link" style={estilos.link} onPress={() => router.push('/termos')}>
          Ler os Termos de Uso
        </Texto>
        <Texto accessibilityRole="link" style={estilos.link} onPress={() => router.push('/privacidade')}>
          Ler a Política de Privacidade
        </Texto>
        <Texto variante="pequeno">
          Se não concordar, você pode sair agora ou excluir a conta em Configurações depois de aceitar.
        </Texto>
        <MensagemErro>{erro}</MensagemErro>
        <Botao titulo="Li e aceito" onPress={aceitar} carregando={enviando} />
        <Botao titulo="Sair" variante="secundario" onPress={sair} />
      </Card>
    </Tela>
  );
}

const estilos = StyleSheet.create({
  centro: { flexGrow: 1, justifyContent: 'center' },
  card: { padding: 24, gap: 14 },
  link: { color: Cores.primaria, fontFamily: Fontes.seminegrito },
});
