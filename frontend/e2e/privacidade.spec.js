// privacidade de ponta a ponta: sem terceiros, so o cookie essencial, aviso de cookies e textos legais
import { expect, test } from "@playwright/test";

const SENHA = "senha-forte-123";

async function cadastrar(page) {
  await page.goto("/cadastro");
  await page.getByLabel("Nome ou apelido").fill("Aluno Privacidade");
  await page.getByLabel("E-mail").fill(`priv.${Date.now()}.${Math.floor(Math.random() * 1e6)}@studyxp.dev`);
  await page.getByLabel("Senha").fill(SENHA);
  await page.getByRole("checkbox").nth(0).check();
  await page.getByRole("checkbox").nth(1).check();
  await page.getByRole("button", { name: "Cadastrar" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
}

test("nenhuma requisição vai para terceiros (sem analytics, fontes ou scripts externos)", async ({ page }) => {
  // percorre 11 telas: leva mais que o tempo padrao de um teste
  test.setTimeout(120_000);
  const externas = new Set();
  page.on("request", (requisicao) => {
    const { hostname, protocol } = new URL(requisicao.url());
    if (protocol.startsWith("http") && !["localhost", "127.0.0.1"].includes(hostname)) externas.add(hostname);
  });

  for (const rota of ["/", "/cadastro", "/privacidade", "/termos"]) {
    await page.goto(rota);
    await page.waitForLoadState("networkidle");
  }
  await cadastrar(page);
  for (const rota of ["/dashboard", "/tarefas", "/progresso", "/foco", "/humor", "/perfil", "/configuracoes"]) {
    await page.goto(rota);
    await page.waitForLoadState("networkidle");
  }

  expect([...externas]).toEqual([]);
});

test("o único cookie é o de sessão, protegido contra scripts", async ({ page, context }) => {
  await cadastrar(page);
  const cookies = await context.cookies();

  expect(cookies.map((c) => c.name)).toEqual(["studyxp_refresh"]);
  const [sessao] = cookies;
  expect(sessao.httpOnly).toBe(true);
  expect(sessao.sameSite).toBe("Lax");
  expect(sessao.path).toBe("/api/v1/auth");
  // o javascript da pagina nao consegue ler o cookie
  expect(await page.evaluate(() => document.cookie)).toBe("");
});

test("aviso de cookies aparece, leva à política e não volta depois de lido", async ({ page }) => {
  await page.goto("/");
  const aviso = page.getByRole("region", { name: "Aviso sobre cookies" });
  await expect(aviso).toContainText("essenciais");

  await aviso.getByRole("link", { name: "Saiba mais" }).click();
  await expect(page.getByRole("heading", { name: "5. Cookies e armazenamento no aparelho" })).toBeVisible();

  await page.getByRole("button", { name: "Entendi" }).click();
  await expect(aviso).toBeHidden();
  await page.reload();
  await expect(page.getByRole("region", { name: "Aviso sobre cookies" })).toBeHidden();
});

test("política e termos mostram versão, resumo e as seções obrigatórias", async ({ page }) => {
  await page.goto("/privacidade");
  await expect(page.getByText(/Versão 2026-10/)).toBeVisible();
  for (const secao of ["Resumo", "1. Quem somos", "2. Dados que tratamos", "9. Seus direitos", "7. Com quem os dados são tratados"]) {
    await expect(page.getByRole("heading", { name: secao })).toBeVisible();
  }

  await page.getByRole("link", { name: "Ler também: Termos de Uso" }).click();
  await expect(page.getByRole("heading", { name: "Termos de Uso", level: 1 })).toBeVisible();
  await expect(page.getByRole("heading", { name: "14. Lei aplicável e foro" })).toBeVisible();
});

test("cadastro explica por que cada dado é pedido e não pede dados desnecessários", async ({ page }) => {
  await page.goto("/cadastro");
  await expect(page.getByText(/Pedimos só o necessário/)).toBeVisible();
  // so nome/apelido, e-mail e senha
  await expect(page.locator("form input:not([type=checkbox])")).toHaveCount(3);
  // aceites desmarcados por padrao (consentimento nao pode ser presumido)
  await expect(page.getByRole("checkbox").nth(0)).not.toBeChecked();
  await expect(page.getByRole("checkbox").nth(1)).not.toBeChecked();
});
