import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';

import { api, mensagemDeErro } from '@/services/api';

// busca dados da api, recarrega ao voltar para a tela e no "puxar para atualizar"
export function useDados<T>(caminho: string) {
  const [dados, setDados] = useState<T | null>(null);
  const [erro, setErro] = useState('');
  const [versao, setVersao] = useState(0);
  const [atualizando, setAtualizando] = useState(false);

  useEffect(() => {
    let ativo = true;
    api<T>(caminho)
      .then((resposta) => {
        if (!ativo) return;
        setDados(resposta);
        setErro('');
      })
      .catch((error) => ativo && setErro(mensagemDeErro(error)))
      .finally(() => ativo && setAtualizando(false));
    return () => {
      ativo = false;
    };
  }, [caminho, versao]);

  const recarregar = useCallback(() => setVersao((v) => v + 1), []);

  const puxarParaAtualizar = useCallback(() => {
    setAtualizando(true);
    setVersao((v) => v + 1);
  }, []);

  // ao voltar para a aba, os dados podem ter mudado em outra tela
  useFocusEffect(recarregar);

  return { dados, erro, recarregar, atualizando, puxarParaAtualizar };
}
