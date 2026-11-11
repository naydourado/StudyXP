// tela de login: e-mail, senha e botao Entrar (POST /auth/login)
import { useState } from 'react';
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { api, guardarToken } from './api';
import { Cores } from './cores';

// o que a API devolve no login (usamos so o token e o nome)
type RespostaLogin = {
  access_token: string;
  usuario: { nome: string };
};

type Props = { aoEntrar: (nome: string) => void };

export default function LoginTela({ aoEntrar }: Props) {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);

  async function entrar() {
    setErro('');
    if (!email.trim() || !senha) {
      setErro('Preencha e-mail e senha.');
      return;
    }
    setCarregando(true);
    try {
      const resposta = await api<RespostaLogin>('/auth/login', 'POST', { email: email.trim(), senha });
      guardarToken(resposta.access_token);
      aoEntrar(resposta.usuario.nome);
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Algo deu errado.');
      setCarregando(false);
    }
  }

  return (
    <View style={estilos.tela}>
      <View style={estilos.card}>
        <Image source={require('../assets/logo-studyxp.webp')} style={estilos.logo} resizeMode="contain" />
        <Text style={estilos.titulo}>Entrar</Text>

        <TextInput
          style={estilos.campo}
          placeholder="E-mail"
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />
        <TextInput
          style={estilos.campo}
          placeholder="Senha"
          secureTextEntry
          value={senha}
          onChangeText={setSenha}
          onSubmitEditing={entrar}
        />

        {erro ? <Text style={estilos.erro}>{erro}</Text> : null}

        <Pressable style={estilos.botao} onPress={entrar} disabled={carregando}>
          {carregando ? <ActivityIndicator color="#fff" /> : <Text style={estilos.textoBotao}>Entrar</Text>}
        </Pressable>
      </View>
    </View>
  );
}

const estilos = StyleSheet.create({
  tela: { flex: 1, justifyContent: 'center', padding: 24 },
  card: { backgroundColor: Cores.card, borderRadius: 18, padding: 24, gap: 14 },
  logo: { width: 140, height: 40, alignSelf: 'center' },
  titulo: { fontSize: 24, fontWeight: 'bold', color: Cores.texto, textAlign: 'center' },
  campo: { backgroundColor: Cores.campo, borderRadius: 10, padding: 14, fontSize: 16 },
  erro: { color: Cores.erro, textAlign: 'center' },
  botao: { backgroundColor: Cores.primaria, borderRadius: 10, padding: 14, alignItems: 'center' },
  textoBotao: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});
