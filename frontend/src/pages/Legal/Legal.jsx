import { Link } from "react-router-dom";

import conteudo from "../../legal/conteudo.json";
import Logo from "../../assets/StudyXP.webp";
import "./Legal.css";

// textos vindos de docs/legal/conteudo.json (fonte unica para site, app e documentos);
// para mudar o texto, edite la e rode: node scripts/sincronizar-legal.mjs

function preencher(texto) {
  return texto.replaceAll("{controlador}", conteudo.controlador).replaceAll("{contato}", conteudo.contato);
}

function Bloco({ bloco, titulo }) {
  if (bloco.tipo === "lista") {
    return (
      <ul>
        {bloco.itens.map((item) => (
          <li key={item}>{preencher(item)}</li>
        ))}
      </ul>
    );
  }

  if (bloco.tipo === "tabela") {
    return (
      <div className="legal-tabela" tabIndex={0} role="region" aria-label={titulo}>
        <table>
          <thead>
            <tr>
              {bloco.cabecalho.map((coluna) => (
                <th key={coluna} scope="col">
                  {coluna}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {bloco.linhas.map((linha) => (
              <tr key={linha[0]}>
                {linha.map((celula, i) => (
                  <td key={i}>{preencher(celula)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return <p>{preencher(bloco.texto)}</p>;
}

function DocumentoLegal({ documento, outro, caminhoOutro }) {
  return (
    <main className="legal-page">
      <article className="legal-card">
        <Link to="/" className="legal-logo">
          <img src={Logo} alt="StudyXP — voltar ao início" width="140" height="37" />
        </Link>

        <h1>{documento.titulo}</h1>
        <p className="legal-versao">
          Versão {conteudo.versao} · Vigente desde {conteudo.vigente_desde} · Projeto acadêmico do UNASP-HT
        </p>

        <section className="legal-resumo" aria-labelledby="titulo-resumo">
          <h2 id="titulo-resumo">Resumo</h2>
          <ul>
            {documento.resumo.map((item) => (
              <li key={item}>{preencher(item)}</li>
            ))}
          </ul>
        </section>

        {documento.secoes.map((secao) => (
          <section key={secao.titulo}>
            <h2>{secao.titulo}</h2>
            {secao.blocos.map((bloco, i) => (
              <Bloco key={i} bloco={bloco} titulo={secao.titulo} />
            ))}
          </section>
        ))}

        <p className="legal-voltar">
          <Link to={caminhoOutro}>Ler também: {outro.titulo}</Link> · <Link to="/">Voltar ao StudyXP</Link>
        </p>
      </article>
    </main>
  );
}

export function Privacidade() {
  return <DocumentoLegal documento={conteudo.privacidade} outro={conteudo.termos} caminhoOutro="/termos" />;
}

export function Termos() {
  return <DocumentoLegal documento={conteudo.termos} outro={conteudo.privacidade} caminhoOutro="/privacidade" />;
}
