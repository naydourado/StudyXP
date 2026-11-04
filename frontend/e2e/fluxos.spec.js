// fluxos principais do site, de ponta a ponta (navegador + api + banco)
import { expect, test } from "@playwright/test";

const SENHA = "senha-forte-123";

// o aviso de cookies tem teste proprio (privacidade.spec.js); aqui ele ja comeca lido
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => window.localStorage.setItem("studyxp_aviso_cookies", "visto"));
});

function emailUnico() {
  return `aluno.${Date.now()}.${Math.floor(Math.random() * 1e6)}@studyxp.dev`;
}

async function cadastrar(page, nome = "Aluno Teste") {
  const email = emailUnico();
  await page.goto("/cadastro");
  await page.getByLabel("Nome ou apelido").fill(nome);
  await page.getByLabel("E-mail").fill(email);
  await page.getByLabel("Senha").fill(SENHA);
  await page.getByRole("checkbox").nth(0).check();
  await page.getByRole("checkbox").nth(1).check();
  await page.getByRole("button", { name: "Cadastrar" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  return email;
}

test("rotas privadas exigem login", async ({ page }) => {
  await page.goto("/tarefas");
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole("heading", { name: "Entrar" })).toBeVisible();
});

test("cadastro exige termos e maioridade", async ({ page }) => {
  await page.goto("/cadastro");
  await page.getByLabel("Nome ou apelido").fill("Aluno");
  await page.getByLabel("E-mail").fill(emailUnico());
  await page.getByLabel("Senha").fill(SENHA);
  await page.getByRole("button", { name: "Cadastrar" }).click();
  await expect(page.getByRole("alert")).toContainText("Marque as duas confirmações");
});

test("criar e concluir tarefa dá XP; reabrir estorna", async ({ page }) => {
  await cadastrar(page);
  await page.goto("/tarefas");

  await page.getByRole("button", { name: "Nova Tarefa" }).click();
  await page.getByLabel("Título").fill("Estudar Redes");
  await page.getByRole("button", { name: /Alta/ }).click();
  await page.getByRole("button", { name: "Criar tarefa" }).click();
  await expect(page.getByText("Pendentes (1)")).toBeVisible();

  await page.getByRole("button", { name: "Concluir tarefa" }).click();
  await expect(page.getByText("Concluídas (1)")).toBeVisible();
  await expect(page.getByText("+80 XP", { exact: true })).toBeVisible();
  await expect(page.getByText("80 / 100 XP")).toBeVisible();

  await page.getByRole("button", { name: "Reabrir tarefa" }).click();
  await expect(page.getByText("0 / 100 XP")).toBeVisible();
});

test("sessão continua depois de recarregar e termina ao sair", async ({ page }) => {
  await cadastrar(page, "Gabriel");
  await page.reload();
  await expect(page.getByRole("heading", { name: "Olá, Gabriel!" })).toBeVisible();

  await page.getByRole("button", { name: "Sair" }).click();
  await expect(page).toHaveURL(/\/$/);
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/$/);
});

test("humor pede consentimento, registra e some ao revogar", async ({ page }) => {
  await cadastrar(page);
  await page.goto("/humor");

  await expect(page.getByRole("heading", { name: "Antes de começar" })).toBeVisible();
  await page.getByRole("button", { name: "Autorizo o uso dos meus dados de humor" }).click();

  await page.getByRole("radio", { name: "Bom" }).click();
  await page.getByLabel(/nota sobre o seu dia/).fill("Dia produtivo");
  await page.getByRole("button", { name: "Salvar Registro" }).click();
  await expect(page.getByText("Dia produtivo")).toBeVisible();

  await page.goto("/configuracoes");
  page.once("dialog", (dialogo) => dialogo.accept());
  await page.getByRole("switch", { name: "Registro de humor" }).click();
  await expect(page.getByText("Autorização revogada")).toBeVisible();

  await page.goto("/humor");
  await expect(page.getByRole("heading", { name: "Antes de começar" })).toBeVisible();
});

test("temporizador inicia e reseta a sessão de foco", async ({ page }) => {
  await cadastrar(page);
  await page.goto("/foco");
  await expect(page.getByText("25:00")).toBeVisible();

  await page.getByRole("button", { name: "Iniciar" }).click();
  await expect(page.getByText("Focando")).toBeVisible();
  await page.getByRole("button", { name: "Pausar" }).click();
  await expect(page.getByText("Pausado")).toBeVisible();

  await page.getByRole("button", { name: "Resetar" }).click();
  await expect(page.getByText("25:00")).toBeVisible();
  await expect(page.getByText("Pronto")).toBeVisible();
});

test("preferências ficam salvas", async ({ page }) => {
  await cadastrar(page);
  await page.goto("/configuracoes");
  const resumo = page.getByRole("switch", { name: "Resumo semanal" });
  await expect(resumo).toHaveAttribute("aria-checked", "false");
  await resumo.click();
  await page.reload();
  await expect(page.getByRole("switch", { name: "Resumo semanal" })).toHaveAttribute("aria-checked", "true");
});

test("esqueci minha senha responde sem revelar se o e-mail existe", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: "Esqueci minha senha" }).click();
  await page.getByLabel("E-mail").fill("ninguem@studyxp.dev");
  await page.getByRole("button", { name: "Enviar link" }).click();
  await expect(page.getByRole("status")).toContainText("Se o e-mail estiver cadastrado");
});

test("excluir conta apaga o acesso", async ({ page }) => {
  const email = await cadastrar(page);
  await page.goto("/configuracoes");
  await page.getByRole("button", { name: "Excluir conta" }).click();
  await page.getByLabel("Senha").fill(SENHA);
  await page.getByRole("button", { name: "Sim, excluir" }).click();
  await expect(page).toHaveURL(/\/$/);

  await page.getByLabel("E-mail").fill(email);
  await page.getByLabel("Senha").fill(SENHA);
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page.getByRole("alert")).toContainText("E-mail ou senha inválidos");
});

test("páginas legais abrem sem login", async ({ page }) => {
  await page.goto("/privacidade");
  await expect(page.getByRole("heading", { name: "Política de Privacidade" })).toBeVisible();
  await page.goto("/termos");
  await expect(page.getByRole("heading", { name: "Termos de Uso" })).toBeVisible();
});
