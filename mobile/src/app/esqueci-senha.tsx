// pede o link de redefinicao; o link do e-mail abre a pagina /redefinir-senha do site
import { Link } from 'expo-router';
import { useState } from 'react';
import { StyleSheet } from 'react-native';

import { Ajuda, Botao, Campo, Card, MensagemErro, Tela, Texto } from '@/components/ui';
import { Cores, Fontes } from '@/constants/tema';
import { api, mensagemDeErro } from '@/services/api';

export default function EsqueciSenha() {
  const [email, setEmail] = useState('');
  const [mensagem, setMensagem] = useState('');
  const [erro, setErro] = useState('');
  const [enviando, setEnviando] = useState(false);

  async function enviar() {
    setErro('');
    if (!email.trim()) {
      setErro('Informe seu e-mail.');
      return;
    }
    setEnviando(true);
    try {
      const resposta = await api<{ mensagem: string }>('/auth/esqueci-senha', {
        metodo: 'POST',
        corpo: { email: email.trim() },
        semRenovar: true,
      });
      setMensagem(resposta.mensagem);
    } catch (error) {
      setErro(mensagemDeErro(error, 'Não foi possível enviar agora. Tente de novo em alguns minutos.'));
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Tela contentContainerStyle={estilos.centro}>
      <Card style={estilos.card}>
        <Texto variante="titulo" style={estilos.centralizado}>
          Esqueci minha senha
        </Texto>
        <Texto variante="subtitulo" style={estilos.centralizado}>
          Enviaremos um link para você criar uma senha nova.
        </Texto>

        {mensagem ? (
          <Texto accessibilityRole="alert" style={estilos.sucesso}>
            {mensagem}
          </Texto>
        ) : (
          <>
            <Campo
              rotulo="E-mail"
              placeholder="Insira seu e-mail"
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
              value={email}
              onChangeText={setEmail}
            />
            <Ajuda>Usamos o e-mail só para enviar o link, que vale por 30 minutos.</Ajuda>
            <MensagemErro>{erro}</MensagemErro>
            <Botao titulo="Enviar link" onPress={enviar} carregando={enviando} />
          </>
        )}

        <Texto variante="pequeno" style={estilos.centralizado}>
          <Link href="/login" style={estilos.link}>
            Voltar para o login
          </Link>
        </Texto>
      </Card>
    </Tela>
  );
}

const estilos = StyleSheet.create({
  centro: { flexGrow: 1, justifyContent: 'center' },
  card: { padding: 24, gap: 14 },
  centralizado: { textAlign: 'center' },
  sucesso: { color: Cores.sucesso, textAlign: 'center', fontFamily: Fontes.media },
  link: { color: Cores.primaria, fontFamily: Fontes.negrito },
});
