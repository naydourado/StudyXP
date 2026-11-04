import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { formatarMinutos, humorPorValor, nomePrioridade, prazoAtrasado, textoPrazo } from "./gamificacao";

describe("textoPrazo", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 9, 20, 15, 0)); // 20/10/2026
  });
  afterEach(() => vi.useRealTimers());

  it("usa palavras para hoje, amanhã e ontem", () => {
    expect(textoPrazo("2026-10-20")).toBe("Hoje");
    expect(textoPrazo("2026-10-21")).toBe("Amanhã");
    expect(textoPrazo("2026-10-19")).toBe("Ontem");
  });

  it("mostra dia/mês para outras datas e trata sem prazo", () => {
    expect(textoPrazo("2026-11-30")).toBe("30/11");
    expect(textoPrazo(null)).toBe("Sem prazo");
  });

  it("identifica prazo atrasado", () => {
    expect(prazoAtrasado("2026-10-19")).toBe(true);
    expect(prazoAtrasado("2026-10-20")).toBe(false);
    expect(prazoAtrasado(null)).toBe(false);
  });
});

describe("formatação", () => {
  it("formata minutos em horas", () => {
    expect(formatarMinutos(0)).toBe("0min");
    expect(formatarMinutos(45)).toBe("45min");
    expect(formatarMinutos(60)).toBe("1h");
    expect(formatarMinutos(150)).toBe("2h 30min");
  });

  it("traduz prioridade e humor", () => {
    expect(nomePrioridade("media")).toBe("Média");
    expect(humorPorValor("otimo").emoji).toBe("😄");
    expect(humorPorValor("inexistente")).toBeUndefined();
  });
});
