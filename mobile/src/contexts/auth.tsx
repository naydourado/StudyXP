import { createContext, type PropsWithChildren, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import {
  aoSessaoExpirar,
  api,
  encerrarSessao,
  iniciarSessao,
  renovarSessao,
  type Tokens,
  type Usuario,
} from '@/services/api';
import { apagarRefresh, lerRefresh } from '@/services/armazenamento';
import { registrarPush, removerPush } from '@/services/notificacoes';

type DadosCadastro = {
  nome: string;
  email: string;
  senha: string;
  aceite_termos: boolean;
  maior_de_idade: boolean;
};

type ContextoAuth = {
  usuario: Usuario | null;
  carregando: boolean;
  entrar: (email: string, senha: string) => Promise<void>;
  cadastrar: (dados: DadosCadastro) => Promise<void>;
  sair: () => Promise<void>;
  // usado depois de excluir a conta (o servidor ja apagou tudo)
  encerrarLocalmente: () => Promise<void>;
  atualizarUsuario: (usuario: Usuario) => void;
};

const AuthContext = createContext<ContextoAuth | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  // enquanto tenta recuperar a sessao salva, a splash screen continua na tela
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    aoSessaoExpirar(() => setUsuario(null));

    lerRefresh()
      .then((refresh) => (refresh ? renovarSessao() : null))
      .then((tokens) => {
        setUsuario(tokens?.usuario ?? null);
        if (tokens) registrarPush();
      })
      .catch(() => {
        apagarRefresh();
        setUsuario(null);
      })
      .finally(() => setCarregando(false));
  }, []);

  const entrar = useCallback(async (email: string, senha: string) => {
    const tokens = await api<Tokens>('/auth/login', { metodo: 'POST', corpo: { email, senha }, semRenovar: true });
    await iniciarSessao(tokens);
    setUsuario(tokens.usuario);
    registrarPush();
  }, []);

  const cadastrar = useCallback(async (dados: DadosCadastro) => {
    const tokens = await api<Tokens>('/auth/cadastro', { metodo: 'POST', corpo: dados, semRenovar: true });
    await iniciarSessao(tokens);
    setUsuario(tokens.usuario);
    registrarPush();
  }, []);

  const sair = useCallback(async () => {
    const refresh = await lerRefresh();
    try {
      await removerPush();
      if (refresh) {
        await api('/auth/logout', { metodo: 'POST', corpo: { refresh_token: refresh }, semRenovar: true });
      }
    } catch {
      // mesmo sem internet o app sai; o token expira sozinho no servidor
    } finally {
      await encerrarSessao();
      setUsuario(null);
    }
  }, []);

  const encerrarLocalmente = useCallback(async () => {
    await encerrarSessao();
    setUsuario(null);
  }, []);

  const valor = useMemo(
    () => ({ usuario, carregando, entrar, cadastrar, sair, encerrarLocalmente, atualizarUsuario: setUsuario }),
    [usuario, carregando, entrar, cadastrar, sair, encerrarLocalmente],
  );

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>;
}

export function useAuth(): ContextoAuth {
  const contexto = useContext(AuthContext);
  if (!contexto) throw new Error('useAuth precisa estar dentro de <AuthProvider>');
  return contexto;
}
