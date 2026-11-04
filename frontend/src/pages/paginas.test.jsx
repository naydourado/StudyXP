import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import Cadastro from "./Cadastro/Cadastro";
import RedefinirSenha from "./Senha/RedefinirSenha";
import api from "../services/api";
import { useAuth } from "../contexts/AuthContext";

vi.mock("../contexts/AuthContext", () => ({ useAuth: vi.fn() }));

describe("Cadastro", () => {
  const cadastrar = vi.fn();

  beforeEach(() => {
    cadastrar.mockReset().mockResolvedValue();
    useAuth.mockReturnValue({ cadastrar });
  });

  async function preencher(usuario, senha = "senha-forte-123") {
    render(
      <MemoryRouter>
        <Cadastro />
      </MemoryRouter>
    );
    await usuario.type(screen.getByLabelText("Nome ou apelido"), "Nayra");
    await usuario.type(screen.getByLabelText("E-mail"), "nayra@email.com");
    await usuario.type(screen.getByLabelText("Senha"), senha);
  }

  it("exige as duas confirmações (termos e 18+)", async () => {
    const usuario = userEvent.setup();
    await preencher(usuario);
    await usuario.click(screen.getByRole("button", { name: "Cadastrar" }));

    expect(screen.getByRole("alert")).toHaveTextContent("Marque as duas confirmações");
    expect(cadastrar).not.toHaveBeenCalled();
  });

  it("envia os dados com os aceites", async () => {
    const usuario = userEvent.setup();
    await preencher(usuario);
    const [termos, idade] = screen.getAllByRole("checkbox");
    await usuario.click(termos);
    await usuario.click(idade);
    await usuario.click(screen.getByRole("button", { name: "Cadastrar" }));

    expect(cadastrar).toHaveBeenCalledWith({
      nome: "Nayra",
      email: "nayra@email.com",
      senha: "senha-forte-123",
      aceite_termos: true,
      maior_de_idade: true,
    });
  });

  it("mostra o erro devolvido pela api", async () => {
    cadastrar.mockRejectedValue({ response: { data: { detail: "Este e-mail já está cadastrado." } } });
    const usuario = userEvent.setup();
    await preencher(usuario);
    for (const caixa of screen.getAllByRole("checkbox")) await usuario.click(caixa);
    await usuario.click(screen.getByRole("button", { name: "Cadastrar" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Este e-mail já está cadastrado.");
  });
});

describe("RedefinirSenha", () => {
  function renderizar(url) {
    render(
      <MemoryRouter initialEntries={[url]}>
        <RedefinirSenha />
      </MemoryRouter>
    );
  }

  it("avisa quando o link não tem token", () => {
    renderizar("/redefinir-senha");
    expect(screen.getByRole("alert")).toHaveTextContent("Link incompleto");
  });

  it("confere se as senhas são iguais antes de enviar", async () => {
    const post = vi.spyOn(api, "post");
    const usuario = userEvent.setup();
    renderizar("/redefinir-senha?token=abc");

    await usuario.type(screen.getByLabelText("Nova senha"), "senha-nova-123");
    await usuario.type(screen.getByLabelText("Repita a nova senha"), "outra-senha-123");
    await usuario.click(screen.getByRole("button", { name: "Salvar nova senha" }));

    expect(screen.getByRole("alert")).toHaveTextContent("As senhas não são iguais.");
    expect(post).not.toHaveBeenCalled();
    post.mockRestore();
  });

  it("envia o token e a senha nova", async () => {
    const post = vi.spyOn(api, "post").mockResolvedValue({ data: {} });
    const usuario = userEvent.setup();
    renderizar("/redefinir-senha?token=token-do-email");

    await usuario.type(screen.getByLabelText("Nova senha"), "senha-nova-123");
    await usuario.type(screen.getByLabelText("Repita a nova senha"), "senha-nova-123");
    await usuario.click(screen.getByRole("button", { name: "Salvar nova senha" }));

    expect(post).toHaveBeenCalledWith(
      "/auth/redefinir-senha",
      { token: "token-do-email", nova_senha: "senha-nova-123" },
      { _semRenovar: true }
    );
    expect(await screen.findByRole("status")).toHaveTextContent("Senha alterada");
    post.mockRestore();
  });
});
