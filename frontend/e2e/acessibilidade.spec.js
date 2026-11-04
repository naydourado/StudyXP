// verificacao automatica de acessibilidade (axe-core, regras wcag 2.1 a/aa)
// falha so com problemas graves ou criticos; os moderados aparecem no relatorio
import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const TELAS_PUBLICAS = ["/", "/cadastro", "/esqueci-senha", "/redefinir-senha?token=abc", "/privacidade", "/termos", "/pagina-que-nao-existe"];
const TELAS_PRIVADAS = ["/dashboard", "/tarefas", "/progresso", "/foco", "/humor", "/perfil", "/configuracoes"];

async function problemasGraves(page) {
  const resultado = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
  return resultado.violations
    .filter((v) => v.impact === "serious" || v.impact === "critical")
    .map((v) => `${v.id}: ${v.help} (${v.nodes.length}x) ${v.nodes[0]?.target}`);
}

for (const tela of TELAS_PUBLICAS) {
  test(`acessibilidade ${tela}`, async ({ page }) => {
    await page.goto(tela);
    await page.waitForLoadState("networkidle");
    expect(await problemasGraves(page)).toEqual([]);
  });
}

test("acessibilidade das telas logadas", async ({ page }) => {
  // percorre 7 telas com analise completa: leva mais que o tempo padrao de um teste
  test.setTimeout(120_000);
  await page.goto("/cadastro");
  await page.getByLabel("Nome ou apelido").fill("Aluno A11y");
  await page.getByLabel("E-mail").fill(`a11y.${Date.now()}@studyxp.dev`);
  await page.getByLabel("Senha").fill("senha-forte-123");
  await page.getByRole("checkbox").nth(0).check();
  await page.getByRole("checkbox").nth(1).check();
  await page.getByRole("button", { name: "Cadastrar" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);

  const encontrados = {};
  for (const tela of TELAS_PRIVADAS) {
    await page.goto(tela);
    await page.waitForLoadState("networkidle");
    const problemas = await problemasGraves(page);
    if (problemas.length) encontrados[tela] = problemas;
  }
  expect(encontrados).toEqual({});
});
