// como o app conversa com o servidor (a API do StudyXP no Render)
export const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'https://studyxp-api-xruj.onrender.com/api/v1';

// token de acesso: fica so na memoria. Fechou o app ou venceu, faz login de novo
let token: string | null = null;

export function guardarToken(novo: string | null) {
  token = novo;
}

// erro da API com o status http (401 = precisa fazer login de novo)
export class ErroApi extends Error {
  constructor(mensagem: string, public status: number) {
    super(mensagem);
  }
}

// faz a requisicao e devolve o JSON da resposta; se der erro, lanca ErroApi
export async function api<T>(caminho: string, metodo = 'GET', corpo?: object): Promise<T> {
  // X-Cliente: mobile e como a API sabe que o pedido vem do app (e nao do site)
  const headers: Record<string, string> = { 'X-Cliente': 'mobile', 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;

  let resposta: Response;
  try {
    resposta = await fetch(API_URL + caminho, {
      method: metodo,
      headers,
      body: corpo ? JSON.stringify(corpo) : undefined,
    });
  } catch {
    throw new ErroApi('Sem conexão com o servidor.', 0);
  }

  const dados = await resposta.json().catch(() => null);
  if (!resposta.ok) {
    // a API manda a mensagem de erro no campo "detail"
    const mensagem = typeof dados?.detail === 'string' ? dados.detail : 'Algo deu errado. Tente novamente.';
    throw new ErroApi(mensagem, resposta.status);
  }
  return dados as T;
}
