import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";

import NivelCard from "./NivelCard/NivelCard";
import XpToast from "./XpToast/XpToast";
import RotaPrivada from "./RotaPrivada/RotaPrivada";
import AvisoCookies from "./AvisoCookies/AvisoCookies";
import { useAuth } from "../contexts/AuthContext";

vi.mock("../contexts/AuthContext", () => ({ useAuth: vi.fn() }));

const GAMIFICACAO = { nivel: 3, xp_no_nivel: 20, xp_para_proximo: 300, percentual: 6.7 };

describe("NivelCard", () => {
  it("mostra o nível e o progresso vindos do servidor", () => {
    render(<NivelCard gamificacao={GAMIFICACAO} />);
    expect(screen.getByText("Nível 3")).toBeInTheDocument();
    expect(screen.getByText("20 / 300 XP")).toBeInTheDocument();
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "6.7");
  });

  it("reserva o espaço enquanto carrega", () => {
    const { container } = render(<NivelCard gamificacao={null} />);
    expect(container.querySelector(".level-card-vazio")).toBeInTheDocument();
  });
});

describe("XpToast", () => {
  afterEach(() => vi.useRealTimers());

  it("mostra o xp ganho e as conquistas, e some sozinho", () => {
    vi.useFakeTimers();
    const fechar = vi.fn();
    render(
      <XpToast
        resultado={{ xp_ganho: 80, novas_conquistas: [{ codigo: "primeiro_nivel", nome: "Primeiro Nível" }] }}
        aoFechar={fechar}
      />
    );

    expect(screen.getByText("+80 XP")).toBeInTheDocument();
    expect(screen.getByText(/Primeiro Nível/)).toBeInTheDocument();

    act(() => vi.advanceTimersByTime(3600));
    expect(fechar).toHaveBeenCalledOnce();
  });

  it("não aparece quando não houve ganho", () => {
    const { container } = render(<XpToast resultado={{ xp_ganho: 0, novas_conquistas: [] }} aoFechar={() => {}} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("mostra o estorno ao reabrir uma tarefa", () => {
    render(<XpToast resultado={{ xp_ganho: -50, novas_conquistas: [] }} aoFechar={() => {}} />);
    expect(screen.getByText("-50 XP")).toBeInTheDocument();
  });
});

describe("RotaPrivada", () => {
  function renderizar() {
    return render(
      <MemoryRouter initialEntries={["/tarefas"]}>
        <Routes>
          <Route path="/" element={<p>tela de login</p>} />
          <Route element={<RotaPrivada />}>
            <Route path="/tarefas" element={<p>tela de tarefas</p>} />
          </Route>
        </Routes>
      </MemoryRouter>
    );
  }

  it("manda para o login quem não está logado", () => {
    useAuth.mockReturnValue({ usuario: null, carregando: false });
    renderizar();
    expect(screen.getByText("tela de login")).toBeInTheDocument();
  });

  it("libera a tela para quem está logado", () => {
    useAuth.mockReturnValue({ usuario: { nome: "Nayra" }, carregando: false });
    renderizar();
    expect(screen.getByText("tela de tarefas")).toBeInTheDocument();
  });

  it("pede novo aceite quando os termos mudaram", () => {
    useAuth.mockReturnValue({ usuario: { nome: "Nayra", termos_pendentes: true }, carregando: false });
    renderizar();
    expect(screen.getByRole("heading", { name: "Atualizamos nossos termos" })).toBeInTheDocument();
    expect(screen.queryByText("tela de tarefas")).not.toBeInTheDocument();
  });

  it("espera a sessão ser verificada", () => {
    useAuth.mockReturnValue({ usuario: null, carregando: true });
    renderizar();
    expect(screen.getByText("Carregando...")).toBeInTheDocument();
  });
});

describe("AvisoCookies", () => {
  afterEach(() => window.localStorage.clear());

  function renderizar() {
    return render(
      <MemoryRouter>
        <AvisoCookies />
      </MemoryRouter>
    );
  }

  it("informa que só há cookies essenciais e some depois de lido", async () => {
    const usuario = userEvent.setup();
    const { unmount } = renderizar();
    expect(screen.getByRole("region", { name: "Aviso sobre cookies" })).toHaveTextContent("essenciais");
    expect(screen.getByRole("link", { name: "Saiba mais" })).toHaveAttribute("href", "/privacidade");

    await usuario.click(screen.getByRole("button", { name: "Entendi" }));
    expect(screen.queryByRole("region", { name: "Aviso sobre cookies" })).not.toBeInTheDocument();

    unmount();
    renderizar();
    expect(screen.queryByRole("region", { name: "Aviso sobre cookies" })).not.toBeInTheDocument();
  });

  it("não quebra a página quando o navegador bloqueia o armazenamento", () => {
    const original = Storage.prototype.getItem;
    Storage.prototype.getItem = () => {
      throw new Error("bloqueado");
    };
    renderizar();
    expect(screen.getByRole("region", { name: "Aviso sobre cookies" })).toBeInTheDocument();
    Storage.prototype.getItem = original;
  });
});
