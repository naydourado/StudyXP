import { Link } from 'expo-router';
import { useState } from 'react';
import { Image, KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';

import { Botao, Campo, Card, MensagemErro, Tela, Texto } from '@/components/ui';
import { Cores, Fontes } from '@/constants/tema';
import { useAuth } from '@/contexts/auth';
import { mensagemDeErro } from '@/services/api';

export default function Login() {
  const { entrar } = useAuth();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [enviando, setEnviando] = useState(false);

  async function fazerLogin() {
    setErro('');
    if (!email.trim() || !senha) {
      setErro('Preencha e-mail e senha.');
      return;
    }
    setEnviando(true);
    try {
      // ao entrar, o Stack.Protected do layout raiz leva para as abas
      await entrar(email.trim(), senha);
    } catch (error) {
      setErro(mensagemDeErro(error, 'E-mail ou senha inválidos.'));
    } finally {
      setEnviando(false);
    }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Tela contentContainerStyle={estilos.centro}>
        <Card style={estilos.card}>
          <Image
            source={require('@/assets/images/logo-studyxp.webp')}
            style={estilos.logo}
            resizeMode="contain"
            accessibilityLabel="StudyXP"
          />
          <Texto variante="titulo" style={estilos.centralizado}>
            Entrar
          </Texto>
          <Texto variante="subtitulo" style={estilos.centralizado}>
            Continue sua jornada de XP.
          </Texto>

          <Campo
            rotulo="E-mail"
            placeholder="Insira seu e-mail"
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            textContentType="emailAddress"
            value={email}
            onChangeText={setEmail}
          />
          <Campo
            rotulo="Senha"
            placeholder="Insira sua senha"
            secureTextEntry
            autoComplete="current-password"
            textContentType="password"
            value={senha}
            onChangeText={setSenha}
            onSubmitEditing={fazerLogin}
          />

          <Link href="/esqueci-senha" style={estilos.esqueci}>
            Esqueci minha senha
          </Link>

          <MensagemErro>{erro}</MensagemErro>

          <Botao titulo="Entrar" onPress={fazerLogin} carregando={enviando} style={{ marginTop: 8 }} />

          <Texto variante="pequeno" style={estilos.centralizado}>
            Não tem conta?{' '}
            <Link href="/cadastro" style={estilos.link}>
              Crie uma
            </Link>
          </Texto>
        </Card>
      </Tela>
    </KeyboardAvoidingView>
  );
}

const estilos = StyleSheet.create({
  centro: { flexGrow: 1, justifyContent: 'center' },
  card: { padding: 24, gap: 14 },
  logo: { width: 140, height: 40, alignSelf: 'center' },
  centralizado: { textAlign: 'center' },
  link: { color: Cores.primaria, fontFamily: Fontes.negrito },
  esqueci: { alignSelf: 'flex-end', color: Cores.primaria, fontFamily: Fontes.seminegrito, fontSize: 13 },
});
