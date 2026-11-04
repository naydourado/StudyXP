import { router } from 'expo-router';
import { useState } from 'react';

import { Ajuda, Botao, Campo, Card, MensagemErro, Tela } from '@/components/ui';
import { useAuth } from '@/contexts/auth';
import { api, mensagemDeErro, type Usuario } from '@/services/api';

export default function EditarPerfil() {
  const { usuario, atualizarUsuario } = useAuth();
  const [nome, setNome] = useState(usuario?.nome ?? '');
  const [email, setEmail] = useState(usuario?.email ?? '');
  const [bio, setBio] = useState(usuario?.bio ?? '');
  const [erro, setErro] = useState('');
  const [salvando, setSalvando] = useState(false);

  async function salvar() {
    setErro('');
    if (nome.trim().length < 2) {
      setErro('Informe seu nome.');
      return;
    }
    setSalvando(true);
    try {
      const atualizado = await api<Usuario>('/me', {
        metodo: 'PATCH',
        corpo: { nome: nome.trim(), email: email.trim(), bio: bio.trim() },
      });
      atualizarUsuario(atualizado);
      router.back();
    } catch (error) {
      setErro(mensagemDeErro(error, 'Erro ao salvar.'));
    } finally {
      setSalvando(false);
    }
  }

  return (
    <Tela edges={['left', 'right']}>
      <Card>
        <Campo rotulo="Nome" value={nome} onChangeText={setNome} maxLength={100} autoComplete="name" />
        <Campo
          rotulo="E-mail"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          autoComplete="email"
        />
        <Campo
          rotulo="Bio"
          placeholder="Conte um pouco sobre você."
          value={bio}
          onChangeText={setBio}
          maxLength={280}
          multiline
          style={{ minHeight: 80, paddingTop: 10, textAlignVertical: 'top' }}
        />
        <Ajuda>Opcional e visível só para você. Evite informações sensíveis.</Ajuda>
        <MensagemErro>{erro}</MensagemErro>
        <Botao titulo="Salvar alterações" onPress={salvar} carregando={salvando} />
      </Card>
    </Tela>
  );
}
