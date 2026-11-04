import axios from "axios";

// por padrao usa o proxy /api (vite em desenvolvimento, vercel em producao)
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api/v1",
  // envia o cookie httponly do refresh token
  withCredentials: true,
});

// o access token fica so em memoria (nunca no localStorage)
let accessToken = null;
let aoExpirarSessao = () => {};

export function definirToken(token) {
  accessToken = token;
}

export function aoSessaoExpirar(callback) {
  aoExpirarSessao = callback;
}

api.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

// uma unica renovacao por vez, mesmo com varias requisicoes falhando juntas
let renovacaoEmAndamento = null;

function pedirRenovacao(tentativa = 1) {
  return api.post("/auth/refresh", null, { _semRenovar: true }).catch(async (erro) => {
    // outra aba acabou de renovar: o cookie novo ja chegou, tenta de novo
    if (erro.response?.data?.code === "refresh_concorrente" && tentativa < 3) {
      await new Promise((resolver) => setTimeout(resolver, 300));
      return pedirRenovacao(tentativa + 1);
    }
    throw erro;
  });
}

export async function renovarSessao() {
  if (!renovacaoEmAndamento) {
    renovacaoEmAndamento = pedirRenovacao()
      .then((resposta) => {
        definirToken(resposta.data.access_token);
        return resposta.data;
      })
      .finally(() => {
        renovacaoEmAndamento = null;
      });
  }
  return renovacaoEmAndamento;
}

// access token vencido: renova pelo cookie e repete a requisicao uma vez
api.interceptors.response.use(
  (resposta) => resposta,
  async (erro) => {
    const original = erro.config;

    if (erro.response?.status === 401 && original && !original._semRenovar && !original._repetida) {
      original._repetida = true;
      try {
        await renovarSessao();
        return api(original);
      } catch {
        definirToken(null);
        aoExpirarSessao();
      }
    }

    return Promise.reject(erro);
  }
);

// mensagem amigavel a partir do erro padrao da api ({detail, code})
const NOMES_CAMPOS = {
  nome: "nome",
  email: "e-mail",
  senha: "senha",
  nova_senha: "nova senha",
  titulo: "título",
  descricao: "descrição",
  data_prazo: "prazo",
  observacao: "nota",
  bio: "bio",
};

export function mensagemDeErro(erro, padrao = "Algo deu errado. Tente novamente.") {
  const dados = erro?.response?.data;

  // erro de validacao: diz quais campos estao errados
  if (dados?.code === "validacao" && dados.erros?.length) {
    const campos = [...new Set(dados.erros.map((e) => NOMES_CAMPOS[e.campo] ?? e.campo))];
    return `Confira ${campos.length > 1 ? "os campos" : "o campo"}: ${campos.join(", ")}.`;
  }

  return typeof dados?.detail === "string" ? dados.detail : padrao;
}

export default api;
