import { aoSessaoExpirar, api, ErroApi, iniciarSessao, mensagemDeErro } from '@/services/api';
import { lerRefresh } from '@/services/armazenamento';

type Resposta = { status: number; corpo?: unknown };

// fetch falso: devolve as respostas na ordem e guarda as chamadas
function simularFetch(respostas: Resposta[]) {
  const chamadas: { url: string; init: RequestInit }[] = [];
  globalThis.fetch = jest.fn(async (url: string, init: RequestInit) => {
    chamadas.push({ url, init });
    const proxima = respostas.shift();
    if (!proxima) throw new Error('sem resposta programada');
    return {
      ok: proxima.status < 400,
      status: proxima.status,
      json: async () => proxima.corpo,
    } as Response;
  }) as unknown as typeof fetch;
  return chamadas;
}

const TOKENS = {
  access_token: 'access-1',
  refresh_token: 'refresh-1',
  expira_em_segundos: 900,
  usuario: {
    id: 1,
    nome: 'Brunno',
    email: 'b@b.com',
    bio: null,
    fuso_horario: 'America/Sao_Paulo',
    criado_em: '',
    termos_versao: '2026-10',
    termos_pendentes: false,
  },
};

describe('cliente da api', () => {
  beforeEach(async () => {
    await iniciarSessao(TOKENS);
  });

  it('envia o token e o header do mobile', async () => {
    const chamadas = simularFetch([{ status: 200, corpo: { ok: true } }]);
    await api('/me');
    const headers = chamadas[0].init.headers as Record<string, string>;
    expect(headers.Authorization).toBe('Bearer access-1');
    expect(headers['X-Cliente']).toBe('mobile');
  });

  it('renova a sessão no 401, guarda o refresh novo e repete a requisição', async () => {
    const chamadas = simularFetch([
      { status: 401, corpo: { code: 'token_expirado' } },
      { status: 200, corpo: { ...TOKENS, access_token: 'access-2', refresh_token: 'refresh-2' } },
      { status: 200, corpo: { nome: 'Brunno' } },
    ]);

    const resposta = await api<{ nome: string }>('/me');

    expect(resposta.nome).toBe('Brunno');
    expect(chamadas[1].url).toMatch(/\/auth\/refresh$/);
    expect(JSON.parse(chamadas[1].init.body as string)).toEqual({ refresh_token: 'refresh-1' });
    expect((chamadas[2].init.headers as Record<string, string>).Authorization).toBe('Bearer access-2');
    expect(await lerRefresh()).toBe('refresh-2');
  });

  it('encerra a sessão quando não dá para renovar', async () => {
    const expirou = jest.fn();
    aoSessaoExpirar(expirou);
    simularFetch([
      { status: 401, corpo: {} },
      { status: 401, corpo: { code: 'refresh_invalido' } },
    ]);

    await expect(api('/me')).rejects.toMatchObject({ code: 'sessao_expirada' });
    expect(expirou).toHaveBeenCalledTimes(1);
    expect(await lerRefresh()).toBeNull();
  });

  it('transforma o erro da api em mensagem para o usuário', async () => {
    simularFetch([{ status: 409, corpo: { detail: 'Este e-mail já está cadastrado.', code: 'email_em_uso' } }]);
    const erro = (await api('/me', { metodo: 'PATCH', corpo: {} }).catch((e: unknown) => e)) as ErroApi;
    expect(erro).toBeInstanceOf(ErroApi);
    expect(erro.code).toBe('email_em_uso');
    expect(mensagemDeErro(erro)).toBe('Este e-mail já está cadastrado.');
  });

  it('avisa quando não há conexão', async () => {
    globalThis.fetch = jest.fn(async () => {
      throw new TypeError('Network request failed');
    }) as unknown as typeof fetch;
    const erro = (await api('/me').catch((e: unknown) => e)) as ErroApi;
    expect(erro.code).toBe('sem_conexao');
    expect(mensagemDeErro(new Error('x'), 'padrão')).toBe('padrão');
  });
});
