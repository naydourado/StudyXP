// cliente da api StudyXP para o app
// o header "X-Cliente: mobile" faz a api devolver o refresh token no corpo
// (no web ele vai em cookie); o access token fica so em memoria
import { apagarRefresh, lerRefresh, salvarRefresh } from './armazenamento';

// celular fisico: use o ip da maquina na rede (ex.: http://192.168.0.10:8000/api/v1)
// emulador android: http://10.0.2.2:8000/api/v1
export const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://10.0.2.2:8000/api/v1';

export type Usuario = {
  id: number;
  nome: string;
  email: string;
  bio: string | null;
  fuso_horario: string;
  criado_em: string;
  termos_versao: string;
  // termos ou politica mudaram desde o ultimo aceite
  termos_pendentes: boolean;
};

export type Tokens = {
  access_token: string;
  refresh_token: string;
  expira_em_segundos: number;
  usuario: Usuario;
};

export class ErroApi extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string,
  ) {
    super(message);
  }
}

let accessToken: string | null = null;
let aoExpirarSessao: () => void = () => {};

export function aoSessaoExpirar(callback: () => void) {
  aoExpirarSessao = callback;
}

export async function iniciarSessao(tokens: Tokens) {
  accessToken = tokens.access_token;
  await salvarRefresh(tokens.refresh_token);
}

export async function encerrarSessao() {
  accessToken = null;
  await apagarRefresh();
}

type Opcoes = {
  metodo?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  corpo?: unknown;
  semRenovar?: boolean;
};

async function enviar(caminho: string, { metodo = 'GET', corpo }: Opcoes) {
  const headers: Record<string, string> = { 'X-Cliente': 'mobile' };
  if (corpo !== undefined) headers['Content-Type'] = 'application/json';
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`;

  try {
    return await fetch(`${API_URL}${caminho}`, {
      method: metodo,
      headers,
      body: corpo === undefined ? undefined : JSON.stringify(corpo),
    });
  } catch {
    throw new ErroApi('Sem conexão com o servidor. Verifique sua internet.', 0, 'sem_conexao');
  }
}

async function lerResposta<T>(resposta: Response): Promise<T> {
  if (resposta.status === 204) return undefined as T;

  const dados = await resposta.json().catch(() => null);
  if (!resposta.ok) {
    const mensagem = typeof dados?.detail === 'string' ? dados.detail : 'Algo deu errado. Tente novamente.';
    throw new ErroApi(mensagem, resposta.status, dados?.code);
  }
  return dados as T;
}

// uma unica renovacao por vez
let renovacao: Promise<Tokens> | null = null;

export function renovarSessao(): Promise<Tokens> {
  if (!renovacao) {
    renovacao = (async () => {
      const refresh = await lerRefresh();
      if (!refresh) throw new ErroApi('Sessão expirada.', 401, 'refresh_ausente');

      const resposta = await enviar('/auth/refresh', { metodo: 'POST', corpo: { refresh_token: refresh } });
      const tokens = await lerResposta<Tokens>(resposta);
      await iniciarSessao(tokens);
      return tokens;
    })().finally(() => {
      renovacao = null;
    });
  }
  return renovacao;
}

export async function api<T = unknown>(caminho: string, opcoes: Opcoes = {}): Promise<T> {
  let resposta = await enviar(caminho, opcoes);

  // access token vencido: renova e repete uma vez
  if (resposta.status === 401 && !opcoes.semRenovar) {
    try {
      await renovarSessao();
    } catch {
      await encerrarSessao();
      aoExpirarSessao();
      throw new ErroApi('Sua sessão expirou. Entre novamente.', 401, 'sessao_expirada');
    }
    resposta = await enviar(caminho, opcoes);
  }

  return lerResposta<T>(resposta);
}

export function mensagemDeErro(erro: unknown, padrao = 'Algo deu errado. Tente novamente.'): string {
  return erro instanceof ErroApi ? erro.message : padrao;
}
