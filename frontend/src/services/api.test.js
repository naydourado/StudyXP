import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import api, { aoSessaoExpirar, definirToken, mensagemDeErro } from "./api";

// substitui a camada de rede do axios por respostas programadas por rota
function simularRede(rotas) {
  const chamadas = [];
  api.defaults.adapter = async (config) => {
    chamadas.push({ url: config.url, auth: config.headers?.Authorization });
    const fila = rotas[config.url];
    const { status, data } = fila.shift();
    const resposta = { status, data, headers: {}, config, statusText: String(status) };
    if (status >= 400) {
      const erro = new Error(`HTTP ${status}`);
      erro.config = config;
      erro.response = resposta;
      throw erro;
    }
    return resposta;
  };
  return chamadas;
}

describe("cliente da api", () => {
  const adapterOriginal = api.defaults.adapter;

  beforeEach(() => definirToken("token-velho"));
  afterEach(() => {
    api.defaults.adapter = adapterOriginal;
    definirToken(null);
  });

  it("envia o token e, no 401, renova a sessão e repete a requisição", async () => {
    const chamadas = simularRede({
      "/me": [
        { status: 401, data: { code: "token_expirado" } },
        { status: 200, data: { nome: "Nayra" } },
      ],
      "/auth/refresh": [{ status: 200, data: { access_token: "token-novo", usuario: {} } }],
    });

    const resposta = await api.get("/me");

    expect(resposta.data.nome).toBe("Nayra");
    expect(chamadas.map((c) => c.url)).toEqual(["/me", "/auth/refresh", "/me"]);
    expect(chamadas[0].auth).toBe("Bearer token-velho");
    expect(chamadas[2].auth).toBe("Bearer token-novo");
  });

  it("renova uma única vez mesmo com várias requisições falhando juntas", async () => {
    const chamadas = simularRede({
      "/tarefas": [
        { status: 401, data: {} },
        { status: 200, data: [] },
      ],
      "/dashboard": [
        { status: 401, data: {} },
        { status: 200, data: {} },
      ],
      "/auth/refresh": [{ status: 200, data: { access_token: "token-novo", usuario: {} } }],
    });

    await Promise.all([api.get("/tarefas"), api.get("/dashboard")]);

    expect(chamadas.filter((c) => c.url === "/auth/refresh")).toHaveLength(1);
  });

  it("avisa a aplicação quando a sessão não pode ser renovada", async () => {
    const expirou = vi.fn();
    aoSessaoExpirar(expirou);
    simularRede({
      "/me": [{ status: 401, data: {} }],
      "/auth/refresh": [{ status: 401, data: { code: "refresh_invalido" } }],
    });

    await expect(api.get("/me")).rejects.toThrow();
    expect(expirou).toHaveBeenCalledOnce();
  });

  it("tenta de novo quando outra aba renovou ao mesmo tempo", async () => {
    vi.useFakeTimers();
    simularRede({
      "/me": [
        { status: 401, data: {} },
        { status: 200, data: { ok: true } },
      ],
      "/auth/refresh": [
        { status: 401, data: { code: "refresh_concorrente" } },
        { status: 200, data: { access_token: "token-novo", usuario: {} } },
      ],
    });

    const pedido = api.get("/me");
    await vi.runAllTimersAsync();
    expect((await pedido).data.ok).toBe(true);
    vi.useRealTimers();
  });
});

describe("mensagemDeErro", () => {
  it("usa o detail da api", () => {
    expect(mensagemDeErro({ response: { data: { detail: "E-mail já cadastrado." } } })).toBe("E-mail já cadastrado.");
  });

  it("lista os campos inválidos", () => {
    const erro = {
      response: { data: { code: "validacao", erros: [{ campo: "email" }, { campo: "senha" }, { campo: "email" }] } },
    };
    expect(mensagemDeErro(erro)).toBe("Confira os campos: e-mail, senha.");
  });

  it("usa a mensagem padrão sem resposta", () => {
    expect(mensagemDeErro(new Error("rede"), "Sem conexão")).toBe("Sem conexão");
  });
});
