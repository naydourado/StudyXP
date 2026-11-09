import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

import api, { aoSessaoExpirar, definirToken, renovarSessao } from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  // enquanto tenta recuperar a sessao pelo cookie, as rotas privadas esperam
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    aoSessaoExpirar(() => setUsuario(null));

    renovarSessao()
      .then((dados) => setUsuario(dados.usuario))
      .catch(() => setUsuario(null))
      .finally(() => setCarregando(false));
  }, []);

  const entrar = useCallback(async (email, senha) => {
    const resposta = await api.post("/auth/login", { email, senha }, { _semRenovar: true });
    definirToken(resposta.data.access_token);
    setUsuario(resposta.data.usuario);
  }, []);

  const cadastrar = useCallback(async (dados) => {
    const resposta = await api.post("/auth/cadastro", dados, { _semRenovar: true });
    definirToken(resposta.data.access_token);
    setUsuario(resposta.data.usuario);
  }, []);

  const sair = useCallback(async () => {
    try {
      await api.post("/auth/logout", null, { _semRenovar: true });
    } finally {
      definirToken(null);
      setUsuario(null);
    }
  }, []);

  // usado apos excluir a conta (o servidor ja apagou a sessao)
  const encerrarLocalmente = useCallback(() => {
    definirToken(null);
    setUsuario(null);
  }, []);

  const valor = useMemo(
    () => ({ usuario, setUsuario, carregando, entrar, cadastrar, sair, encerrarLocalmente }),
    [usuario, carregando, entrar, cadastrar, sair, encerrarLocalmente]
  );

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  return useContext(AuthContext);
}
