import { Link, router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';

import { Ajuda, Botao, Caixa, Campo, Card, MensagemErro, Tela, Texto } from '@/components/ui';
import { Cores, Fontes } from '@/constants/tema';
import { useAuth } from '@/contexts/auth';
import { mensagemDeErro } from '@/services/api';

const SENHA_MINIMA = 8;

export default function Cadastro() {
  const { cadastrar } = useAuth();
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [aceiteTermos, setAceiteTermos] = useState(false);
  const [maiorDeIdade, setMaiorDeIdade] = useState(false);
  const [erro, setErro] = useState('');
  const [enviando, setEnviando] = useState(false);

  async function enviar() {
    setErro('');
    if (nome.trim().length < 2 || !email.trim()) {
      setErro('Preencha nome e e-mail.');
      return;
    }
    if (senha.length < SENHA_MINIMA) {
      setErro(`A senha precisa ter pelo menos ${SENHA_MINIMA} caracteres.`);
      return;
    }
    if (!aceiteTermos || !maiorDeIdade) {
      setErro('Marque as duas confirmações para criar a conta.');
      return;
    }

    setEnviando(true);
    try {
      await cadastrar({
        nome: nome.trim(),
        email: email.trim(),
        senha,
        aceite_termos: aceiteTermos,
        maior_de_idade: maiorDeIdade,
      });
    } catch (error) {
      setErro(mensagemDeErro(error, 'Erro ao cadastrar. Verifique os dados.'));
    } finally {
      setEnviando(false);
    }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Tela contentContainerStyle={estilos.centro}>
        <Card style={estilos.card}>
          <Texto variante="titulo" style={estilos.centralizado}>
            Criar Conta
          </Texto>
          <Texto variante="subtitulo" style={estilos.centralizado}>
            Transforme seus estudos em XP.
          </Texto>

          <Campo
            rotulo="Nome ou apelido"
            placeholder="Como quer ser chamado(a)"
            autoComplete="name"
            value={nome}
            onChangeText={setNome}
          />
          <Campo
            rotulo="E-mail"
            placeholder="Insira seu e-mail"
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />
          <Campo
            rotulo="Senha"
            placeholder={`Mínimo de ${SENHA_MINIMA} caracteres`}
            secureTextEntry
            autoComplete="new-password"
            textContentType="newPassword"
            value={senha}
            onChangeText={setSenha}
          />

          <Caixa marcada={aceiteTermos} aoAlternar={() => setAceiteTermos(!aceiteTermos)}>
            <Texto variante="pequeno">
              Li e aceito os{' '}
              <Texto variante="pequeno" style={estilos.link} onPress={() => router.push('/termos')}>
                Termos de Uso
              </Texto>{' '}
              e estou ciente da{' '}
              <Texto variante="pequeno" style={estilos.link} onPress={() => router.push('/privacidade')}>
                Política de Privacidade
              </Texto>
              .
            </Texto>
          </Caixa>

          <Caixa marcada={maiorDeIdade} aoAlternar={() => setMaiorDeIdade(!maiorDeIdade)}>
            <Texto variante="pequeno">Tenho 18 anos ou mais.</Texto>
          </Caixa>

          <Ajuda>
            Pedimos só o necessário: nome ou apelido para a saudação, e-mail para entrar e receber avisos da conta e a
            senha, que guardamos criptografada. Não pedimos CPF, telefone nem localização.
          </Ajuda>

          <MensagemErro>{erro}</MensagemErro>

          <Botao titulo="Cadastrar" onPress={enviar} carregando={enviando} style={{ marginTop: 8 }} />

          <Texto variante="pequeno" style={estilos.centralizado}>
            Já tem conta?{' '}
            <Link href="/login" style={estilos.link}>
              Entrar
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
  centralizado: { textAlign: 'center' },
  link: { color: Cores.primaria, fontFamily: Fontes.seminegrito },
});
