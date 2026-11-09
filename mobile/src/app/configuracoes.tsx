// preferencias, privacidade (lgpd) e conta
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Share, StyleSheet, Switch, View } from 'react-native';

import { Botao, Campo, Card, MensagemErro, Tela, Texto } from '@/components/ui';
import { Cores, Fontes } from '@/constants/tema';
import { useAuth } from '@/contexts/auth';
import { api, mensagemDeErro } from '@/services/api';

type Preferencias = { lembrete_tarefas: boolean; som_pomodoro: boolean; resumo_semanal: boolean };

const OPCOES: { campo: keyof Preferencias; titulo: string; descricao: string }[] = [
  { campo: 'lembrete_tarefas', titulo: 'Lembretes de tarefas', descricao: 'Aviso na véspera e no dia do prazo.' },
  { campo: 'som_pomodoro', titulo: 'Som do pomodoro', descricao: 'Som ao terminar uma sessão de foco.' },
  { campo: 'resumo_semanal', titulo: 'Resumo semanal', descricao: 'Seu progresso por e-mail todo domingo.' },
];

function Linha({ titulo, descricao, valor, aoMudar }: { titulo: string; descricao: string; valor: boolean; aoMudar: (v: boolean) => void }) {
  return (
    <View style={estilos.linha}>
      <View style={{ flex: 1 }}>
        <Texto style={estilos.linhaTitulo}>{titulo}</Texto>
        <Texto variante="pequeno">{descricao}</Texto>
      </View>
      <Switch
        accessibilityLabel={titulo}
        value={valor}
        onValueChange={aoMudar}
        trackColor={{ true: Cores.primariaClara, false: Cores.barraVazia }}
        thumbColor="#fff"
      />
    </View>
  );
}

export default function Configuracoes() {
  const { encerrarLocalmente } = useAuth();
  const [preferencias, setPreferencias] = useState<Preferencias | null>(null);
  const [humor, setHumor] = useState(false);
  const [erro, setErro] = useState('');
  const [mensagem, setMensagem] = useState('');

  const [senhaAtual, setSenhaAtual] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [mensagemSenha, setMensagemSenha] = useState('');
  const [senhaExclusao, setSenhaExclusao] = useState('');
  const [erroExclusao, setErroExclusao] = useState('');

  useEffect(() => {
    Promise.all([api<Preferencias>('/me/preferencias'), api<{ humor: boolean }>('/me/consentimentos')])
      .then(([prefs, consentimentos]) => {
        setPreferencias(prefs);
        setHumor(consentimentos.humor);
      })
      .catch((error) => setErro(mensagemDeErro(error)));
  }, []);

  async function mudarPreferencia(campo: keyof Preferencias, valor: boolean) {
    if (!preferencias) return;
    const anteriores = preferencias;
    const novas = { ...preferencias, [campo]: valor };
    setPreferencias(novas);
    try {
      await api('/me/preferencias', { metodo: 'PUT', corpo: novas });
    } catch (error) {
      setPreferencias(anteriores);
      setErro(mensagemDeErro(error, 'Não foi possível salvar.'));
    }
  }

  async function salvarHumor(valor: boolean) {
    try {
      const resposta = await api<{ humor: boolean }>('/me/consentimentos', { metodo: 'PUT', corpo: { humor: valor } });
      setHumor(resposta.humor);
      setMensagem(resposta.humor ? 'Registro de humor autorizado.' : 'Autorização revogada e registros apagados.');
    } catch (error) {
      setErro(mensagemDeErro(error));
    }
  }

  function mudarHumor(valor: boolean) {
    if (valor) {
      salvarHumor(true);
      return;
    }
    Alert.alert('Revogar autorização?', 'Todos os seus registros de humor serão apagados.', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Revogar', style: 'destructive', onPress: () => salvarHumor(false) },
    ]);
  }

  async function exportar() {
    try {
      const dados = await api('/me/exportar');
      await Share.share({ title: 'Meus dados - StudyXP', message: JSON.stringify(dados, null, 2) });
    } catch (error) {
      setErro(mensagemDeErro(error, 'Não foi possível exportar os dados.'));
    }
  }

  async function trocarSenha() {
    setMensagemSenha('');
    if (novaSenha.length < 8) {
      setMensagemSenha('A nova senha precisa ter pelo menos 8 caracteres.');
      return;
    }
    try {
      await api('/me/senha', { metodo: 'PUT', corpo: { senha_atual: senhaAtual, nova_senha: novaSenha } });
      setSenhaAtual('');
      setNovaSenha('');
      setMensagemSenha('Senha alterada!');
    } catch (error) {
      setMensagemSenha(mensagemDeErro(error, 'Erro ao alterar senha.'));
    }
  }

  function excluirConta() {
    setErroExclusao('');
    if (!senhaExclusao) {
      setErroExclusao('Digite sua senha para confirmar.');
      return;
    }
    Alert.alert(
      'Excluir conta?',
      'Essa ação não pode ser desfeita. Tarefas, humor, foco e conquistas serão apagados.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              await api('/me', { metodo: 'DELETE', corpo: { senha: senhaExclusao } });
              await encerrarLocalmente();
            } catch (error) {
              setErroExclusao(mensagemDeErro(error, 'Erro ao excluir conta.'));
            }
          },
        },
      ],
    );
  }

  return (
    <Tela edges={['left', 'right']}>
      <MensagemErro>{erro}</MensagemErro>

      <Card>
        <Texto variante="secao">Notificações</Texto>
        {preferencias &&
          OPCOES.map((opcao) => (
            <Linha
              key={opcao.campo}
              titulo={opcao.titulo}
              descricao={opcao.descricao}
              valor={preferencias[opcao.campo]}
              aoMudar={(v) => mudarPreferencia(opcao.campo, v)}
            />
          ))}
      </Card>

      <Card>
        <Texto variante="secao">Privacidade e dados</Texto>
        <Linha
          titulo="Registro de humor"
          descricao="Autorização para guardar seus registros. Desligar apaga todos."
          valor={humor}
          aoMudar={mudarHumor}
        />
        <Botao titulo="Exportar meus dados" variante="secundario" onPress={exportar} />
        {mensagem ? <Texto style={estilos.mensagem}>{mensagem}</Texto> : null}
        <View style={estilos.links}>
          <Texto variante="pequeno" style={estilos.link} onPress={() => router.push('/privacidade')}>
            Política de Privacidade
          </Texto>
          <Texto variante="pequeno" style={estilos.link} onPress={() => router.push('/termos')}>
            Termos de Uso
          </Texto>
        </View>
      </Card>

      <Card>
        <Texto variante="secao">Alterar senha</Texto>
        <Campo rotulo="Senha atual" secureTextEntry value={senhaAtual} onChangeText={setSenhaAtual} />
        <Campo
          rotulo="Nova senha"
          placeholder="Mínimo de 8 caracteres"
          secureTextEntry
          value={novaSenha}
          onChangeText={setNovaSenha}
        />
        {mensagemSenha ? <Texto style={estilos.mensagem}>{mensagemSenha}</Texto> : null}
        <Botao titulo="Salvar nova senha" variante="secundario" onPress={trocarSenha} />
      </Card>

      <Card>
        <Texto variante="secao">Excluir conta</Texto>
        <Texto variante="pequeno">Apaga sua conta e todos os seus dados imediatamente.</Texto>
        <Campo rotulo="Senha" secureTextEntry value={senhaExclusao} onChangeText={setSenhaExclusao} />
        <MensagemErro>{erroExclusao}</MensagemErro>
        <Botao titulo="Excluir minha conta" variante="perigo" onPress={excluirConta} />
      </Card>
    </Tela>
  );
}

const estilos = StyleSheet.create({
  linha: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 6 },
  linhaTitulo: { fontFamily: Fontes.seminegrito, fontSize: 14 },
  mensagem: { color: Cores.primaria, fontFamily: Fontes.seminegrito },
  links: { flexDirection: 'row', justifyContent: 'center', gap: 16, marginTop: 4 },
  link: { color: Cores.primaria, fontFamily: Fontes.seminegrito },
});
