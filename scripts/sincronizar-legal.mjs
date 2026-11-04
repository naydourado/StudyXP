// distribui os textos legais (fonte unica: docs/legal/conteudo.json) para o site e o app
// e gera os documentos .md. uso:
//   node scripts/sincronizar-legal.mjs              copia e gera
//   node scripts/sincronizar-legal.mjs --verificar  so confere (usado no CI); falha se algo estiver desatualizado
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const raiz = join(dirname(fileURLToPath(import.meta.url)), "..");
const fonte = join(raiz, "docs/legal/conteudo.json");
const conteudo = JSON.parse(readFileSync(fonte, "utf-8"));
const textoFonte = readFileSync(fonte, "utf-8");

const preencher = (texto) =>
  texto.replaceAll("{controlador}", conteudo.controlador).replaceAll("{contato}", conteudo.contato);

const celula = (texto) => preencher(texto).replaceAll("|", "\\|");

function markdown(documento, outro) {
  const linhas = [
    `# ${documento.titulo} — StudyXP`,
    "",
    `**Versão:** ${conteudo.versao} · **Vigente desde:** ${conteudo.vigente_desde}`,
    "",
    "> Arquivo gerado a partir de `docs/legal/conteudo.json` por `node scripts/sincronizar-legal.mjs`. Não edite à mão.",
    `> O mesmo texto aparece no site e no aplicativo. Veja também: [${outro.titulo}](${outro.arquivo}).`,
    "",
    "## Resumo",
    "",
    ...documento.resumo.map((item) => `- ${preencher(item)}`),
    "",
  ];

  for (const secao of documento.secoes) {
    linhas.push(`## ${secao.titulo}`, "");
    for (const bloco of secao.blocos) {
      if (bloco.tipo === "paragrafo") linhas.push(preencher(bloco.texto), "");
      if (bloco.tipo === "lista") linhas.push(...bloco.itens.map((item) => `- ${preencher(item)}`), "");
      if (bloco.tipo === "tabela") {
        linhas.push(`| ${bloco.cabecalho.map(celula).join(" | ")} |`);
        linhas.push(`|${bloco.cabecalho.map(() => "---").join("|")}|`);
        for (const linha of bloco.linhas) linhas.push(`| ${linha.map(celula).join(" | ")} |`);
        linhas.push("");
      }
    }
  }
  return linhas.join("\n").trimEnd() + "\n";
}

const saidas = [
  [join(raiz, "frontend/src/legal/conteudo.json"), textoFonte],
  [join(raiz, "mobile/src/legal/conteudo.json"), textoFonte],
  [
    join(raiz, "docs/legal/politica-de-privacidade.md"),
    markdown(conteudo.privacidade, { titulo: conteudo.termos.titulo, arquivo: "termos-de-uso.md" }),
  ],
  [
    join(raiz, "docs/legal/termos-de-uso.md"),
    markdown(conteudo.termos, { titulo: conteudo.privacidade.titulo, arquivo: "politica-de-privacidade.md" }),
  ],
];

const verificar = process.argv.includes("--verificar");
let desatualizados = 0;

for (const [caminho, texto] of saidas) {
  const atual = existsSync(caminho) ? readFileSync(caminho, "utf-8") : null;
  if (atual === texto) continue;
  if (verificar) {
    console.error(`desatualizado: ${caminho.replace(raiz, ".")}`);
    desatualizados += 1;
  } else {
    writeFileSync(caminho, texto, "utf-8");
    console.log(`atualizado: ${caminho.replace(raiz, ".")}`);
  }
}

// a versao dos textos precisa ser a mesma que a api exige no aceite (TERMOS_VERSAO)
const config = readFileSync(join(raiz, "backend/app/core/config.py"), "utf-8");
const versaoApi = config.match(/termos_versao: str = "([^"]+)"/)?.[1];
if (versaoApi !== conteudo.versao) {
  console.error(`versao dos textos (${conteudo.versao}) diferente da TERMOS_VERSAO da api (${versaoApi})`);
  desatualizados += 1;
}

if (desatualizados && (verificar || versaoApi !== conteudo.versao)) {
  console.error("Rode: node scripts/sincronizar-legal.mjs");
  process.exit(1);
}
console.log(verificar ? "textos legais em dia" : `versão ${conteudo.versao} distribuída`);
